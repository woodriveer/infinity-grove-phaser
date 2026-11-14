package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals

/** `V9__coin_drop_rebalance.sql`: the seeded drop ranges of chapters 1 to 5 move to the new ones, a range tuned in the database is left alone. */
class CoinDropMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    private fun migrate() = jdbc.execute(ClassPathResource("db/migration/V9__coin_drop_rebalance.sql").getContentAsString(Charsets.UTF_8))

    private fun rule(id: Int) = jdbc.queryForMap("select min_copper, max_copper, kill_interval_ms from drop_rules where id = ?", id)

    private fun setRange(
        id: Int,
        min: Int,
        max: Int,
    ) = jdbc.update("update drop_rules set min_copper = ?, max_copper = ? where id = ?", min, max, id)

    @AfterTest
    fun restore() {
        (1..5).forEach { chapter ->
            ChapterDefinition.dropRules(chapter).forEach { setRange(it.id, it.minCopper, it.maxCopper) }
        }
    }

    @Test
    fun `a fresh database holds the new ranges`() {
        assertEquals(2, rule(1)["min_copper"])
        assertEquals(6, rule(1)["max_copper"])
        assertEquals(480, rule(15)["min_copper"])
        assertEquals(1120, rule(15)["max_copper"])
    }

    @Test
    fun `a rule still at its old seeded range gets the new range`() {
        setRange(5, 10, 30)
        setRange(13, 5, 25)

        migrate()

        assertEquals(16, rule(5)["min_copper"])
        assertEquals(40, rule(5)["max_copper"])
        assertEquals(32, rule(13)["min_copper"])
        assertEquals(96, rule(13)["max_copper"])
    }

    @Test
    fun `a rule tuned in the database is left alone`() {
        setRange(6, 77, 99)

        migrate()

        assertEquals(77, rule(6)["min_copper"])
        assertEquals(99, rule(6)["max_copper"])
    }

    @Test
    fun `the migration keeps the kill interval`() {
        migrate()

        assertEquals(1500L, rule(5)["kill_interval_ms"])
    }

    @Test
    fun `every seeded rule of chapters 1 to 5 moves from its old range to the Coin Drops range`() {
        seededRules.forEach { setRange(it.id, it.oldMin, it.oldMax) }

        migrate()

        seededRules.forEach { seeded ->
            assertEquals(seeded.newMin, rule(seeded.id)["min_copper"], "rule ${seeded.id} min")
            assertEquals(seeded.newMax, rule(seeded.id)["max_copper"], "rule ${seeded.id} max")
        }
    }

    /** One seeded rule of chapters 1 to 5: its old range (`c` to `5c`, `5c` to `15c`, `20c` to `50c`) and its Coin Drops range. */
    private data class SeededRule(
        val id: Int,
        val oldMin: Int,
        val oldMax: Int,
        val newMin: Int,
        val newMax: Int,
    )

    private val seededRules =
        listOf(
            SeededRule(1, 1, 5, 2, 6),
            SeededRule(2, 5, 15, 8, 20),
            SeededRule(3, 20, 50, 30, 70),
            SeededRule(4, 2, 10, 4, 12),
            SeededRule(5, 10, 30, 16, 40),
            SeededRule(6, 40, 100, 60, 140),
            SeededRule(7, 3, 15, 8, 24),
            SeededRule(8, 15, 45, 32, 80),
            SeededRule(9, 60, 150, 120, 280),
            SeededRule(10, 4, 20, 16, 48),
            SeededRule(11, 20, 60, 64, 160),
            SeededRule(12, 80, 200, 240, 560),
            SeededRule(13, 5, 25, 32, 96),
            SeededRule(14, 25, 75, 128, 320),
            SeededRule(15, 100, 250, 480, 1120),
        )
}
