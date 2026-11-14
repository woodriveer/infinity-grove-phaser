package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.flywaydb.core.Flyway
import org.flywaydb.core.api.MigrationState
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.support.PathMatchingResourcePatternResolver
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.support.TransactionTemplate
import java.nio.file.Files
import java.nio.file.Path
import javax.sql.DataSource
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * AD-016: the release before 64-bit health (commit `91e3111`) must keep starting and serving on the database after V8 and V9.
 * Its entities map the legacy `integer` health columns and the drop rule columns, so these checks replay what it runs at start
 * (the column types of `ddl-auto: validate`, Flyway's validation of its own migrations) and on its read and write paths, against the
 * migrated database. Booting the previous image itself is not executed here.
 */
class PreviousBackendCompatibilityIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    @Autowired
    private lateinit var dataSource: DataSource

    @Autowired
    private lateinit var transactions: PlatformTransactionManager

    @AfterTest
    fun dropPreviousSchema() {
        jdbc.execute("drop schema if exists $PREVIOUS_SCHEMA cascade")
    }

    /** Runs [block] in a transaction that is rolled back, so the writes it makes never reach the other tests. */
    private fun rolledBack(block: () -> Unit) {
        TransactionTemplate(transactions).execute { status ->
            block()
            status.setRollbackOnly()
        }
    }

    private fun dataType(
        table: String,
        column: String,
    ): String? =
        jdbc
            .queryForList(
                "select data_type from information_schema.columns where table_schema = 'public' and table_name = ? and column_name = ?",
                String::class.java,
                table,
                column,
            ).singleOrNull()

    @Test
    fun `the previous entities pass the schema check of the migrated database`() {
        val previousEntityColumns =
            mapOf(
                "chapters" to
                    mapOf(
                        "number" to "integer",
                        "boss_health" to "integer",
                        "boss_time_limit_ms" to "bigint",
                        "boss_enemy_id" to "bigint",
                        "boss_drop_rule_id" to "integer",
                    ),
                "stages" to
                    mapOf(
                        "id" to "character varying",
                        "chapter" to "integer",
                        "number" to "integer",
                        "phases_per_stage" to "integer",
                        "monster_health" to "integer",
                        "miniboss_health" to "integer",
                        "miniboss_time_limit_ms" to "bigint",
                        "monster_enemy_id" to "bigint",
                        "miniboss_enemy_id" to "bigint",
                        "monster_drop_rule_id" to "integer",
                        "miniboss_drop_rule_id" to "integer",
                    ),
                "drop_rules" to
                    mapOf(
                        "id" to "integer",
                        "min_copper" to "integer",
                        "max_copper" to "integer",
                        "kill_interval_ms" to "bigint",
                    ),
            )

        previousEntityColumns.forEach { (table, columns) ->
            columns.forEach { (column, type) ->
                assertEquals(type, dataType(table, column), "$table.$column")
            }
        }
    }

    @Test
    fun `the previous backend reads the legacy integer health of chapters 1 to 15`() {
        val bossHealth =
            jdbc
                .query("select number, boss_health from chapters order by number") { rs, _ ->
                    rs.getInt("number") to rs.getInt("boss_health")
                }.toMap()
        val stageHealth =
            jdbc
                .query("select chapter, monster_health, miniboss_health from stages where number = 10 order by chapter") { rs, _ ->
                    rs.getInt("chapter") to (rs.getInt("monster_health") to rs.getInt("miniboss_health"))
                }.toMap()

        assertEquals((1..15).toList(), bossHealth.keys.toList())
        assertEquals(2_000, bossHealth[1])
        assertEquals(512_000, bossHealth[5])
        assertEquals(16_384_000, bossHealth[10])
        assertEquals(524_288_000, bossHealth[15])
        assertEquals(
            0,
            jdbc.queryForObject(
                "select count(*) from stages where monster_health is null or miniboss_health is null",
                Int::class.java,
            ),
        )
        assertEquals(19_456 to 97_280, stageHealth[5])
        assertEquals(622_592 to 3_112_960, stageHealth[10])
        assertEquals(19_922_944 to 99_614_720, stageHealth[15])
    }

    @Test
    fun `the previous backend reads the drop rules of chapters 1 to 15 in its shape`() {
        assertEquals(
            15,
            jdbc.queryForObject("select count(*) from drop_rules where id <= 15 and kill_interval_ms = 1500", Int::class.java),
        )
        val ranges =
            listOf(1, 5, 13, 15).map { id ->
                jdbc.queryForObject(
                    "select min_copper, max_copper from drop_rules where id = ?",
                    { rs, _ -> rs.getInt("min_copper") to rs.getInt("max_copper") },
                    id,
                )
            }
        assertEquals(listOf(2 to 6, 16 to 40, 32 to 96, 480 to 1_120), ranges)
    }

    @Test
    fun `the previous backend writes the legacy health and the drop rule columns`() {
        rolledBack {
            assertEquals(1, jdbc.update("update chapters set boss_health = ? where number = ?", 3_000, 1))
            assertEquals(3_000, jdbc.queryForObject("select boss_health from chapters where number = 1", Int::class.java))
            assertEquals(
                1,
                jdbc.update(
                    "update drop_rules set min_copper = ?, max_copper = ?, kill_interval_ms = ? where id = ?",
                    20,
                    50,
                    1500L,
                    5,
                ),
            )
            assertEquals(20, jdbc.queryForObject("select min_copper from drop_rules where id = 5", Int::class.java))
        }

        assertEquals(2_000, jdbc.queryForObject("select boss_health from chapters where number = 1", Int::class.java))
        assertEquals(16, jdbc.queryForObject("select min_copper from drop_rules where id = 5", Int::class.java))
    }

    @Test
    fun `the previous release starts on the migrated schema and its validation ignores V8 and V9`() {
        Flyway
            .configure()
            .dataSource(dataSource)
            .schemas(PREVIOUS_SCHEMA)
            .createSchemas(true)
            .locations("classpath:db/migration")
            .load()
            .migrate()

        val previousDir = previousMigrations()
        try {
            assertEquals(PREVIOUS_LAST_VERSION, previousDir.toFile().listFiles()!!.size)

            val previous =
                Flyway
                    .configure()
                    .dataSource(dataSource)
                    .schemas(PREVIOUS_SCHEMA)
                    .locations("filesystem:${previousDir.toAbsolutePath().toString().replace('\\', '/')}")
                    .load()

            previous.validate()
            assertEquals(0, previous.migrate().migrationsExecuted)
            assertEquals(
                listOf(MigrationState.FUTURE_SUCCESS, MigrationState.FUTURE_SUCCESS),
                previous
                    .info()
                    .all()
                    .filter { (it.version?.major?.toInt() ?: 0) > PREVIOUS_LAST_VERSION }
                    .map { it.state },
            )
        } finally {
            previousDir.toFile().deleteRecursively()
        }
    }

    /** The migrations of the previous release: the files of `V1` to `V7`, which are unchanged since commit `91e3111`. */
    private fun previousMigrations(): Path {
        val dir = Files.createTempDirectory("previous-release-migrations")
        PathMatchingResourcePatternResolver()
            .getResources("classpath*:db/migration/V*.sql")
            .filter { resource -> versionOf(resource.filename!!) <= PREVIOUS_LAST_VERSION }
            .forEach { resource -> resource.inputStream.use { Files.copy(it, dir.resolve(resource.filename!!)) } }
        return dir
    }

    private fun versionOf(fileName: String): Int = Regex("""V(\d+)__""").find(fileName)!!.groupValues[1].toInt()

    private companion object {
        const val PREVIOUS_SCHEMA = "previous_backend_check"
        const val PREVIOUS_LAST_VERSION = 7
    }
}
