package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

/** `V8__health_hit_points_expand.sql`: the 64-bit hit points are filled from the legacy health, the legacy columns stay nullable. */
class HealthHitPointsMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    private fun migrate() =
        jdbc.execute(ClassPathResource("db/migration/V8__health_hit_points_expand.sql").getContentAsString(Charsets.UTF_8))

    private fun column(
        table: String,
        name: String,
    ) = jdbc.queryForMap(
        "select data_type, is_nullable from information_schema.columns where table_name = ? and column_name = ?",
        table,
        name,
    )

    @AfterTest
    fun restore() = migrate()

    @Test
    fun `the expand migration adds bigint hit point columns`() {
        assertEquals("bigint", column("chapters", "boss_hit_points")["data_type"])
        assertEquals("bigint", column("stages", "monster_hit_points")["data_type"])
        assertEquals("bigint", column("stages", "miniboss_hit_points")["data_type"])
    }

    @Test
    fun `the expand migration copies every legacy health into the hit points`() {
        jdbc.update("update chapters set boss_health = boss_hit_points where number between 1 and 15")
        jdbc.update(
            "update stages set monster_health = monster_hit_points, miniboss_health = miniboss_hit_points where chapter between 1 and 15",
        )
        jdbc.update("update chapters set boss_hit_points = null where number between 1 and 15")
        jdbc.update("update stages set monster_hit_points = null, miniboss_hit_points = null where chapter between 1 and 15")

        migrate()

        assertEquals(
            0,
            jdbc.queryForObject(
                "select count(*) from chapters where number between 1 and 15 and boss_hit_points is distinct from boss_health",
                Int::class.java,
            ),
        )
        assertEquals(
            0,
            jdbc.queryForObject(
                "select count(*) from stages where chapter between 1 and 15 and monster_hit_points is distinct from monster_health",
                Int::class.java,
            ),
        )
        assertEquals(
            0,
            jdbc.queryForObject(
                "select count(*) from stages where chapter between 1 and 15 and miniboss_hit_points is distinct from miniboss_health",
                Int::class.java,
            ),
        )
        assertEquals(512_000L, jdbc.queryForObject("select boss_hit_points from chapters where number = 5", Long::class.java))

        jdbc.update("update chapters set boss_health = null where number between 1 and 15")
        jdbc.update("update stages set monster_health = null, miniboss_health = null where chapter between 1 and 15")
    }

    @Test
    fun `the legacy health columns stay integer and accept null`() {
        for ((table, name) in listOf("chapters" to "boss_health", "stages" to "monster_health", "stages" to "miniboss_health")) {
            val column = column(table, name)
            assertEquals("integer", column["data_type"], "$table.$name")
            assertEquals("YES", column["is_nullable"], "$table.$name")
        }
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
