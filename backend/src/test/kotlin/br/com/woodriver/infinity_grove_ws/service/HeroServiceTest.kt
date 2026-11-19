package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryHeroRepository
import br.com.woodriver.infinity_grove_ws.InMemoryPlayerCardsRepository
import br.com.woodriver.infinity_grove_ws.InMemoryTeamRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.LogCapture
import br.com.woodriver.infinity_grove_ws.domain.BossRecord
import br.com.woodriver.infinity_grove_ws.domain.CopyKey
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.HeroNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.HeroNotOwnedException
import br.com.woodriver.infinity_grove_ws.domain.HeroSeed
import br.com.woodriver.infinity_grove_ws.domain.InvalidFusionException
import br.com.woodriver.infinity_grove_ws.domain.NotEnoughCardsException
import br.com.woodriver.infinity_grove_ws.domain.NothingToFuseException
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.PlayerCardsMissingException
import br.com.woodriver.infinity_grove_ws.domain.Team
import br.com.woodriver.infinity_grove_ws.domain.TeamView
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class HeroServiceTest {
    private val heroes = InMemoryHeroRepository(*HeroSeed.heroes().toTypedArray())
    private val cards = InMemoryPlayerCardsRepository()
    private val users = InMemoryUserRepository()
    private val teams = InMemoryTeamRepository()
    private val service = HeroService(heroes, cards, users, teams)

    private fun player(
        start: Element = Element.FIRE,
        extra: Map<CopyKey, Int> = emptyMap(),
        cleared: Set<Int> = emptySet(),
    ): PlayerCards {
        users.save(User("yan", "hash", 1L, 1L))
        val started = PlayerCards.start("yan", start, HeroSeed.heroes())
        return cards.save(started.copy(copies = started.copies + extra, bosses = BossRecord(cleared)))
    }

    @Test
    fun `list returns the five heroes in catalog order with the leader`() {
        player()

        val view = service.list("yan")

        assertEquals("kael", view.leaderId)
        assertEquals(listOf("kael", "lyra", "orina", "seraphine", "vex"), view.heroes.map { it.hero.id })
    }

    @Test
    fun `list gives each hero its chapter from the starting element`() {
        player(Element.WATER)

        val chapters = service.list("yan").heroes.associate { it.hero.id to it.chapter }

        assertEquals(mapOf("orina" to 1, "kael" to 2, "lyra" to 3, "vex" to 4, "seraphine" to 5), chapters)
    }

    @Test
    fun `list reports copies per stars 0 to 9, ownership and stars`() {
        player(extra = mapOf(CopyKey("kael", 0) to 2, CopyKey("kael", 2) to 1, CopyKey("lyra", 0) to 1))

        val view = service.list("yan").heroes.associateBy { it.hero.id }

        assertEquals(mapOf(0 to 2, 1 to 0, 2 to 1, 3 to 0, 4 to 0, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 0), view.getValue("kael").copies)
        assertEquals(2, view.getValue("kael").stars)
        assertTrue(view.getValue("kael").owned)
        assertEquals(mapOf(0 to 1, 1 to 0, 2 to 0, 3 to 0, 4 to 0, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 0), view.getValue("lyra").copies)
        assertTrue(view.getValue("lyra").owned)
        assertEquals(0, view.getValue("lyra").stars)
        assertFalse(view.getValue("orina").owned)
        assertEquals(mapOf(0 to 0, 1 to 0, 2 to 0, 3 to 0, 4 to 0, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 0), view.getValue("orina").copies)
    }

    @Test
    fun `list reports a 9 star hero with copies up to 9`() {
        player(extra = mapOf(CopyKey("kael", 9) to 1))

        val kael = service.list("yan").heroes.single { it.hero.id == "kael" }

        assertEquals(9, kael.stars)
        assertEquals(mapOf(0 to 1, 1 to 0, 2 to 0, 3 to 0, 4 to 0, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 1), kael.copies)
    }

    @Test
    fun `list unlocks skill n when the stars are at least n`() {
        player(extra = mapOf(CopyKey("kael", 2) to 1, CopyKey("lyra", 1) to 1))

        val view = service.list("yan").heroes.associateBy { it.hero.id }

        assertEquals(listOf(true, true, false), view.getValue("kael").skills.map { it.unlocked })
        assertEquals(listOf(true, false, false), view.getValue("lyra").skills.map { it.unlocked })
        assertEquals(listOf(false, false, false), view.getValue("orina").skills.map { it.unlocked })
    }

    @Test
    fun `list unlocks every skill of a three star hero and none of a blank one`() {
        player(extra = mapOf(CopyKey("kael", 3) to 1))

        val view = service.list("yan").heroes.associateBy { it.hero.id }

        assertEquals(listOf(true, true, true), view.getValue("kael").skills.map { it.unlocked })
        assertEquals(3, view.getValue("kael").stars)
    }

    @Test
    fun `fuse applies the rule, stores it and returns the hero`() {
        player(extra = mapOf(CopyKey("kael", 0) to 3))

        val hero = service.fuse("yan", "kael", 0)

        assertEquals(1, hero.stars)
        assertEquals(mapOf(0 to 0, 1 to 1, 2 to 0, 3 to 0, 4 to 0, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 0), hero.copies)
        assertEquals(mapOf(CopyKey("kael", 1) to 1), cards.cards.getValue("yan").copies)
    }

    @Test
    fun `a fusion is logged with the player, the hero and the stars`() {
        player(extra = mapOf(CopyKey("kael", 1) to 3))

        LogCapture(PlayerCards::class.java).use { logs ->
            service.fuse("yan", "kael", 1)

            assertEquals(listOf("Fusing cards username=yan hero=kael stars=1"), logs.infos)
        }
    }

    @Test
    fun `fuse without enough cards leaves the bag unchanged`() {
        val before = player()

        assertFailsWith<NotEnoughCardsException> { service.fuse("yan", "kael", 0) }

        assertEquals(before, cards.cards.getValue("yan"))
    }

    @Test
    fun `fuse with invalid stars leaves the bag unchanged`() {
        val before = player(extra = mapOf(CopyKey("kael", 0) to 2))

        assertFailsWith<InvalidFusionException> { service.fuse("yan", "kael", 9) }
        assertFailsWith<InvalidFusionException> { service.fuse("yan", "kael", -1) }

        assertEquals(before, cards.cards.getValue("yan"))
    }

    @Test
    fun `fuse of three 3-star cards returns a 4-star hero with levels 2, 1 and 1`() {
        player(extra = mapOf(CopyKey("kael", 3) to 3))

        val hero = service.fuse("yan", "kael", 3)

        assertEquals(4, hero.stars)
        assertEquals(mapOf(0 to 1, 1 to 0, 2 to 0, 3 to 0, 4 to 1, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 0), hero.copies)
        assertEquals(listOf(2, 1, 1), hero.skills.map { it.level })
    }

    @Test
    fun `fuse of an unknown hero fails and leaves the bag unchanged`() {
        val before = player()

        assertFailsWith<HeroNotFoundException> { service.fuse("yan", "ghost", 0) }

        assertEquals(before, cards.cards.getValue("yan"))
    }

    @Test
    fun `set leader stores an owned hero`() {
        player(extra = mapOf(CopyKey("lyra", 0) to 1))

        assertEquals("lyra", service.setLeader("yan", "lyra").leaderId)

        assertEquals("lyra", cards.cards.getValue("yan").leaderId)
        assertEquals("lyra", service.list("yan").leaderId)
    }

    @Test
    fun `list answers a locked team for a player who never won the chapter 5 boss`() {
        player()

        assertEquals(TeamView(false, 0, 0, Team.SLOT_PRICES, listOf(null, null, null, null)), service.list("yan").team)
    }

    @Test
    fun `list answers the stored team with the open slots of the cleared chapters`() {
        player(extra = mapOf(CopyKey("lyra", 0) to 1, CopyKey("orina", 0) to 1), cleared = setOf(5, 6, 7))
        teams.save("yan", Team(2, listOf("lyra", "orina", null, null)))

        assertEquals(TeamView(true, 3, 2, Team.SLOT_PRICES, listOf("lyra", "orina", null, null)), service.list("yan").team)
    }

    @Test
    fun `set leader to the hero of ally slot 2 puts the old leader in slot 2`() {
        player(extra = mapOf(CopyKey("lyra", 0) to 1, CopyKey("orina", 0) to 1), cleared = setOf(5, 6))
        teams.save("yan", Team(2, listOf("lyra", "orina", null, null)))

        val change = service.setLeader("yan", "orina")

        assertEquals("orina", change.leaderId)
        assertEquals(listOf("lyra", "kael", null, null), change.team.allies)
        assertEquals(listOf("lyra", "kael", null, null), teams.find("yan").allies)
    }

    @Test
    fun `set leader to a hero outside the team keeps the allies`() {
        player(extra = mapOf(CopyKey("lyra", 0) to 1, CopyKey("seraphine", 0) to 1), cleared = setOf(5))
        teams.save("yan", Team(1, listOf("lyra", null, null, null)))

        val change = service.setLeader("yan", "seraphine")

        assertEquals(listOf("lyra", null, null, null), change.team.allies)
    }

    @Test
    fun `set leader without a team stores no team row`() {
        player(extra = mapOf(CopyKey("lyra", 0) to 1))

        service.setLeader("yan", "lyra")

        assertFalse(teams.teams.containsKey("yan"))
    }

    @Test
    fun `set leader to the current leader keeps the team`() {
        player(extra = mapOf(CopyKey("lyra", 0) to 1), cleared = setOf(5))
        teams.save("yan", Team(1, listOf("lyra", null, null, null)))

        val change = service.setLeader("yan", "kael")

        assertEquals("kael", change.leaderId)
        assertEquals(listOf("lyra", null, null, null), change.team.allies)
        assertEquals(Team(1, listOf("lyra", null, null, null)), teams.find("yan"))
    }

    @Test
    fun `a refused leader change keeps the team`() {
        player(extra = mapOf(CopyKey("lyra", 0) to 1), cleared = setOf(5))
        teams.save("yan", Team(1, listOf("lyra", null, null, null)))

        assertFailsWith<HeroNotOwnedException> { service.setLeader("yan", "vex") }

        assertEquals(Team(1, listOf("lyra", null, null, null)), teams.find("yan"))
    }

    @Test
    fun `set leader for a hero not owned keeps the leader`() {
        player()

        assertFailsWith<HeroNotOwnedException> { service.setLeader("yan", "lyra") }

        assertEquals("kael", cards.cards.getValue("yan").leaderId)
    }

    @Test
    fun `set leader for an unknown hero keeps the leader`() {
        player()

        assertFailsWith<HeroNotFoundException> { service.setLeader("yan", "ghost") }

        assertEquals("kael", cards.cards.getValue("yan").leaderId)
    }

    @Test
    fun `an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.list("ghost") }
        assertFailsWith<UserNotFoundException> { service.fuse("ghost", "kael", 0) }
        assertFailsWith<UserNotFoundException> { service.setLeader("ghost", "kael") }
    }

    @Test
    fun `a user without cards fails`() {
        users.save(User("yan", "hash", 1L, 1L))

        assertFailsWith<PlayerCardsMissingException> { service.list("yan") }
        assertFailsWith<PlayerCardsMissingException> { service.fuse("yan", "kael", 0) }
        assertFailsWith<PlayerCardsMissingException> { service.setLeader("yan", "kael") }
    }

    @Test
    fun `players do not share bags`() {
        player(extra = mapOf(CopyKey("kael", 0) to 3))
        users.save(User("ana", "hash", 1L, 1L))
        cards.save(PlayerCards.start("ana", Element.NATURE, HeroSeed.heroes()))

        service.fuse("yan", "kael", 0)

        assertEquals(mapOf(CopyKey("lyra", 0) to 1), cards.cards.getValue("ana").copies)
    }

    @Test
    fun `fuse all stores the cascade and returns the hero with the fusion count`() {
        player(extra = mapOf(CopyKey("kael", 0) to 45, CopyKey("kael", 1) to 1, CopyKey("kael", 2) to 2))

        val result = service.fuseAll("yan", "kael")

        assertEquals(22, result.fusions)
        assertEquals(3, result.hero.stars)
        assertEquals(mapOf(0 to 0, 1 to 1, 2 to 1, 3 to 2, 4 to 0, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 0), result.hero.copies)
        assertEquals(
            mapOf(CopyKey("kael", 1) to 1, CopyKey("kael", 2) to 1, CopyKey("kael", 3) to 2),
            cards.cards.getValue("yan").copies,
        )
    }

    @Test
    fun `fuse all of three 3-star cards returns a 4-star hero with levels 2, 1 and 1`() {
        player(extra = mapOf(CopyKey("kael", 3) to 3))

        val result = service.fuseAll("yan", "kael")

        assertEquals(1, result.fusions)
        assertEquals(4, result.hero.stars)
        assertEquals(listOf(2, 1, 1), result.hero.skills.map { it.level })
    }

    @Test
    fun `fuse all with nothing to fuse leaves the bag unchanged`() {
        player()

        assertFailsWith<NothingToFuseException> { service.fuseAll("yan", "kael") }

        assertEquals(mapOf(CopyKey("kael", 0) to 1), cards.cards.getValue("yan").copies)
    }

    @Test
    fun `fuse all of an unknown hero fails and leaves the bag unchanged`() {
        player(extra = mapOf(CopyKey("kael", 0) to 3))

        assertFailsWith<HeroNotFoundException> { service.fuseAll("yan", "ghost") }

        assertEquals(mapOf(CopyKey("kael", 0) to 3), cards.cards.getValue("yan").copies)
    }

    @Test
    fun `fuse all for an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.fuseAll("nobody", "kael") }
    }

    @Test
    fun `fuse all is logged with the player and the hero`() {
        player(extra = mapOf(CopyKey("kael", 0) to 3))

        LogCapture(HeroService::class.java).use { serviceLogs ->
            LogCapture(PlayerCards::class.java).use { cardLogs ->
                service.fuseAll("yan", "kael")

                assertTrue(serviceLogs.infos.any { it.contains("Fuse all requested username=yan hero=kael") })
                assertTrue(cardLogs.infos.any { it.contains("fusions=1") })
            }
        }
    }
}
