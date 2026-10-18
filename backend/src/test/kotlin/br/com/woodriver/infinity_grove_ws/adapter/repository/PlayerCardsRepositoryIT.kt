package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.BossRecord
import br.com.woodriver.infinity_grove_ws.domain.CopyKey
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import org.springframework.beans.factory.annotation.Autowired
import java.time.LocalDate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class PlayerCardsRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var repository: PlayerCardsRepository

    private fun cards(
        username: String = "yan",
        copies: Map<CopyKey, Int> = mapOf(CopyKey("kael", 0) to 2),
        bosses: BossRecord = BossRecord(),
    ) = PlayerCards(username, Element.FIRE, "kael", copies, bosses)

    @Test
    fun `a player without cards is not found`() {
        assertNull(repository.findForUpdate("ghost"))
    }

    @Test
    fun `saved cards are read back equal with copies, leader and boss record`() {
        val bosses = BossRecord(setOf(1, 3), LocalDate.of(2026, 10, 18), 4, 123_456L)
        val saved = cards(copies = mapOf(CopyKey("kael", 0) to 2, CopyKey("kael", 1) to 1, CopyKey("lyra", 0) to 5), bosses = bosses)

        repository.save(saved)

        assertEquals(saved, repository.findForUpdate("yan"))
    }

    @Test
    fun `a boss record with nothing in it reads back empty`() {
        repository.save(cards())

        assertEquals(BossRecord(), repository.findForUpdate("yan")?.bosses)
    }

    @Test
    fun `saving updates changed counts and deletes stacks that dropped out`() {
        repository.save(cards(copies = mapOf(CopyKey("kael", 0) to 3, CopyKey("lyra", 0) to 1)))

        repository.save(cards(copies = mapOf(CopyKey("kael", 0) to 1, CopyKey("kael", 1) to 1)))

        assertEquals(mapOf(CopyKey("kael", 0) to 1, CopyKey("kael", 1) to 1), repository.findForUpdate("yan")?.copies)
        assertEquals(2, jpaCardCopyRepository.findAllByUsername("yan").size)
    }

    @Test
    fun `creating cards that already exist keeps the first ones`() {
        repository.createIfAbsent(cards())
        repository.createIfAbsent(cards(copies = mapOf(CopyKey("lyra", 0) to 9)))

        assertEquals(mapOf(CopyKey("kael", 0) to 2), repository.findForUpdate("yan")?.copies)
    }

    @Test
    fun `cards of two players do not mix`() {
        repository.save(cards("yan"))
        repository.save(cards("ana", copies = mapOf(CopyKey("lyra", 0) to 1)))

        assertEquals(mapOf(CopyKey("kael", 0) to 2), repository.findForUpdate("yan")?.copies)
        assertEquals(mapOf(CopyKey("lyra", 0) to 1), repository.findForUpdate("ana")?.copies)
    }

    @Test
    fun `deleting a player removes the cards and every copy row`() {
        repository.save(cards("yan"))
        repository.save(cards("ana"))

        repository.deleteByUsername("yan")

        assertNull(repository.findForUpdate("yan"))
        assertEquals(0, jpaCardCopyRepository.findAllByUsername("yan").size)
        assertEquals(1, jpaCardCopyRepository.findAllByUsername("ana").size)
    }
}
