package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

/**
 * `V8__health_hit_points_expand.sql` and `V10__health_legacy_columns_drop.sql`: the hit points are 64-bit, not null and at least 1.
 * The backfill of V8 was verified before V10 dropped its source columns (tasks T1 and T13).
 */
class HealthHitPointsMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    private fun column(
        table: String,
        name: String,
    ) = jdbc.queryForMap(
        "select data_type, is_nullable from information_schema.columns where table_name = ? and column_name = ?",
        table,
        name,
    )

    @Test
    fun `the hit point columns are bigint and not null`() {
        for ((table, name) in listOf(
            "chapters" to "boss_hit_points",
            "stages" to "monster_hit_points",
            "stages" to "miniboss_hit_points",
        )) {
            val column = column(table, name)
            assertEquals("bigint", column["data_type"], "$table.$name")
            assertEquals("NO", column["is_nullable"], "$table.$name")
        }
    }

    @Test
    fun `the legacy health columns are gone`() {
        assertEquals(
            0,
            jdbc.queryForObject(
                "select count(*) from information_schema.columns where table_schema = 'public' and column_name in ('boss_health', 'monster_health', 'miniboss_health')",
                Int::class.java,
            ),
        )
    }

    @Test
    fun `a hit point below 1 is refused and 3000000000 is stored`() {
        val saved = jdbc.queryForObject("select boss_hit_points from chapters where number = 1", Long::class.java)
        assertFailsWith<DataIntegrityViolationException> {
            jdbc.update("update chapters set boss_hit_points = 0 where number = 1")
        }

        jdbc.update("update chapters set boss_hit_points = 3000000000 where number = 1")

        assertEquals(3_000_000_000L, jdbc.queryForObject("select boss_hit_points from chapters where number = 1", Long::class.java))
        jdbc.update("update chapters set boss_hit_points = ? where number = 1", saved)
    }
}
