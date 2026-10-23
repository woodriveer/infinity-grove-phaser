package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryProgressRepository
import br.com.woodriver.infinity_grove_ws.InMemoryTalentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.domain.NotEnoughTalentPointsException
import br.com.woodriver.infinity_grove_ws.domain.TalentLevelMismatchException
import br.com.woodriver.infinity_grove_ws.domain.TalentMaxLevelException
import br.com.woodriver.infinity_grove_ws.domain.TalentNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.TalentPoints
import br.com.woodriver.infinity_grove_ws.domain.TalentRequestException
import br.com.woodriver.infinity_grove_ws.domain.TalentRules
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class TalentServiceTest {
    private val users = InMemoryUserRepository()
    private val talents = InMemoryTalentRepository()
    private val progress = InMemoryProgressRepository()
    private val rules = TalentRules()
    private val service = TalentService(talents, users, progress, rules)

    private fun player(points: Int) {
        users.save(User("yan", "hash", 1L, 1L))
        if (points > 0) talents.award("yan", "legacy", points)
    }

    @Test
    fun `list gives level 0 and no points to a new player`() {
        player(0)

        val tree = service.list("yan")

        assertEquals(emptyMap(), tree.levels)
        assertEquals(0, tree.level("COMBO"))
        assertEquals(TalentPoints(0, 0), tree.points(rules))
    }

    @Test
    fun `list gives the points the awards paid`() {
        player(0)
        talents.award("yan", "1:1:PHASE:1", 1)
        talents.award("yan", "1:1:MINIBOSS:1", 2)

        assertEquals(3, service.list("yan").earned)
    }

    @Test
    fun `list for an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.list("ghost") }
    }

    @Test
    fun `list gives only the levels and points of that player`() {
        player(2)
        users.save(User("other", "hash", 1L, 1L))
        talents.save("yan", "CLICK_DAMAGE", 2)
        talents.save("other", "CLICK_DAMAGE", 7)
        talents.award("other", "legacy", 7)

        val tree = service.list("yan")

        assertEquals(2, tree.level("CLICK_DAMAGE"))
        assertEquals(2, tree.earned)
    }

    @Test
    fun `an upgrade with 3 points raises the level and stores it, leaving 2 available`() {
        player(3)

        val upgraded = service.upgrade("yan", "COMBO", 0)

        assertEquals(1, upgraded.level("COMBO"))
        assertEquals(1, talents.levels.getValue("yan" to "COMBO"))
        assertEquals(TalentPoints(3, 1), upgraded.points(rules))
        assertEquals(2, upgraded.points(rules).available)
    }

    @Test
    fun `an upgrade locks the progress of the player, creating it first`() {
        player(1)

        service.upgrade("yan", "COMBO", 0)

        assertTrue(progress.progresses.containsKey("yan"))
    }

    @Test
    fun `a stale request is a level mismatch and spends nothing`() {
        player(3)
        service.upgrade("yan", "COMBO", 0)

        assertFailsWith<TalentLevelMismatchException> { service.upgrade("yan", "COMBO", 0) }

        assertEquals(1, talents.levels.getValue("yan" to "COMBO"))
        assertEquals(2, service.list("yan").points(rules).available)
    }

    @Test
    fun `with no available point the upgrade is refused and nothing changes`() {
        player(0)

        assertFailsWith<NotEnoughTalentPointsException> { service.upgrade("yan", "COMBO", 0) }

        assertEquals(emptyMap(), talents.levels)
    }

    @Test
    fun `the points run out after as many levels as were earned, across talents`() {
        player(2)
        service.upgrade("yan", "COMBO", 0)
        service.upgrade("yan", "CLICK_DAMAGE", 0)

        assertFailsWith<NotEnoughTalentPointsException> { service.upgrade("yan", "BOSS_TIME", 0) }
        assertEquals(0, service.list("yan").points(rules).available)
    }

    @Test
    fun `a talent at level 10 is refused as max level and spends nothing`() {
        player(50)
        talents.save("yan", "COMBO", 10)

        assertFailsWith<TalentMaxLevelException> { service.upgrade("yan", "COMBO", 10) }

        assertEquals(40, service.list("yan").points(rules).available)
    }

    @Test
    fun `an unknown talent is not found`() {
        player(1)

        assertFailsWith<TalentNotFoundException> { service.upgrade("yan", "NOPE", 0) }
    }

    @Test
    fun `a level the client could not have seen is a bad request`() {
        player(5)

        assertFailsWith<TalentRequestException> { service.upgrade("yan", "COMBO", -1) }
        assertFailsWith<TalentRequestException> { service.upgrade("yan", "COMBO", 11) }
        assertEquals(5, service.list("yan").points(rules).available)
    }

    @Test
    fun `reset takes back every level and keeps the points earned`() {
        player(5)
        service.upgrade("yan", "COMBO", 0)
        service.upgrade("yan", "CLICK_DAMAGE", 0)

        val reset = service.reset("yan")

        assertEquals(emptyMap(), reset.levels)
        assertEquals(emptyMap(), talents.levels)
        assertEquals(TalentPoints(5, 0), reset.points(rules))
        assertTrue(progress.progresses.containsKey("yan"))
    }

    @Test
    fun `reset leaves the levels of other players`() {
        player(2)
        users.save(User("other", "hash", 1L, 1L))
        talents.save("other", "COMBO", 3)

        service.reset("yan")

        assertEquals(3, talents.levels.getValue("other" to "COMBO"))
    }

    @Test
    fun `reset for an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.reset("ghost") }
    }

    @Test
    fun `an upgrade for an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.upgrade("ghost", "COMBO", 0) }
    }

    @Test
    fun `the other talents of the player are untouched`() {
        player(5)
        talents.save("yan", "CRIT_CHANCE", 4)

        service.upgrade("yan", "COMBO", 0)

        assertEquals(4, talents.levels.getValue("yan" to "CRIT_CHANCE"))
    }
}
