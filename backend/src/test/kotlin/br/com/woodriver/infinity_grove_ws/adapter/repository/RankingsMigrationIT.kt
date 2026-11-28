package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.flywaydb.core.Flyway
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import javax.sql.DataSource
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

/** V21 (spec rankings, Fortune and Storage): the five ranking tables, their checks, the cascade and the fortune peak trigger. */
class RankingsMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    @Autowired
    private lateinit var dataSource: DataSource

    private fun peak(): Long = jdbc.queryForObject("select peak_copper from player_fortune where username = 'ana'", Long::class.java)!!

    private fun peakAt(): Long = jdbc.queryForObject("select achieved_at from player_fortune where username = 'ana'", Long::class.java)!!

    private fun count(table: String): Int = jdbc.queryForObject("select count(*) from $table where username = 'ana'", Int::class.java)!!

    @Test
    fun `a wallet created with 700 copper starts its peak at 700`() {
        users("ana")

        jdbc.update("insert into wallets (username, copper) values ('ana', 700)")

        assertEquals(700L, peak())
    }

    @Test
    fun `a copper rise moves the peak and a fall keeps it`() {
        users("ana")
        jdbc.update("insert into wallets (username, copper) values ('ana', 0)")

        jdbc.update("update wallets set copper = 500 where username = 'ana'")
        jdbc.update("update wallets set copper = 200 where username = 'ana'")

        assertEquals(500L, peak())
    }

    @Test
    fun `the same copper again keeps the instant the peak was first reached`() {
        users("ana")
        jdbc.update("insert into wallets (username, copper) values ('ana', 500)")
        val first = peakAt()

        Thread.sleep(5)
        jdbc.update("update wallets set copper = 500 where username = 'ana'")

        assertEquals(first, peakAt())
    }

    @Test
    fun `a deleted user takes its rows of the five ranking tables with it`() {
        users("ana")
        jdbc.update("insert into player_run_clock (username, run_started_at, boss_reached_at) values ('ana', 1, 2)")
        jdbc.update("insert into player_boss_times (username, chapter, best_ms, achieved_at) values ('ana', 3, 12345, 1)")
        jdbc.update("insert into player_story_times (username, best_ms, achieved_at) values ('ana', 3600000, 1)")
        jdbc.update("insert into player_click_power (username, best_power, achieved_at) values ('ana', 41.0, 1)")
        jdbc.update("insert into wallets (username, copper) values ('ana', 10)")

        jdbc.update("delete from wallets where username = 'ana'")
        jdbc.update("delete from users where username = 'ana'")

        listOf("player_run_clock", "player_boss_times", "player_story_times", "player_click_power", "player_fortune")
            .forEach { assertEquals(0, count(it), it) }
    }

    @Test
    fun `the boss table refuses chapter 0 and chapter 16`() {
        users("ana")

        listOf(0, 16).forEach { chapter ->
            assertFailsWith<DataIntegrityViolationException>("chapter $chapter") {
                jdbc.update("insert into player_boss_times (username, chapter, best_ms, achieved_at) values ('ana', ?, 1000, 1)", chapter)
            }
        }
    }

    @Test
    fun `the time tables refuse a negative time`() {
        users("ana")

        assertFailsWith<DataIntegrityViolationException> {
            jdbc.update("insert into player_boss_times (username, chapter, best_ms, achieved_at) values ('ana', 3, -1, 1)")
        }
        assertFailsWith<DataIntegrityViolationException> {
            jdbc.update("insert into player_story_times (username, best_ms, achieved_at) values ('ana', -1, 1)")
        }
    }

    @Test
    fun `the power table refuses a power of 0`() {
        users("ana")

        assertFailsWith<DataIntegrityViolationException> {
            jdbc.update("insert into player_click_power (username, best_power, achieved_at) values ('ana', 0, 1)")
        }
    }

    @Test
    fun `the migration starts the peak of a wallet that existed before it at its copper`() {
        try {
            flyway("20").migrate()
            jdbc.update("insert into $BACKFILL_SCHEMA.users (username, password, created_at, last_login_at) values ('old', 'x', 1, 1)")
            jdbc.update("insert into $BACKFILL_SCHEMA.wallets (username, copper) values ('old', 1234)")

            flyway("21").migrate()

            assertEquals(
                1234L,
                jdbc.queryForObject("select peak_copper from $BACKFILL_SCHEMA.player_fortune where username = 'old'", Long::class.java),
            )
        } finally {
            jdbc.execute("drop schema if exists $BACKFILL_SCHEMA cascade")
        }
    }

    private fun flyway(target: String): Flyway =
        Flyway
            .configure()
            .dataSource(dataSource)
            .schemas(BACKFILL_SCHEMA)
            .createSchemas(true)
            .locations("classpath:db/migration")
            .target(target)
            .load()

    private companion object {
        const val BACKFILL_SCHEMA = "rankings_backfill"
    }
}
