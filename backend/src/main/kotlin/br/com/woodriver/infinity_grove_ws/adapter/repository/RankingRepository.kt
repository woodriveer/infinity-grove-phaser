package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.RankingBoard
import br.com.woodriver.infinity_grove_ws.domain.RankingEntry
import br.com.woodriver.infinity_grove_ws.domain.RankingMe
import br.com.woodriver.infinity_grove_ws.domain.RunClock
import br.com.woodriver.infinity_grove_ws.port.RankingRepositoryPort
import org.slf4j.LoggerFactory
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.sql.Types

/**
 * The ranking tables of V21 through JDBC: the two clocks, the three records that keep the better value in one `insert ... on conflict`
 * statement, and the top 10 and the caller's position of each board. Every method joins the caller's transaction.
 */
@Repository
class RankingRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) : RankingRepositoryPort {
    @Transactional
    override fun clock(username: String): RunClock =
        jdbc
            .query(
                "select run_started_at, boss_reached_at from player_run_clock where username = :username",
                MapSqlParameterSource("username", username),
            ) { rs, _ -> RunClock(username, rs.getObject("run_started_at") as Long?, rs.getObject("boss_reached_at") as Long?) }
            .firstOrNull() ?: RunClock(username)

    @Transactional
    override fun saveClock(clock: RunClock) {
        jdbc.update(
            """
            insert into player_run_clock (username, run_started_at, boss_reached_at) values (:username, :run, :boss)
            on conflict (username) do update set run_started_at = excluded.run_started_at, boss_reached_at = excluded.boss_reached_at
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("username", clock.username)
                .addValue("run", clock.runStartedAt, Types.BIGINT)
                .addValue("boss", clock.bossReachedAt, Types.BIGINT),
        )
        logger.debug(
            "Run clock saved username={} runStartedAt={} bossReachedAt={}",
            clock.username,
            clock.runStartedAt,
            clock.bossReachedAt,
        )
    }

    @Transactional
    override fun improveBossTime(
        username: String,
        chapter: Int,
        ms: Long,
        at: Long,
    ): Boolean =
        jdbc.update(
            """
            insert into player_boss_times (username, chapter, best_ms, achieved_at) values (:username, :chapter, :ms, :at)
            on conflict (username, chapter) do update set best_ms = excluded.best_ms, achieved_at = excluded.achieved_at
            where excluded.best_ms < player_boss_times.best_ms
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("username", username)
                .addValue("chapter", chapter)
                .addValue("ms", ms)
                .addValue("at", at),
        ) == 1

    @Transactional
    override fun improveStoryTime(
        username: String,
        ms: Long,
        at: Long,
    ): Boolean =
        jdbc.update(
            """
            insert into player_story_times (username, best_ms, achieved_at) values (:username, :ms, :at)
            on conflict (username) do update set best_ms = excluded.best_ms, achieved_at = excluded.achieved_at
            where excluded.best_ms < player_story_times.best_ms
            """.trimIndent(),
            MapSqlParameterSource().addValue("username", username).addValue("ms", ms).addValue("at", at),
        ) == 1

    @Transactional
    override fun improveClickPower(
        username: String,
        power: Double,
        at: Long,
    ): Boolean =
        jdbc.update(
            """
            insert into player_click_power (username, best_power, achieved_at) values (:username, :power, :at)
            on conflict (username) do update set best_power = excluded.best_power, achieved_at = excluded.achieved_at
            where excluded.best_power > player_click_power.best_power
            """.trimIndent(),
            MapSqlParameterSource().addValue("username", username).addValue("power", power).addValue("at", at),
        ) == 1

    @Transactional
    override fun clickPower(username: String): Double? =
        jdbc
            .query(
                "select best_power from player_click_power where username = :username",
                MapSqlParameterSource("username", username),
            ) { rs, _ -> rs.getDouble("best_power") }
            .firstOrNull()

    @Transactional
    override fun top(
        board: RankingBoard,
        chapter: Int?,
        limit: Int,
    ): List<RankingEntry> {
        val source = sourceOf(board)
        val direction = if (source.ascending) "asc" else "desc"
        val rows =
            jdbc.query(
                """
                select username, cast(${source.column} as double precision) as value from ${source.table} where ${source.filter}
                order by ${source.column} $direction, achieved_at asc, username collate "C" asc limit :limit
                """.trimIndent(),
                MapSqlParameterSource().addValue("chapter", chapter).addValue("limit", limit),
            ) { rs, _ -> rs.getString("username") to rs.getDouble("value") }
        return rows.mapIndexed { index, (username, value) -> RankingEntry(index + 1, username, value) }
    }

    @Transactional
    override fun me(
        board: RankingBoard,
        chapter: Int?,
        username: String,
    ): RankingMe? {
        val source = sourceOf(board)
        val own =
            jdbc
                .query(
                    "select ${source.column} as raw, cast(${source.column} as double precision) as value, achieved_at " +
                        "from ${source.table} where ${source.filter} and username = :username",
                    MapSqlParameterSource().addValue("chapter", chapter).addValue("username", username),
                ) { rs, _ -> Own(rs.getObject("raw"), rs.getDouble("value"), rs.getLong("achieved_at")) }
                .firstOrNull() ?: return null
        val operator = if (source.ascending) "<" else ">"
        val ahead =
            jdbc.queryForObject(
                """
                select count(*) from ${source.table} where ${source.filter} and (${source.column} $operator :raw or
                    (${source.column} = :raw and (achieved_at < :at or (achieved_at = :at and username collate "C" < :username))))
                """.trimIndent(),
                MapSqlParameterSource()
                    .addValue("chapter", chapter)
                    .addValue("raw", own.raw)
                    .addValue("at", own.achievedAt)
                    .addValue("username", username),
                Long::class.java,
            )!!
        logger.debug("Ranking position username={} board={} chapter={} position={}", username, board, chapter, ahead + 1)
        return RankingMe((ahead + 1).toInt(), username, own.value)
    }

    private data class Source(
        val table: String,
        val column: String,
        val filter: String,
        val ascending: Boolean,
    )

    /** The caller's stored value as the column holds it ([raw] is a Long or a Double), as a double, and when it was reached. */
    private data class Own(
        val raw: Any?,
        val value: Double,
        val achievedAt: Long,
    )

    private fun sourceOf(board: RankingBoard): Source =
        when (board) {
            RankingBoard.BOSS_TIME -> Source("player_boss_times", "best_ms", "chapter = :chapter", ascending = true)
            RankingBoard.STORY_TIME -> Source("player_story_times", "best_ms", "true", ascending = true)
            RankingBoard.CLICK_POWER -> Source("player_click_power", "best_power", "true", ascending = false)
            RankingBoard.FORTUNE -> Source("player_fortune", "peak_copper", "peak_copper > 0", ascending = false)
        }

    private companion object {
        private val logger = LoggerFactory.getLogger(RankingRepository::class.java)
    }
}
