package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryDropRuleRepository
import br.com.woodriver.infinity_grove_ws.InMemoryEquipmentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryPlayerCardsRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.InMemoryWalletRepository
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.SequenceChanceRoller
import br.com.woodriver.infinity_grove_ws.SequenceDropRoller
import br.com.woodriver.infinity_grove_ws.domain.Affix
import br.com.woodriver.infinity_grove_ws.domain.AffixType
import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.DropTable
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.EquipmentNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import br.com.woodriver.infinity_grove_ws.domain.HeroNotOwnedException
import br.com.woodriver.infinity_grove_ws.domain.HeroSeed
import br.com.woodriver.infinity_grove_ws.domain.InvalidAffixException
import br.com.woodriver.infinity_grove_ws.domain.InvalidSellBatchException
import br.com.woodriver.infinity_grove_ws.domain.MaxRefineException
import br.com.woodriver.infinity_grove_ws.domain.NotEnoughCopperException
import br.com.woodriver.infinity_grove_ws.domain.Piece
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.PlayerCardsMissingException
import br.com.woodriver.infinity_grove_ws.domain.Rarity
import br.com.woodriver.infinity_grove_ws.domain.RefineTooLowException
import br.com.woodriver.infinity_grove_ws.domain.Slot
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.Wallet
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class EquipmentServiceTest {
    private val users = InMemoryUserRepository()
    private val playerCards = InMemoryPlayerCardsRepository()
    private val pieces = InMemoryEquipmentRepository()
    private val rules = EquipmentRules()
    private val wallets = InMemoryWalletRepository()
    private val table = DropTable(listOf(DropRule(1, 1, 5, 1500)))
    private val walletAccess =
        WalletAccess(wallets, InMemoryDropRuleRepository(*table.rules.toTypedArray()), SequenceDropRoller(1), MutableClock(1_000L))
    private var chance = SequenceChanceRoller(0.0)
    private val service get() = EquipmentService(pieces, playerCards, users, walletAccess, chance, rules)

    private fun player() {
        users.save(User("yan", "hash", 1L, 1L))
        playerCards.save(PlayerCards.start("yan", Element.FIRE, HeroSeed.heroes()).add("lyra"))
    }

    private fun ring(
        id: String,
        heroId: String? = null,
        username: String = "yan",
    ) = Piece(id, username, Slot.RING, Rarity.COMMON, null, 0, listOf(Affix(AffixType.CRIT_CHANCE, 2)), heroId).also { pieces.save(it) }

    @Test
    fun `list returns every piece of the player with the bag capacity`() {
        player()
        ring("a")
        ring("b", "kael")
        ring("c", username = "other")

        val equipment = service.list("yan")

        assertEquals(listOf("a", "b"), equipment.pieces.map { it.id })
        assertEquals(100, equipment.capacity)
    }

    @Test
    fun `list for an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.list("ghost") }
    }

    @Test
    fun `equip puts the piece on an owned hero and stores it`() {
        player()
        ring("a")

        val equipment = service.equip("yan", "a", "kael")

        assertEquals("kael", equipment.find("a").heroId)
        assertEquals("kael", pieces.pieces.getValue("a").heroId)
    }

    @Test
    fun `equip on a taken slot returns the old piece to the bag`() {
        player()
        ring("old", "kael")
        ring("new")

        val equipment = service.equip("yan", "new", "kael")

        assertEquals("kael", pieces.pieces.getValue("new").heroId)
        assertNull(pieces.pieces.getValue("old").heroId)
        assertEquals(2, equipment.pieces.size)
    }

    @Test
    fun `equip moves a piece from the hero wearing it to another`() {
        player()
        ring("a", "kael")

        service.equip("yan", "a", "lyra")

        assertEquals("lyra", pieces.pieces.getValue("a").heroId)
    }

    @Test
    fun `equip on a hero the player does not own is refused and changes nothing`() {
        player()
        ring("a")

        assertFailsWith<HeroNotOwnedException> { service.equip("yan", "a", "vex") }

        assertNull(pieces.pieces.getValue("a").heroId)
    }

    @Test
    fun `equip of a missing piece or of a piece of another account is not found`() {
        player()
        ring("theirs", username = "other")

        assertFailsWith<EquipmentNotFoundException> { service.equip("yan", "ghost", "kael") }
        assertFailsWith<EquipmentNotFoundException> { service.equip("yan", "theirs", "kael") }
        assertNull(pieces.pieces.getValue("theirs").heroId)
    }

    @Test
    fun `unequip empties the slot and keeps the piece`() {
        player()
        ring("a", "kael")

        val equipment = service.unequip("yan", "a")

        assertNull(equipment.find("a").heroId)
        assertNull(pieces.pieces.getValue("a").heroId)
        assertEquals(1, pieces.pieces.size)
    }

    @Test
    fun `unequip of a missing piece or of another account piece is not found`() {
        player()
        ring("theirs", "kael", username = "other")

        assertFailsWith<EquipmentNotFoundException> { service.unequip("yan", "ghost") }
        assertFailsWith<EquipmentNotFoundException> { service.unequip("yan", "theirs") }
        assertEquals("kael", pieces.pieces.getValue("theirs").heroId)
    }

    @Test
    fun `a change for an unknown user or a player without cards fails`() {
        assertFailsWith<UserNotFoundException> { service.equip("ghost", "a", "kael") }
        users.save(User("yan", "hash", 1L, 1L))
        assertFailsWith<PlayerCardsMissingException> { service.equip("yan", "a", "kael") }
        assertFailsWith<PlayerCardsMissingException> { service.unequip("yan", "a") }
    }

    private fun funded(copper: Long) {
        wallets.save(Wallet.open("yan", table, SequenceDropRoller(1), 0).copy(copper = copper))
    }

    private fun weapon(
        id: String,
        refine: Int = 0,
        rarity: Rarity = Rarity.COMMON,
    ) = Piece(id, "yan", Slot.WEAPON, rarity, 3, refine, emptyList()).also { pieces.save(it) }

    @Test
    fun `refine spends the cost, raises the level by one and returns the new wallet`() {
        player()
        weapon("w")
        funded(600)

        val change = service.refine("yan", "w")

        assertEquals(1, change.equipment.find("w").refine)
        assertEquals(1, pieces.pieces.getValue("w").refine)
        assertEquals(100L, change.wallet.copper)
        assertEquals(100L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `refine charges the rarity multiplied cost of the current level`() {
        player()
        weapon("w", refine = 3, rarity = Rarity.RARE)
        funded(10_000)

        val change = service.refine("yan", "w")

        assertEquals(10_000L - 7368L, change.wallet.copper)
    }

    @Test
    fun `refine with too little copper is refused and changes neither the piece nor the wallet`() {
        player()
        weapon("w")
        funded(499)

        assertFailsWith<NotEnoughCopperException> { service.refine("yan", "w") }

        assertEquals(0, pieces.pieces.getValue("w").refine)
        assertEquals(499L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `refine of a piece at plus 10 is refused and changes nothing`() {
        player()
        weapon("w", refine = 10)
        funded(1_000_000)

        assertFailsWith<MaxRefineException> { service.refine("yan", "w") }

        assertEquals(1_000_000L, wallets.wallets.getValue("yan").copper)
        assertEquals(10, pieces.pieces.getValue("w").refine)
    }

    @Test
    fun `refine creates the missing wallet and refuses for lack of copper`() {
        player()
        weapon("w")

        assertFailsWith<NotEnoughCopperException> { service.refine("yan", "w") }

        assertEquals(0L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `refine of a missing piece or a piece of another account is not found and spends nothing`() {
        player()
        funded(10_000)
        Piece("theirs", "other", Slot.WEAPON, Rarity.COMMON, 3, 0, emptyList()).also { pieces.save(it) }

        assertFailsWith<EquipmentNotFoundException> { service.refine("yan", "ghost") }
        assertFailsWith<EquipmentNotFoundException> { service.refine("yan", "theirs") }

        assertEquals(10_000L, wallets.wallets.getValue("yan").copper)
        assertEquals(0, pieces.pieces.getValue("theirs").refine)
    }

    private fun rerollable(
        id: String = "w",
        refine: Int = 5,
    ) = Piece(
        id,
        "yan",
        Slot.WEAPON,
        Rarity.UNCOMMON,
        3,
        refine,
        listOf(Affix(AffixType.CRIT_CHANCE, 2), Affix(AffixType.BOSS_DAMAGE_PCT, 6)),
    ).also { pieces.save(it) }

    @Test
    fun `reroll replaces the chosen affix, keeps the other and the level and spends 5000`() {
        player()
        rerollable()
        funded(6_000)

        val change = service.reroll("yan", "w", 0)

        val piece = change.equipment.find("w")
        assertEquals(Affix(AffixType.CRIT_DAMAGE_PCT, 20), piece.affixes[0])
        assertEquals(Affix(AffixType.BOSS_DAMAGE_PCT, 6), piece.affixes[1])
        assertEquals(5, piece.refine)
        assertEquals(piece, pieces.pieces.getValue("w"))
        assertEquals(1_000L, change.wallet.copper)
        assertEquals(1_000L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `reroll below level 5 is refused and changes nothing`() {
        player()
        val before = rerollable(refine = 4)
        funded(6_000)

        assertFailsWith<RefineTooLowException> { service.reroll("yan", "w", 0) }

        assertEquals(before, pieces.pieces.getValue("w"))
        assertEquals(6_000L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `reroll with less than 5000 copper is refused and changes nothing`() {
        player()
        val before = rerollable()
        funded(4_999)

        assertFailsWith<NotEnoughCopperException> { service.reroll("yan", "w", 0) }

        assertEquals(before, pieces.pieces.getValue("w"))
        assertEquals(4_999L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `reroll of an affix the piece does not have is refused and changes nothing`() {
        player()
        val before = rerollable()
        funded(6_000)

        assertFailsWith<InvalidAffixException> { service.reroll("yan", "w", 2) }
        assertFailsWith<InvalidAffixException> { service.reroll("yan", "w", -1) }

        assertEquals(before, pieces.pieces.getValue("w"))
        assertEquals(6_000L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `reroll of a missing piece is not found and spends nothing`() {
        player()
        funded(6_000)

        assertFailsWith<EquipmentNotFoundException> { service.reroll("yan", "ghost", 0) }

        assertEquals(6_000L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `sell removes the piece and credits its sell price`() {
        player()
        weapon("w")
        funded(50)

        val change = service.sell("yan", "w")

        assertEquals(0, change.equipment.pieces.size)
        assertEquals(0, pieces.pieces.size)
        assertEquals(150L, change.wallet.copper)
        assertEquals(150L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `sell prices a refined rare piece by its level`() {
        player()
        weapon("w", refine = 4, rarity = Rarity.RARE)
        funded(0)

        assertEquals(900L, service.sell("yan", "w").wallet.copper)
    }

    @Test
    fun `sell of a worn piece takes it off the hero and sells it`() {
        player()
        weapon("w")
        service.equip("yan", "w", "kael")
        funded(0)

        val change = service.sell("yan", "w")

        assertEquals(100L, change.wallet.copper)
        assertEquals(emptyList(), change.equipment.worn("kael"))
        assertEquals(0, pieces.pieces.size)
    }

    @Test
    fun `sell creates the missing wallet before crediting`() {
        player()
        weapon("w")

        assertEquals(100L, service.sell("yan", "w").wallet.copper)
    }

    @Test
    fun `sell of a missing piece or of a piece of another account is not found and credits nothing`() {
        player()
        funded(10)
        Piece("theirs", "other", Slot.WEAPON, Rarity.COMMON, 3, 0, emptyList()).also { pieces.save(it) }

        assertFailsWith<EquipmentNotFoundException> { service.sell("yan", "ghost") }
        assertFailsWith<EquipmentNotFoundException> { service.sell("yan", "theirs") }

        assertEquals(10L, wallets.wallets.getValue("yan").copper)
        assertEquals(1, pieces.pieces.size)
    }

    @Test
    fun `sellAll removes every listed piece and credits the sum of their prices`() {
        player()
        weapon("c")
        weapon("r", refine = 4, rarity = Rarity.RARE)
        weapon("u", rarity = Rarity.UNCOMMON)
        weapon("keep")
        funded(50)

        val sale = service.sellAll("yan", listOf("c", "r", "u"))

        assertEquals(3, sale.sold)
        assertEquals(1200L, sale.earned)
        assertEquals(1250L, sale.wallet.copper)
        assertEquals(1250L, wallets.wallets.getValue("yan").copper)
        assertEquals(setOf("keep"), pieces.pieces.keys)
        assertEquals(listOf("keep"), sale.equipment.pieces.map { it.id })
    }

    @Test
    fun `sellAll of a worn piece takes it off the hero and sells it`() {
        player()
        weapon("w")
        service.equip("yan", "w", "kael")
        funded(0)

        val sale = service.sellAll("yan", listOf("w"))

        assertEquals(100L, sale.wallet.copper)
        assertEquals(emptyList<Piece>(), sale.equipment.worn("kael"))
        assertEquals(0, pieces.pieces.size)
    }

    @Test
    fun `sellAll with one id the player does not own sells nothing and credits nothing`() {
        player()
        weapon("a")
        funded(10)
        Piece("theirs", "other", Slot.WEAPON, Rarity.COMMON, 3, 0, emptyList()).also { pieces.save(it) }

        assertFailsWith<EquipmentNotFoundException> { service.sellAll("yan", listOf("a", "theirs")) }
        assertFailsWith<EquipmentNotFoundException> { service.sellAll("yan", listOf("a", "ghost")) }

        assertEquals(10L, wallets.wallets.getValue("yan").copper)
        assertEquals(setOf("a", "theirs"), pieces.pieces.keys)
    }

    @Test
    fun `sellAll of a batch already sold is not found and pays once`() {
        player()
        weapon("a")
        weapon("b")
        funded(0)

        assertEquals(200L, service.sellAll("yan", listOf("a", "b")).wallet.copper)
        assertFailsWith<EquipmentNotFoundException> { service.sellAll("yan", listOf("a", "b")) }

        assertEquals(200L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `sellAll of an empty or repeating batch is refused and changes nothing`() {
        player()
        weapon("a")
        funded(10)

        assertFailsWith<InvalidSellBatchException> { service.sellAll("yan", emptyList()) }
        assertFailsWith<InvalidSellBatchException> { service.sellAll("yan", listOf("a", "a")) }

        assertEquals(10L, wallets.wallets.getValue("yan").copper)
        assertEquals(setOf("a"), pieces.pieces.keys)
    }

    @Test
    fun `sellAll creates the missing wallet before crediting`() {
        player()
        weapon("a")

        assertEquals(100L, service.sellAll("yan", listOf("a")).wallet.copper)
    }

    @Test
    fun `sellAll for an unknown user or a player without cards fails`() {
        assertFailsWith<UserNotFoundException> { service.sellAll("ghost", listOf("a")) }
        users.save(User("yan", "hash", 1L, 1L))
        assertFailsWith<PlayerCardsMissingException> { service.sellAll("yan", listOf("a")) }
    }
}
