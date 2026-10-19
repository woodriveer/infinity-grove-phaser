package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.Affix
import br.com.woodriver.infinity_grove_ws.domain.AffixType
import br.com.woodriver.infinity_grove_ws.domain.Piece
import br.com.woodriver.infinity_grove_ws.domain.Rarity
import br.com.woodriver.infinity_grove_ws.domain.Slot
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class EquipmentRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var repository: EquipmentRepository

    // every row here references a player through a foreign key
    @BeforeEach
    fun players() = users("yan", "other")

    private fun weapon(
        id: String = "w1",
        username: String = "yan",
        heroId: String? = null,
    ) = Piece(
        id,
        username,
        Slot.WEAPON,
        Rarity.RARE,
        baseClick = 4,
        refine = 3,
        affixes =
            listOf(
                Affix(AffixType.CRIT_DAMAGE_PCT, 21),
                Affix(AffixType.BOSS_TIME_SECONDS, 2),
                Affix(AffixType.ARMOR_PIERCE_PCT, 9),
            ),
        heroId = heroId,
    )

    private fun ring(
        id: String = "r1",
        username: String = "yan",
    ) = Piece(id, username, Slot.RING, Rarity.COMMON, null, 0, listOf(Affix(AffixType.CLICK_DAMAGE_PCT, 7)))

    @Test
    fun `a player without pieces has an empty list`() {
        assertTrue(repository.findAll("ghost").isEmpty())
    }

    @Test
    fun `a saved piece reads back equal with its affixes in order`() {
        val saved = weapon(heroId = "kael")

        repository.save(saved)

        assertEquals(listOf(saved), repository.findAll("yan"))
    }

    @Test
    fun `a piece without base click damage or affixes reads back as it was`() {
        val bare = Piece("b1", "yan", Slot.AMULET, Rarity.COMMON, null, 0, emptyList())

        repository.save(bare)

        assertEquals(listOf(bare), repository.findAll("yan"))
    }

    @Test
    fun `saving a stored piece updates its refine level, affixes and hero`() {
        repository.save(weapon())

        val changed = weapon(heroId = "lyra").copy(refine = 4, affixes = listOf(Affix(AffixType.CRIT_CHANCE, 3)))
        repository.save(changed)

        assertEquals(listOf(changed), repository.findAll("yan"))
    }

    @Test
    fun `pieces come back in the order they were first saved even after an update`() {
        repository.save(weapon("first"))
        Thread.sleep(5)
        repository.save(ring("second"))
        Thread.sleep(5)
        repository.save(weapon("first").copy(refine = 9))

        assertEquals(listOf("first", "second"), repository.findAll("yan").map { it.id })
    }

    @Test
    fun `findAll returns only the pieces of that player`() {
        repository.save(weapon("a", "yan"))
        repository.save(ring("b", "other"))

        assertEquals(listOf("a"), repository.findAll("yan").map { it.id })
        assertEquals(listOf("b"), repository.findAll("other").map { it.id })
    }

    @Test
    fun `delete removes one piece`() {
        repository.save(weapon("a"))
        repository.save(ring("b"))

        repository.delete("a")

        assertEquals(listOf("b"), repository.findAll("yan").map { it.id })
    }

    @Test
    fun `deleteByUsername removes every piece of the player and no other`() {
        repository.save(weapon("a", "yan"))
        repository.save(ring("b", "yan"))
        repository.save(ring("c", "other"))

        repository.deleteByUsername("yan")

        assertTrue(repository.findAll("yan").isEmpty())
        assertEquals(listOf("c"), repository.findAll("other").map { it.id })
    }
}
