package br.com.woodriver.infinity_grove_ws

import br.com.woodriver.infinity_grove_ws.domain.RefreshToken
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.port.AccessToken
import br.com.woodriver.infinity_grove_ws.port.AccessTokenIssuerPort
import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import br.com.woodriver.infinity_grove_ws.port.PasswordHasherPort
import br.com.woodriver.infinity_grove_ws.port.RefreshTokenRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.RefreshTokenSecretPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
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
