package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.flywaydb.core.Flyway
import org.flywaydb.core.api.FlywayException
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import java.sql.SQLException
import javax.sql.DataSource
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

/**
 * `V19__enemy_defense_expand.sql` (spec defense-contract, TD-002): the one defense gets its own column; a trigger keeps it and the two
 * old columns equal while the backend before this feature can still run (AD-016). The scratch schema cases migrate to V19 only, so they
 * keep holding after V20. `V20__enemy_defense_contract.sql` drops the old columns, their key and the trigger once no running backend reads
 * them.
 */
class EnemyDefenseMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    @Autowired
    private lateinit var dataSource: DataSource

    /** Migrates the scratch schema to [version] (a string such as "18" or "19"); the main test schema is left alone. */
    private fun scratchAt(version: String) =
        Flyway
            .configure()
            .dataSource(dataSource)
            .schemas(SCRATCH)
            .createSchemas(true)
            .locations("classpath:db/migration")
            .target(version)
            .load()
            .migrate()

    @AfterTest
    fun dropScratch() {
        jdbc.execute("drop schema if exists $SCRATCH cascade")
    }

    /** An enemy as the backend before this feature wrote it, in the scratch schema. */
    private fun oldEnemy(
        element: String,
        physicalDefense: Int,
        magicalDefense: Int,
        critResistance: Int,
    ) = jdbc.update(
        "insert into $SCRATCH.enemies (element, physical_defense, magical_defense, crit_resistance) values (?, ?, ?, ?)",
        element,
        physicalDefense,
        magicalDefense,
        critResistance,
    )

    private fun sqlStateOf(
        sql: String,
        vararg args: Any,
    ): String {
        val e = assertFailsWith<DataAccessException>("expected a failure: $sql ${args.toList()}") { jdbc.update(sql, *args) }
        return (e.mostSpecificCause as SQLException).sqlState
    }

    @Test
    fun `V19 copies physical_defense into defense on a database seeded before it`() {
        scratchAt("18")
        oldEnemy("WATER", 12, 12, 3)
        oldEnemy("FIRE", 40, 55, 9)

        scratchAt("19")

        assertEquals(listOf(12, 40), jdbc.queryForList("select defense from $SCRATCH.enemies order by id", Int::class.java))
    }

    @Test
    fun `the backend before this feature inserts the old columns and the row gets defense`() {
        scratchAt("19")

        val inserted =
            jdbc.update(
                "insert into $SCRATCH.enemies (element, physical_defense, magical_defense, crit_resistance) values (?, ?, ?, ?) " +
                    "on conflict (element, physical_defense, magical_defense, crit_resistance) do nothing",
                "LIGHT",
                86,
                86,
                96,
            )

        assertEquals(1, inserted)
        val defense =
            jdbc.queryForObject(
                "select defense from $SCRATCH.enemies where element = 'LIGHT' and crit_resistance = 96",
                Int::class.java,
            )
        assertEquals(86, defense)
    }

    @Test
    fun `a row inserted with physical_defense 85 and magical_defense 86 gets defense 85 and keeps both old values`() {
        scratchAt("19")

        oldEnemy("DARKNESS", 85, 86, 94)

        val row =
            jdbc.queryForMap(
                "select defense, physical_defense, magical_defense from $SCRATCH.enemies where element = 'DARKNESS' and crit_resistance = 94",
            )
        assertEquals(85, row["defense"])
        assertEquals(85, row["physical_defense"])
        assertEquals(86, row["magical_defense"])
    }

    @Test
    fun `the new backend inserts only defense and the old columns get it`() {
        scratchAt("19")

        val inserted =
            jdbc.update(
                "insert into $SCRATCH.enemies (element, defense, crit_resistance) values ('LIGHT', 87, 97) " +
                    "on conflict (element, defense, crit_resistance) do nothing",
            )

        assertEquals(1, inserted)
        val oldRead =
            jdbc.queryForList(
                "select physical_defense, magical_defense from $SCRATCH.enemies " +
                    "where element = 'LIGHT' and physical_defense = 87 and magical_defense = 87 and crit_resistance = 97",
            )
        assertEquals(1, oldRead.size)
        assertEquals(87, oldRead.single()["physical_defense"])
        assertEquals(87, oldRead.single()["magical_defense"])
    }

    @Test
    fun `defense is a not null integer with its check and unique key`() {
        val column =
            jdbc.queryForMap(
                "select data_type, is_nullable from information_schema.columns " +
                    "where table_schema = 'public' and table_name = 'enemies' and column_name = 'defense'",
            )
        val constraints = jdbc.queryForList("select conname from pg_constraint where conrelid = 'enemies'::regclass", String::class.java)

        assertEquals("integer", column["data_type"])
        assertEquals("NO", column["is_nullable"])
        assertTrue("ck_enemies_defense" in constraints, constraints.toString())
        assertTrue("uk_enemies_defense" in constraints, constraints.toString())
    }

    @Test
    fun `a defense of 91 or -1 is rejected`() {
        for (defense in listOf(91, -1)) {
            assertEquals(
                "23514",
                sqlStateOf("insert into enemies (element, defense, crit_resistance) values ('FIRE', ?, 0)", defense),
                "defense $defense",
            )
        }
    }

    @Test
    fun `a second enemy with the same element, defense and critical resistance is rejected`() {
        assertEquals(
            "23505",
            sqlStateOf(
                "insert into enemies (element, defense, crit_resistance) select element, defense, crit_resistance from enemies order by id limit 1",
            ),
        )
    }

    @Test
    fun `uk_enemies_defense alone rejects a repeat of element, defense and critical resistance whose magical_defense differs`() {
        scratchAt("19")
        jdbc.update("insert into $SCRATCH.enemies (element, defense, crit_resistance) values ('FIRE', 33, 44)")

        // magical_defense 34 keeps uk_enemies_attributes (element, physical_defense, magical_defense, crit_resistance) from firing
        val state =
            sqlStateOf("insert into $SCRATCH.enemies (element, defense, magical_defense, crit_resistance) values ('FIRE', 33, 34, 44)")

        assertEquals("23505", state)
        assertEquals(
            1,
            jdbc.queryForObject(
                "select count(*) from $SCRATCH.enemies where element = 'FIRE' and defense = 33 and crit_resistance = 44",
                Int::class.java,
            ),
        )
    }

    @Test
    fun `V19 fails and leaves V18 on a database with two enemies of the same element, physical defense and critical resistance`() {
        scratchAt("18")
        oldEnemy("FIRE", 10, 10, 5)
        oldEnemy("FIRE", 10, 20, 5)

        assertFailsWith<FlywayException> { scratchAt("19") }

        assertEquals(
            0,
            jdbc.queryForObject(
                "select count(*) from information_schema.columns " +
                    "where table_schema = '$SCRATCH' and table_name = 'enemies' and column_name = 'defense'",
                Int::class.java,
            ),
        )
        assertEquals(
            0,
            jdbc.queryForObject("select count(*) from $SCRATCH.flyway_schema_history where version = '19' and success", Int::class.java),
        )
    }

    @Test
    fun `V20 drops the old columns, their key and the trigger`() {
        assertEquals(
            0,
            jdbc.queryForObject(
                "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'enemies' " +
                    "and column_name in ('physical_defense', 'magical_defense')",
                Int::class.java,
            ),
        )
        assertEquals(0, jdbc.queryForObject("select count(*) from pg_constraint where conname = 'uk_enemies_attributes'", Int::class.java))
        assertEquals(0, jdbc.queryForObject("select count(*) from pg_trigger where tgname = 'enemies_defense_sync'", Int::class.java))
        assertEquals(0, jdbc.queryForObject("select count(*) from pg_proc where proname = 'enemies_defense_sync'", Int::class.java))
    }

    @Test
    fun `a database at V19 keeps every defense after V20`() {
        scratchAt("19")
        jdbc.update("insert into $SCRATCH.enemies (element, defense, crit_resistance) values ('WATER', 12, 3)")
        jdbc.update("insert into $SCRATCH.enemies (element, defense, crit_resistance) values ('FIRE', 40, 9)")

        scratchAt("20")

        assertEquals(listOf(12, 40), jdbc.queryForList("select defense from $SCRATCH.enemies order by id", Int::class.java))
    }

    private companion object {
        const val SCRATCH = "defense_expand_check"
    }
}
