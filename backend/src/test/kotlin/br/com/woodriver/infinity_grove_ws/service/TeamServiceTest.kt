package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryDropRuleRepository
import br.com.woodriver.infinity_grove_ws.InMemoryHeroRepository
import br.com.woodriver.infinity_grove_ws.InMemoryPlayerCardsRepository
import br.com.woodriver.infinity_grove_ws.InMemoryTeamRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.InMemoryWalletRepository
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.SequenceDropRoller
import br.com.woodriver.infinity_grove_ws.domain.BossRecord
import br.com.woodriver.infinity_grove_ws.domain.CopyKey
import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.DropTable
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.HeroNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.HeroNotOwnedException
import br.com.woodriver.infinity_grove_ws.domain.HeroSeed
import br.com.woodriver.infinity_grove_ws.domain.InvalidTeamException
import br.com.woodriver.infinity_grove_ws.domain.NotEnoughCopperException
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.Team
import br.com.woodriver.infinity_grove_ws.domain.TeamLockedException
import br.com.woodriver.infinity_grove_ws.domain.TeamSlotLockedException
import br.com.woodriver.infinity_grove_ws.domain.TeamSlotMismatchException
import br.com.woodriver.infinity_grove_ws.domain.TeamSlotNotBoughtException
import br.com.woodriver.infinity_grove_ws.domain.TeamView
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.Wallet
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class TeamServiceTest {
    private val users = InMemoryUserRepository()
    private val cards = InMemoryPlayerCardsRepository()
    private val teams = InMemoryTeamRepository()
    private val heroes = InMemoryHeroRepository(*HeroSeed.heroes().toTypedArray())
    private val wallets = InMemoryWalletRepository()
    private val table = DropTable(listOf(DropRule(1, 1, 5, 1500)))
    private val walletAccess =
        WalletAccess(wallets, InMemoryDropRuleRepository(*table.rules.toTypedArray()), SequenceDropRoller(1), MutableClock(1_000L))
    private val service = TeamService(cards, teams, heroes, users, walletAccess)

    private fun funded(copper: Long) {
        wallets.save(Wallet.open("yan", table, SequenceDropRoller(1), 0).copy(copper = copper))
    }

    /** Kael is the leader; Lyra, Orina and Seraphine hold a blank card each; Vex is not owned. */
    private fun player(cleared: Set<Int>): PlayerCards {
        users.save(User("yan", "hash", 1L, 1L))
        val started = PlayerCards.start("yan", Element.FIRE, HeroSeed.heroes())
        val extra = listOf("lyra", "orina", "seraphine").associate { CopyKey(it, 0) to 1 }
        return cards.save(started.copy(copies = started.copies + extra, bosses = BossRecord(cleared)))
    }

    @Test
    fun `save stores owned heroes in bought slots and answers the leader and the team`() {
        player(setOf(5, 6))
        teams.save("yan", Team(2))

        val change = service.saveAllies("yan", listOf("lyra", "orina", null, null))

        assertEquals("kael", change.leaderId)
        assertEquals(TeamView(true, 2, 2, Team.SLOT_PRICES, listOf("lyra", "orina", null, null)), change.team)
        assertEquals(Team(2, listOf("lyra", "orina", null, null)), teams.find("yan"))
    }

    @Test
    fun `the same save twice stores the same team`() {
        player(setOf(5, 6))
        teams.save("yan", Team(2))

        val first = service.saveAllies("yan", listOf("lyra", "orina", null, null))
        val second = service.saveAllies("yan", listOf("lyra", "orina", null, null))

        assertEquals(first, second)
        assertEquals(Team(2, listOf("lyra", "orina", null, null)), teams.find("yan"))
    }

    @Test
    fun `save on a locked team is refused and stores nothing`() {
        player(setOf(1, 2, 3, 4))

        assertFailsWith<TeamLockedException> { service.saveAllies("yan", listOf("lyra", null, null, null)) }

        assertTrue(teams.teams.isEmpty())
    }

    @Test
    fun `save of a hero in a slot that is not bought is refused and stores nothing`() {
        player(setOf(5, 6))
        teams.save("yan", Team(1))

        assertFailsWith<TeamSlotNotBoughtException> { service.saveAllies("yan", listOf("lyra", "orina", null, null)) }

        assertEquals(Team(1), teams.find("yan"))
    }

    @Test
    fun `save of a hero not owned is refused and stores nothing`() {
        player(setOf(5))
        teams.save("yan", Team(1))

        assertFailsWith<HeroNotOwnedException> { service.saveAllies("yan", listOf("vex", null, null, null)) }

        assertEquals(Team(1), teams.find("yan"))
    }

    @Test
    fun `save of an id outside the catalog is refused`() {
        player(setOf(5))
        teams.save("yan", Team(1))

        assertFailsWith<HeroNotFoundException> { service.saveAllies("yan", listOf("ghost", null, null, null)) }

        assertEquals(Team(1), teams.find("yan"))
    }

    @Test
    fun `save of the leader is refused`() {
        player(setOf(5))
        teams.save("yan", Team(1))

        assertFailsWith<InvalidTeamException> { service.saveAllies("yan", listOf("kael", null, null, null)) }

        assertEquals(Team(1), teams.find("yan"))
    }

    @Test
    fun `save for an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.saveAllies("ghost", listOf("lyra", null, null, null)) }
    }

    @Test
    fun `buy from 0 takes 10000 copper and stores 1 bought slot`() {
        player(setOf(5))
        funded(15_000)

        val purchase = service.buySlot("yan", 0)

        assertEquals(1, purchase.team.boughtSlots)
        assertEquals(5_000L, purchase.wallet.copper)
        assertEquals(Team(1), teams.find("yan"))
        assertEquals(5_000L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `buy of slot 4 takes 40000 copper`() {
        player(setOf(5, 6, 7, 8))
        teams.save("yan", Team(3))
        funded(40_000)

        val purchase = service.buySlot("yan", 3)

        assertEquals(4, purchase.team.boughtSlots)
        assertEquals(0L, purchase.wallet.copper)
        assertEquals(0L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `buy without enough copper is refused and changes nothing`() {
        player(setOf(5))
        funded(9_999)

        assertFailsWith<NotEnoughCopperException> { service.buySlot("yan", 0) }

        assertEquals(Team(), teams.find("yan"))
        assertEquals(9_999L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `buy with a stale fromSlots is refused and changes nothing`() {
        player(setOf(5, 6))
        teams.save("yan", Team(1))
        funded(50_000)

        assertFailsWith<TeamSlotMismatchException> { service.buySlot("yan", 0) }

        assertEquals(Team(1), teams.find("yan"))
        assertEquals(50_000L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `buy with every open slot bought is refused and charges nothing`() {
        player(setOf(5))
        teams.save("yan", Team(1))
        funded(50_000)

        assertFailsWith<TeamSlotLockedException> { service.buySlot("yan", 1) }

        assertEquals(50_000L, wallets.wallets.getValue("yan").copper)
    }
}
