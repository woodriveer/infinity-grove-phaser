package br.com.woodriver.infinity_grove_ws

import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.DropTable
import br.com.woodriver.infinity_grove_ws.domain.Hero
import br.com.woodriver.infinity_grove_ws.domain.Piece
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.RefreshToken
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.Wallet
import br.com.woodriver.infinity_grove_ws.port.AccessToken
import br.com.woodriver.infinity_grove_ws.port.AccessTokenIssuerPort
import br.com.woodriver.infinity_grove_ws.port.ChanceRollerPort
import br.com.woodriver.infinity_grove_ws.port.ChapterRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import br.com.woodriver.infinity_grove_ws.port.DropRuleRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.EquipmentRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.HeroRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.IdGeneratorPort
import br.com.woodriver.infinity_grove_ws.port.PasswordHasherPort
import br.com.woodriver.infinity_grove_ws.port.PlayerCardsRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.ProgressRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.RefreshTokenRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.RefreshTokenSecretPort
import br.com.woodriver.infinity_grove_ws.port.TalentRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.WalletRepositoryPort
import java.time.Clock
import java.time.Instant
import java.time.ZoneId

class FakePasswordHasher : PasswordHasherPort {
    override fun hash(rawPassword: String) = "hashed:$rawPassword"

    override fun matches(
        rawPassword: String,
        hashedPassword: String,
    ) = hash(rawPassword) == hashedPassword
}

class InMemoryUserRepository : UserRepositoryPort {
    val users = linkedMapOf<String, User>()

    override fun save(user: User): User = user.also { users[it.username] = it }

    override fun findByUsername(username: String) = users[username]

    override fun findAll() = users.values.toList()

    override fun existsByUsername(username: String) = users.containsKey(username)

    override fun deleteByUsername(username: String) {
        users.remove(username)
    }
}

class InMemoryRefreshTokenRepository : RefreshTokenRepositoryPort {
    val tokens = linkedMapOf<String, RefreshToken>()

    override fun save(token: RefreshToken): RefreshToken = token.also { tokens[it.tokenHash] = it }

    override fun findByHash(tokenHash: String) = tokens[tokenHash]

    override fun revokeAllByUsername(username: String) {
        tokens.replaceAll { _, token -> if (token.username == username) token.revoke() else token }
    }

    override fun deleteAllByUsername(username: String) {
        tokens.values.removeIf { it.username == username }
    }
}

class FakeAccessTokenIssuer : AccessTokenIssuerPort {
    override fun issue(
        username: String,
        now: Long,
    ) = AccessToken(value = "access:$username:$now", expiresAt = now + ACCESS_TTL_MS)

    companion object {
        const val ACCESS_TTL_MS = 24L * 60 * 60 * 1000
    }
}

class FakeRefreshTokenSecrets : RefreshTokenSecretPort {
    private var counter = 0

    override fun generate() = "raw-${++counter}"

    override fun hash(raw: String) = "sha:$raw"
}

/** Clock whose current instant can be moved by tests. */
class MutableClock(
    var millis: Long,
) : Clock() {
    override fun getZone(): ZoneId = ZoneId.of("UTC")

    override fun withZone(zone: ZoneId?): Clock = this

    override fun instant(): Instant = Instant.ofEpochMilli(millis)
}

class InMemoryWalletRepository : WalletRepositoryPort {
    val wallets = linkedMapOf<String, Wallet>()

    override fun findForUpdate(username: String) = wallets[username]

    override fun createIfAbsent(wallet: Wallet) {
        wallets.putIfAbsent(wallet.username, wallet)
    }

    override fun save(wallet: Wallet): Wallet = wallet.also { wallets[it.username] = it }

    override fun deleteByUsername(username: String) {
        wallets.remove(username)
    }
}

/** Drop rules by id; a test changes or adds rules between calls to act as an operator tuning the table. */
class InMemoryDropRuleRepository(
    vararg rules: DropRule,
) : DropRuleRepositoryPort {
    val rules = sortedMapOf<Int, DropRule>().apply { rules.forEach { put(it.id, it) } }

    override fun findAll() = DropTable(rules.values.toList())

    override fun existsById(id: Int) = id in rules

    override fun save(rule: DropRule) {
        rules[rule.id] = rule
    }
}

class InMemoryProgressRepository : ProgressRepositoryPort {
    val progresses = linkedMapOf<String, Progress>()

    override fun findForUpdate(username: String) = progresses[username]

    override fun createIfAbsent(progress: Progress) {
        progresses.putIfAbsent(progress.username, progress)
    }

    override fun save(progress: Progress): Progress = progress.also { progresses[it.username] = it }

    override fun deleteByUsername(username: String) {
        progresses.remove(username)
    }
}

class InMemoryChapterRepository(
    vararg chapters: ChapterDefinition,
) : ChapterRepositoryPort {
    val chapters = chapters.associateBy { it.number }.toMutableMap()

    override fun findByNumber(number: Int) = chapters[number]

    override fun existsByNumber(number: Int) = chapters.containsKey(number)

    override fun save(chapter: ChapterDefinition): ChapterDefinition = chapter.also { chapters[it.number] = it }
}

/** Rolls the scripted values in order, cycling; fails when a value is outside the range the caller asked for. */
class SequenceDropRoller(
    private vararg val values: Int,
) : DropRollerPort {
    private var next = 0

    override fun roll(
        min: Int,
        max: Int,
    ): Int {
        val value = values[next++ % values.size]
        require(value in min..max) { "Scripted value $value is outside $min..$max" }
        return value
    }
}

class InMemoryHeroRepository(
    vararg heroes: Hero,
) : HeroRepositoryPort {
    private val ordered = sortedMapOf<Int, Hero>().also { map -> heroes.forEachIndexed { index, hero -> map[index] = hero } }

    override fun findAll() = ordered.values.toList()

    override fun findById(id: String) = ordered.values.firstOrNull { it.id == id }

    override fun existsById(id: String) = findById(id) != null

    override fun save(
        hero: Hero,
        order: Int,
    ) {
        ordered.values.removeIf { it.id == hero.id }
        ordered[order] = hero
    }
}

class InMemoryPlayerCardsRepository : PlayerCardsRepositoryPort {
    val cards = linkedMapOf<String, PlayerCards>()

    override fun findForUpdate(username: String) = cards[username]

    override fun createIfAbsent(cards: PlayerCards) {
        this.cards.putIfAbsent(cards.username, cards)
    }

    override fun save(cards: PlayerCards): PlayerCards = cards.also { this.cards[it.username] = it }

    override fun deleteByUsername(username: String) {
        cards.remove(username)
    }
}

/** Rolls the scripted chances in order, cycling; counts how many were read. */
class SequenceChanceRoller(
    private vararg val values: Double,
) : ChanceRollerPort {
    var reads = 0
        private set

    override fun roll(): Double {
        val value = values[reads % values.size]
        reads += 1
        require(value >= 0.0 && value < 1.0) { "Scripted chance $value is outside 0 (inclusive) to 1 (exclusive)" }
        return value
    }
}

class InMemoryEquipmentRepository : EquipmentRepositoryPort {
    val pieces = linkedMapOf<String, Piece>()

    override fun findAll(username: String) = pieces.values.filter { it.username == username }

    override fun save(piece: Piece): Piece = piece.also { pieces[it.id] = it }

    override fun delete(id: String) {
        pieces.remove(id)
    }

    override fun deleteByUsername(username: String) {
        pieces.values.removeIf { it.username == username }
    }
}

class InMemoryTalentRepository : TalentRepositoryPort {
    val levels = linkedMapOf<Pair<String, String>, Int>()
    val awards = linkedMapOf<Pair<String, String>, Int>()

    override fun findAll(username: String) = levels.filterKeys { it.first == username }.mapKeys { it.key.second }

    override fun save(
        username: String,
        talentId: String,
        level: Int,
    ) {
        levels[username to talentId] = level
    }

    override fun earnedPoints(username: String) = awards.filterKeys { it.first == username }.values.sum()

    override fun award(
        username: String,
        key: String,
        points: Int,
    ): Boolean = awards.putIfAbsent(username to key, points) == null

    override fun deleteByUsername(username: String) {
        levels.keys.removeIf { it.first == username }
        awards.keys.removeIf { it.first == username }
    }
}

/** Hands out `piece-1`, `piece-2`, ... */
class SequenceIds : IdGeneratorPort {
    private var count = 0

    override fun next() = "piece-${++count}"
}
