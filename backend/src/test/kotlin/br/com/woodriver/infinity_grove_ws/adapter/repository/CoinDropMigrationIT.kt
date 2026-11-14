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
}
