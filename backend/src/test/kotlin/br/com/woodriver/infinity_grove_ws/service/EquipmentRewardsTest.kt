package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryDropRuleRepository
import br.com.woodriver.infinity_grove_ws.InMemoryEquipmentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryLegacyRepository
import br.com.woodriver.infinity_grove_ws.InMemoryWalletRepository
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.SequenceChanceRoller
import br.com.woodriver.infinity_grove_ws.SequenceDropRoller
import br.com.woodriver.infinity_grove_ws.SequenceIds
import br.com.woodriver.infinity_grove_ws.domain.Affix
import br.com.woodriver.infinity_grove_ws.domain.AffixType
import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.DropTable
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.EquipmentDrop
import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import br.com.woodriver.infinity_grove_ws.domain.Piece
import br.com.woodriver.infinity_grove_ws.domain.Rarity
import br.com.woodriver.infinity_grove_ws.domain.ResetLegacy
import br.com.woodriver.infinity_grove_ws.domain.Slot
import br.com.woodriver.infinity_grove_ws.domain.Wallet
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class EquipmentRewardsTest {
    private val pieces = InMemoryEquipmentRepository()
    private val wallets = InMemoryWalletRepository()
    private val legacies = InMemoryLegacyRepository()
    private val table = DropTable(listOf(DropRule(1, 1, 5, 1500)))
    private val walletAccess =
        WalletAccess(wallets, InMemoryDropRuleRepository(*table.rules.toTypedArray()), SequenceDropRoller(1), MutableClock(1_000L))

    /** Every scripted chance is 0.0: the drop passes, the rarity is the lowest the encounter allows and every pick takes the first option. */
    private fun rewards(
        rules: EquipmentRules = EquipmentRules(),
        chance: SequenceChanceRoller = SequenceChanceRoller(0.0),
    ) = EquipmentRewards(pieces, walletAccess, chance, SequenceIds(), rules, legacies)

    private fun ring(id: String) = Piece(id, "yan", Slot.RING, Rarity.COMMON, null, 0, listOf(Affix(AffixType.CRIT_CHANCE, 2)))

    private val uncommonWeapon =
        Piece(
            "piece-1",
            "yan",
            Slot.WEAPON,
            Rarity.UNCOMMON,
            4,
            0,
            listOf(Affix(AffixType.CRIT_CHANCE, 3), Affix(AffixType.CRIT_DAMAGE_PCT, 20)),
        )

    @Test
    fun `a chapter boss win stores the rolled piece and returns it unsold`() {
        val drop = rewards().award("yan", Encounter.CHAPTER_BOSS, 5)

        assertEquals(EquipmentDrop(uncommonWeapon, sold = false), drop)
        assertEquals(listOf(uncommonWeapon), pieces.findAll("yan"))
    }

    @Test
    fun `a miniboss win whose roll fails returns null and stores nothing`() {
        val drop = rewards(chance = SequenceChanceRoller(0.5)).award("yan", Encounter.MINIBOSS, 5)

        assertNull(drop)
        assertTrue(pieces.pieces.isEmpty())
    }

    @Test
    fun `a miniboss win whose roll passes stores a piece`() {
        val drop = rewards(chance = SequenceChanceRoller(0.2, 0.0)).award("yan", Encounter.MINIBOSS, 5)

        assertEquals(Rarity.COMMON, drop!!.piece.rarity)
        assertEquals(listOf(drop.piece), pieces.findAll("yan"))
    }

    @Test
    fun `a phase win rolls nothing`() {
        val chance = SequenceChanceRoller(0.0)

        assertNull(rewards(chance = chance).award("yan", Encounter.PHASE, 5))
        assertEquals(0, chance.reads)
        assertTrue(pieces.pieces.isEmpty())
    }

    @Test
    fun `a miss touches no wallet`() {
        rewards(chance = SequenceChanceRoller(0.5)).award("yan", Encounter.MINIBOSS, 5)

        assertTrue(wallets.wallets.isEmpty())
    }

    @Test
    fun `a drop into a full bag is sold into the wallet and not stored`() {
        pieces.save(ring("r1"))
        pieces.save(ring("r2"))
        wallets.save(Wallet.open("yan", table, SequenceDropRoller(1), 0).copy(copper = 1_000))

        val drop = rewards(EquipmentRules(bagCapacity = 2)).award("yan", Encounter.CHAPTER_BOSS, 5)

        assertEquals(EquipmentDrop(uncommonWeapon, sold = true), drop)
        assertEquals(listOf("r1", "r2"), pieces.findAll("yan").map { it.id })
        assertEquals(1_000L + uncommonWeapon.sellPrice(), wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `a full bag with no wallet creates the wallet with the sell price`() {
        pieces.save(ring("r1"))

        rewards(EquipmentRules(bagCapacity = 1)).award("yan", Encounter.CHAPTER_BOSS, 5)

        assertEquals(200L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `the bag of another player does not count`() {
        pieces.save(ring("r1").copy(username = "other"))

        val drop = rewards(EquipmentRules(bagCapacity = 1)).award("yan", Encounter.CHAPTER_BOSS, 5)

        assertEquals(false, drop!!.sold)
        assertTrue(wallets.wallets.isEmpty())
    }

    private fun legacyOf(vararg percents: Pair<Int, Int>) = legacies.save(ResetLegacy("yan", mapOf(*percents)))

    @Test
    fun `a chapter 2 boss piece with 50 percent of chapter 5 and legacy roll 0 point 2 rolls the chapter 5 weights`() {
        legacyOf(5 to 50)

        // the legacy roll, the drop, then the rarity: 0.97 is LEGENDARY in the chapter 5 table (40 / 40 / 15 / 5)
        val drop = rewards(chance = SequenceChanceRoller(0.2, 0.0, 0.97, 0.0)).award("yan", Encounter.CHAPTER_BOSS, 2)

        assertEquals(Rarity.LEGENDARY, drop!!.piece.rarity)
    }

    @Test
    fun `the same piece with legacy roll 0 point 5 rolls the chapter 2 weights`() {
        legacyOf(5 to 50)

        // 0.97 is UNCOMMON in the chapter 2 table (30 / 70)
        val drop = rewards(chance = SequenceChanceRoller(0.5, 0.0, 0.97, 0.0)).award("yan", Encounter.CHAPTER_BOSS, 2)

        assertEquals(Rarity.UNCOMMON, drop!!.piece.rarity)
    }

    @Test
    fun `a piece in chapter 6 with 100 percent of chapter 5 makes no legacy roll`() {
        legacyOf(5 to 100)
        val chance = SequenceChanceRoller(0.0)

        val drop = rewards(chance = chance).award("yan", Encounter.CHAPTER_BOSS, 6)

        assertEquals(EquipmentDrop(uncommonWeapon, sold = false), drop)
        val plain = SequenceChanceRoller(0.0)
        EquipmentRewards(InMemoryEquipmentRepository(), walletAccess, plain, SequenceIds(), EquipmentRules(), InMemoryLegacyRepository())
            .award("yan", Encounter.CHAPTER_BOSS, 6)
        assertEquals(plain.reads, chance.reads)
    }

    @Test
    fun `a player without legacy makes no legacy roll`() {
        // the first read is the drop, the second the rarity: 0.97 is UNCOMMON in the chapter 2 table
        val drop = rewards(chance = SequenceChanceRoller(0.0, 0.97, 0.0)).award("yan", Encounter.CHAPTER_BOSS, 2)

        assertEquals(Rarity.UNCOMMON, drop!!.piece.rarity)
    }

    @Test
    fun `a farm piece of chapter 1 with 100 percent of chapter 5 uses the chapter 5 weights`() {
        legacyOf(5 to 100)

        // legacy roll 0.99 is below 1.0, so the rarity 0.97 is LEGENDARY in the chapter 5 table
        val drop = rewards(chance = SequenceChanceRoller(0.99, 0.0, 0.97, 0.0)).award("yan", Encounter.CHAPTER_BOSS, 1)

        assertEquals(Rarity.LEGENDARY, drop!!.piece.rarity)
    }

    @Test
    fun `the drop rate stays 0 point 5 for a miniboss with a legacy`() {
        legacyOf(5 to 50)

        // the legacy roll 0.0 passes, the drop chance 0.5 is not below the miniboss rate 0.5
        val drop = rewards(chance = SequenceChanceRoller(0.0, 0.5)).award("yan", Encounter.MINIBOSS, 1)

        assertNull(drop)
        assertTrue(pieces.pieces.isEmpty())
    }
}
