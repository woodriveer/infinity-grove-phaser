package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * `V4__monster_health_growth.sql` updated the legacy integer health columns, which V10 drops; its re-runs were verified in their own
 * feature and until T14. A new database still seeds the grown health.
 */
class MonsterHealthMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    @Test
    fun `a new database seeds the grown health`() {
        assertEquals(40L, jdbc.queryForObject("select monster_hit_points from stages where chapter = 1 and number = 1", Long::class.java))
        assertEquals(
            4864L,
            jdbc.queryForObject("select monster_hit_points from stages where chapter = 4 and number = 10", Long::class.java),
        )
        assertEquals(512_000L, jdbc.queryForObject("select boss_hit_points from chapters where number = 5", Long::class.java))
    }
}
