package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals

/**
 * `V16__early_game_rebalance.sql` (spec early-game-rebalance): a database seeded by the release before gets the Chapter Table numbers, 8
 * phases, 3 times minibosses, the new limits and the early critical resistances on the rows that still hold the old seed; a tuned row stays
 * and the file can run again. Each test writes the old seed back first; the shared database is left on the new seed.
 */
class EarlyGameRebalanceMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    /** V16 as it reads on a database after V20 (spec defense-contract, design § V16 Replay): the dropped defense columns map to `defense`. */
    private fun migrate() =
        jdbc.execute(
            ClassPathResource("db/migration/V16__early_game_rebalance.sql")
                .getContentAsString(Charsets.UTF_8)
                .replace("n.physical_defense = e.physical_defense and n.magical_defense = e.magical_defense", "n.defense = e.defense")
                .replace("e.physical_defense, e.magical_defense", "e.defense")
                .replace("(element, physical_defense, magical_defense, crit_resistance)", "(element, defense, crit_resistance)")
                .replace("uk_enemies_attributes", "uk_enemies_defense"),
        )

    private fun count(sql: String) = jdbc.queryForObject(sql, Int::class.java)

    /** The health the release seeded for stage [s] (phase monster) and chapter [c] (boss), as SQL. */
    private val oldPhaseHealth =
        "(40 + 4 * (s.number - 1)) * (case when s.chapter <= 5 then power(4, s.chapter - 1) else 256 * power(2, s.chapter - 5) end)::bigint"
    private val oldBossHealth =
        "2000 * (case when c.number <= 5 then power(4, c.number - 1) else 256 * power(2, c.number - 5) end)::bigint"

    /** Writes the seed of the release before this feature back onto the stored chapters. */
    private fun writeOldSeed() {
        jdbc.update(
            "update stages s set phases_per_stage = 5, monster_hit_points = $oldPhaseHealth, miniboss_hit_points = 5 * $oldPhaseHealth",
        )
        jdbc.update("update stages set miniboss_time_limit_ms = 30000")
        jdbc.update("update chapters c set boss_hit_points = $oldBossHealth, boss_time_limit_ms = 60000")
        jdbc.update("update stage_adds a set hit_points = 3 * $oldPhaseHealth from stages s where s.id = a.stage_id")
        jdbc.execute(
            """
            insert into enemies (element, defense, crit_resistance)
            select distinct e.element, e.defense, 10 + 2 * s.number + 5 * (s.chapter - 1)
              from stages s join enemies e on e.id = s.miniboss_enemy_id where s.chapter between 1 and 5
            on conflict on constraint uk_enemies_defense do nothing;
            update stages s set miniboss_enemy_id = n.id from enemies e, enemies n
             where e.id = s.miniboss_enemy_id and s.chapter between 1 and 5
               and n.element = e.element and n.defense = e.defense
               and n.crit_resistance = 10 + 2 * s.number + 5 * (s.chapter - 1);
            insert into enemies (element, defense, crit_resistance)
            select distinct e.element, e.defense, 30 + 5 * (c.number - 1)
              from chapters c join enemies e on e.id = c.boss_enemy_id where c.number between 1 and 5
            on conflict on constraint uk_enemies_defense do nothing;
            update chapters c set boss_enemy_id = n.id from enemies e, enemies n
             where e.id = c.boss_enemy_id and c.number between 1 and 5
               and n.element = e.element and n.defense = e.defense
               and n.crit_resistance = 30 + 5 * (c.number - 1);
            """.trimIndent(),
        )
    }

    private fun oldSeedThenMigrate() {
        writeOldSeed()
        migrate()
    }

    private fun stageHealth(id: String) =
        jdbc.queryForMap("select monster_hit_points, miniboss_hit_points from stages where id = ?", id).let {
            (it["monster_hit_points"] as Long) to (it["miniboss_hit_points"] as Long)
        }

    private fun minibossEnemy(id: String) =
        jdbc.queryForMap(
            "select e.id, e.element, e.defense, e.crit_resistance from stages s join enemies e on e.id = s.miniboss_enemy_id where s.id = ?",
            id,
        )

    private fun bossEnemy(chapter: Int) =
        jdbc.queryForMap(
            "select e.id, e.element, e.defense, e.crit_resistance from chapters c join enemies e on e.id = c.boss_enemy_id where c.number = ?",
            chapter,
        )

    private fun snapshot() =
        listOf(
            jdbc.queryForList(
                "select id, phases_per_stage, monster_hit_points, miniboss_hit_points, miniboss_time_limit_ms, miniboss_enemy_id from stages order by id",
            ),
            jdbc.queryForList("select number, boss_hit_points, boss_time_limit_ms, boss_enemy_id from chapters order by number"),
            jdbc.queryForList("select id, hit_points, defense_buff from stage_adds order by id"),
        )

    // the test database is shared: every test leaves the new seed back
    @AfterTest
    fun restore() {
        oldSeedThenMigrate()
    }

    @Test
    fun `the migration gives every stage 8 phases`() {
        oldSeedThenMigrate()

        assertEquals(0, count("select count(*) from stages where phases_per_stage <> 8"))
    }

    @Test
    fun `the migration gives every chapter the table phase and miniboss health`() {
        oldSeedThenMigrate()

        assertEquals(69L to 207L, stageHealth("1/1"))
        assertEquals(898L to 2694L, stageHealth("1/10"))
        assertEquals(1811L to 5433L, stageHealth("3/5"))
        assertEquals(10_000L to 30_000L, stageHealth("6/1"))
        assertEquals(229_153L to 687_459L, stageHealth("15/10"))
    }

    @Test
    fun `the migration gives every miniboss 45 seconds and every boss 90 seconds`() {
        oldSeedThenMigrate()

        assertEquals(0, count("select count(*) from stages where miniboss_time_limit_ms <> 45000"))
        assertEquals(0, count("select count(*) from chapters where boss_time_limit_ms <> 90000"))
    }

    @Test
    fun `the migration gives the chapter bosses the table health`() {
        oldSeedThenMigrate()

        val health =
            jdbc
                .query("select number, boss_hit_points from chapters") { rs, _ ->
                    rs.getInt("number") to
                        rs.getLong("boss_hit_points")
                }.toMap()
        assertEquals(6_000L, health[1])
        assertEquals(80_000L, health[5])
        assertEquals(130_000L, health[6])
        assertEquals(4_265_000L, health[15])
    }

    @Test
    fun `the migration gives the adds of chapters 11 to 15 3 times the new phase health`() {
        oldSeedThenMigrate()

        val first = jdbc.queryForMap("select hit_points, defense_buff from stage_adds where id = '11/1/1'")
        val last = jdbc.queryForMap("select hit_points, defense_buff from stage_adds where id = '15/10/2'")
        assertEquals(114_000L, first["hit_points"])
        assertEquals(30, first["defense_buff"])
        assertEquals(687_459L, last["hit_points"])
        assertEquals(50, last["defense_buff"])
    }

    @Test
    fun `the migration points the minibosses of chapters 1 to 5 at the new critical resistance with the same element and defense`() {
        val sixth = minibossEnemy("6/1")["id"]
        oldSeedThenMigrate()

        listOf(
            Triple("1/1", 0 to 11, "FIRE"),
            Triple("2/10", 17 to 25, "FIRE"),
            Triple("5/10", 41 to 40, "LIGHT"),
        ).forEach { (id, stats, element) ->
            val enemy = minibossEnemy(id)
            assertEquals(stats.first, enemy["crit_resistance"], "stage $id crit resistance")
            assertEquals(stats.second, enemy["defense"], "stage $id defense")
            assertEquals(element, enemy["element"], "stage $id element")
        }
        assertEquals(sixth, minibossEnemy("6/1")["id"])
    }

    @Test
    fun `the migration points the chapter bosses of 1 to 5 at critical resistance 5, 15, 25, 35 and 45`() {
        val sixth = bossEnemy(6)["id"]
        oldSeedThenMigrate()

        assertEquals(listOf(5, 15, 25, 35, 45), (1..5).map { bossEnemy(it)["crit_resistance"] })
        assertEquals(listOf(30, 35, 40, 45, 50), (1..5).map { bossEnemy(it)["defense"] })
        assertEquals(sixth, bossEnemy(6)["id"])
    }

    @Test
    fun `a tuned stage health, phase count, limit, add and boss health stay`() {
        writeOldSeed()
        jdbc.update("update stages set monster_hit_points = 999 where id = '1/2'")
        jdbc.update("update stages set phases_per_stage = 6 where id = '1/4'")
        jdbc.update("update stages set miniboss_time_limit_ms = 31000 where id = '1/3'")
        jdbc.update("update stage_adds set hit_points = 77 where id = '12/1/1'")
        jdbc.update("update chapters set boss_hit_points = 7777 where number = 2")

        migrate()

        assertEquals(999L, stageHealth("1/2").first)
        assertEquals(6, jdbc.queryForObject("select phases_per_stage from stages where id = '1/4'", Int::class.java))
        assertEquals(31_000L, jdbc.queryForObject("select miniboss_time_limit_ms from stages where id = '1/3'", Long::class.java))
        assertEquals(77L, jdbc.queryForObject("select hit_points from stage_adds where id = '12/1/1'", Long::class.java))
        assertEquals(7_777L, jdbc.queryForObject("select boss_hit_points from chapters where number = 2", Long::class.java))
        assertEquals(69L, stageHealth("1/1").first)
    }

    @Test
    fun `a miniboss whose enemy was tuned keeps its enemy`() {
        writeOldSeed()
        val element = minibossEnemy("1/4")["element"]
        jdbc.update(
            "insert into enemies (element, defense, crit_resistance) values (?, 14, 50) on conflict do nothing",
            element,
        )
        val tuned =
            jdbc.queryForObject(
                "select id from enemies where element = ? and defense = 14 and crit_resistance = 50",
                Long::class.java,
                element,
            )
        jdbc.update("update stages set miniboss_enemy_id = ? where id = '1/4'", tuned)

        migrate()

        assertEquals(tuned, minibossEnemy("1/4")["id"])
        assertNotEquals(50, minibossEnemy("1/3")["crit_resistance"])
    }

    @Test
    fun `a second run changes nothing`() {
        oldSeedThenMigrate()
        val first = snapshot()
        val enemies = count("select count(*) from enemies")

        migrate()

        assertEquals(first, snapshot())
        assertEquals(enemies, count("select count(*) from enemies"))
    }
}
