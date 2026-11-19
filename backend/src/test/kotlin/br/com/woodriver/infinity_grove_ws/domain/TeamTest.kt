package br.com.woodriver.infinity_grove_ws.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertSame
import kotlin.test.assertTrue

class TeamTest {
    private fun cards(cleared: Set<Int>) =
        PlayerCards(
            "yan",
            Element.FIRE,
            "kael",
            mapOf(CopyKey("kael", 0) to 1, CopyKey("lyra", 0) to 1, CopyKey("orina", 0) to 1, CopyKey("seraphine", 0) to 1),
            BossRecord(cleared),
        )

    private val known = { id: String -> id in setOf("kael", "lyra", "orina", "seraphine", "vex") }

    @Test
    fun `a new team has no bought slot and four empty entries`() {
        val team = Team()

        assertEquals(0, team.boughtSlots)
        assertEquals(listOf(null, null, null, null), team.allies)
    }

    @Test
    fun `a team refuses -1 and 5 bought slots`() {
        assertFailsWith<IllegalArgumentException> { Team(-1) }
        assertFailsWith<IllegalArgumentException> { Team(5) }
    }

    @Test
    fun `a team refuses a hero in a slot that is not bought`() {
        assertFailsWith<IllegalArgumentException> { Team(1, listOf("lyra", "orina", null, null)) }
    }

    @Test
    fun `a team refuses the same hero twice`() {
        assertFailsWith<IllegalArgumentException> { Team(2, listOf("lyra", "lyra", null, null)) }
    }

    @Test
    fun `the team is unlocked once chapter 5 is cleared`() {
        assertFalse(Team.unlocked(BossRecord(setOf(1, 2, 3, 4))))
        assertTrue(Team.unlocked(BossRecord(setOf(5))))
    }

    @Test
    fun `openSlots counts the cleared chapters 5 to 8`() {
        assertEquals(0, Team.openSlots(BossRecord(emptySet())))
        assertEquals(0, Team.openSlots(BossRecord(setOf(1, 2, 3, 4))))
        assertEquals(1, Team.openSlots(BossRecord(setOf(5))))
        assertEquals(2, Team.openSlots(BossRecord(setOf(5, 6))))
        assertEquals(3, Team.openSlots(BossRecord(setOf(5, 6, 7))))
        assertEquals(4, Team.openSlots(BossRecord(setOf(5, 6, 7, 8))))
        assertEquals(4, Team.openSlots(BossRecord(setOf(1, 5, 6, 7, 8, 9, 15))))
    }

    @Test
    fun `the slot prices are 10000, 20000, 30000 and 40000 copper`() {
        assertEquals(listOf(10_000L, 20_000L, 30_000L, 40_000L), Team.SLOT_PRICES)
    }

    @Test
    fun `buy from 0 with chapter 5 cleared gives 1 bought slot`() {
        assertEquals(Team(1), Team().buy("yan", 0, BossRecord(setOf(5))))
    }

    @Test
    fun `buy keeps the allies`() {
        val bought = Team(1, listOf("lyra", null, null, null)).buy("yan", 1, BossRecord(setOf(5, 6)))

        assertEquals(Team(2, listOf("lyra", null, null, null)), bought)
    }

    @Test
    fun `buy with a negative fromSlots is INVALID_TEAM_SLOT_REQUEST`() {
        val error = assertFailsWith<InvalidTeamSlotRequestException> { Team().buy("yan", -1, BossRecord(setOf(5))) }

        assertEquals("INVALID_TEAM_SLOT_REQUEST", error.code)
    }

    @Test
    fun `buy with a stale fromSlots is TEAM_SLOT_MISMATCH carrying the stored team`() {
        val error = assertFailsWith<TeamSlotMismatchException> { Team(1).buy("yan", 0, BossRecord(setOf(5, 6))) }

        assertEquals("TEAM_SLOT_MISMATCH", error.code)
        assertEquals(TeamView(true, 2, 1, Team.SLOT_PRICES, listOf(null, null, null, null)), error.current)
    }

    @Test
    fun `buy at 4 bought slots is TEAM_SLOTS_MAX`() {
        assertFailsWith<TeamSlotsMaxException> { Team(4).buy("yan", 4, BossRecord(setOf(5, 6, 7, 8))) }
    }

    @Test
    fun `buy with every open slot bought is TEAM_SLOT_LOCKED`() {
        assertFailsWith<TeamSlotLockedException> { Team(1).buy("yan", 1, BossRecord(setOf(5))) }
    }

    @Test
    fun `buy on a team that never won the chapter 5 boss is TEAM_SLOT_LOCKED`() {
        assertFailsWith<TeamSlotLockedException> { Team().buy("yan", 0, BossRecord(setOf(1, 2, 3, 4))) }
    }

    @Test
    fun `buy checks the mismatch before the max`() {
        assertFailsWith<TeamSlotMismatchException> { Team(4).buy("yan", 3, BossRecord(setOf(5, 6, 7, 8))) }
    }

    @Test
    fun `buy checks the max before the lock`() {
        assertFailsWith<TeamSlotsMaxException> { Team(4).buy("yan", 4, BossRecord(setOf(5))) }
    }

    @Test
    fun `withAllies stores owned heroes in bought slots`() {
        val saved = Team(2).withAllies(listOf("lyra", "orina", null, null), cards(setOf(5, 6)), known)

        assertEquals(Team(2, listOf("lyra", "orina", null, null)), saved)
    }

    @Test
    fun `withAllies with four nulls empties the team and keeps the bought slots`() {
        val saved =
            Team(2, listOf("lyra", "orina", null, null))
                .withAllies(listOf(null, null, null, null), cards(setOf(5, 6)), known)

        assertEquals(Team(2), saved)
    }

    @Test
    fun `withAllies refuses a list that does not have 4 entries`() {
        val error = assertFailsWith<InvalidTeamException> { Team(1).withAllies(listOf("lyra"), cards(setOf(5)), known) }

        assertEquals("INVALID_TEAM", error.code)
    }

    @Test
    fun `withAllies refuses a hero twice`() {
        assertFailsWith<InvalidTeamException> {
            Team(2).withAllies(listOf("lyra", "lyra", null, null), cards(setOf(5, 6)), known)
        }
    }

    @Test
    fun `withAllies refuses the leader`() {
        assertFailsWith<InvalidTeamException> {
            Team(1).withAllies(listOf("kael", null, null, null), cards(setOf(5)), known)
        }
    }

    @Test
    fun `withAllies refuses an id outside the catalog`() {
        val error =
            assertFailsWith<HeroNotFoundException> {
                Team(1).withAllies(listOf("ghost", null, null, null), cards(setOf(5)), known)
            }

        assertEquals("HERO_NOT_FOUND", error.code)
    }

    @Test
    fun `withAllies refuses a locked team`() {
        assertFailsWith<TeamLockedException> {
            Team().withAllies(listOf("lyra", null, null, null), cards(setOf(1, 2, 3, 4)), known)
        }
    }

    @Test
    fun `withAllies refuses a locked team even with four nulls`() {
        assertFailsWith<TeamLockedException> {
            Team().withAllies(listOf(null, null, null, null), cards(setOf(1, 2, 3, 4)), known)
        }
    }

    @Test
    fun `withAllies refuses a hero in a slot that is not bought`() {
        assertFailsWith<TeamSlotNotBoughtException> {
            Team(1).withAllies(listOf("lyra", "orina", null, null), cards(setOf(5, 6)), known)
        }
    }

    @Test
    fun `withAllies refuses a hero not owned`() {
        assertFailsWith<HeroNotOwnedException> {
            Team(1).withAllies(listOf("vex", null, null, null), cards(setOf(5)), known)
        }
    }

    @Test
    fun `withAllies checks INVALID_TEAM before HERO_NOT_FOUND`() {
        assertFailsWith<InvalidTeamException> {
            Team(2).withAllies(listOf("ghost", "ghost", null, null), cards(setOf(5, 6)), known)
        }
    }

    @Test
    fun `withAllies checks HERO_NOT_FOUND before TEAM_LOCKED`() {
        assertFailsWith<HeroNotFoundException> {
            Team().withAllies(listOf("ghost", null, null, null), cards(setOf(1, 2, 3, 4)), known)
        }
    }

    @Test
    fun `withAllies checks TEAM_LOCKED before TEAM_SLOT_NOT_BOUGHT`() {
        assertFailsWith<TeamLockedException> {
            Team().withAllies(listOf("lyra", null, null, null), cards(setOf(1, 2, 3, 4)), known)
        }
    }

    @Test
    fun `withAllies checks TEAM_SLOT_NOT_BOUGHT before HERO_NOT_OWNED`() {
        assertFailsWith<TeamSlotNotBoughtException> {
            Team().withAllies(listOf("vex", null, null, null), cards(setOf(5)), known)
        }
    }

    @Test
    fun `a new leader from slot 2 sends the old leader to slot 2`() {
        val team = Team(2, listOf("lyra", "orina", null, null)).afterLeaderChange("kael", "orina")

        assertEquals(Team(2, listOf("lyra", "kael", null, null)), team)
    }

    @Test
    fun `a new leader outside the team leaves the allies`() {
        val team = Team(2, listOf("lyra", "orina", null, null))

        assertSame(team, team.afterLeaderChange("kael", "seraphine"))
    }

    @Test
    fun `the same leader leaves the allies`() {
        val team = Team(2, listOf("lyra", "orina", null, null))

        assertSame(team, team.afterLeaderChange("kael", "kael"))
    }

    @Test
    fun `the view carries unlocked, open slots, bought slots, prices and allies`() {
        val view = TeamView.of(Team(1, listOf("lyra", null, null, null)), BossRecord(setOf(5, 6)))

        assertEquals(TeamView(true, 2, 1, listOf(10_000L, 20_000L, 30_000L, 40_000L), listOf("lyra", null, null, null)), view)
    }
}
