package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import java.sql.SQLException
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

/** The constraints of `V1__schema.sql`, checked with plain SQL on the migrated database (seeded heroes, chapters, enemies, drop rules). */
class SchemaConstraintsIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    /** The phase monster of stage 1/1, a seeded enemy every test can point at. */
    private var enemy = 0L

    @BeforeTest
    fun seededReferences() {
        users("yan")
        enemy = jdbc.queryForObject("select monster_enemy_id from stages where id = '1/1'", Long::class.java)!!
    }

    private fun sqlStateOf(
        sql: String,
        vararg args: Any,
    ): String {
        val e = assertFailsWith<DataAccessException>("expected a failure: $sql ${args.toList()}") { jdbc.update(sql, *args) }
        return (e.mostSpecificCause as SQLException).sqlState
    }

    private fun assertRejected(
        state: String,
        sql: String,
        vararg args: Any,
    ) = assertEquals(state, sqlStateOf(sql, *args), "$sql ${args.toList()}")

    private fun count(
        table: String,
        username: String,
    ) = jdbc.queryForObject("select count(*) from $table where username = ?", Int::class.java, username)

    private val stageInsert =
        "insert into stages (id, chapter, number, phases_per_stage, monster_health, miniboss_health, miniboss_time_limit_ms, " +
            "monster_enemy_id, miniboss_enemy_id, monster_drop_rule_id, miniboss_drop_rule_id) values ('1/99', ?, 99, 5, 10, 50, 30000, ?, ?, ?, ?)"

    private val chapterInsert =
        "insert into chapters (number, boss_health, boss_time_limit_ms, boss_enemy_id, boss_drop_rule_id) values (99, 300, 60000, ?, ?)"

    @Test
    fun `flyway applied V1 and recorded it in its history`() {
        val row =
            jdbc.queryForMap("select script, success from flyway_schema_history where version = '1'")

        assertEquals("V1__schema.sql", row["script"])
        assertEquals(true, row["success"])
    }

    @Test
    fun `a username absent from users is rejected in each of the 7 player tables`() {
        val orphans =
            listOf(
                "insert into refresh_tokens (token_hash, username, expires_at, revoked) values ('h', 'ghost', 1, false)",
                "insert into wallets (username, copper) values ('ghost', 0)",
                "insert into wallet_drop_queues (id, username, drop_rule_id, drops, allowance, allowance_updated_at) " +
                    "values ('ghost/1', 'ghost', 1, '1', 20, 0)",
                "insert into progress (username, chapter, stage, encounter, phase, completed) values ('ghost', 1, 1, 'PHASE', 1, false)",
                "insert into player_cards (username, starting_element, leader_id, cleared_chapters, wins_today) " +
                    "values ('ghost', 'FIRE', 'kael', '', 0)",
                "insert into card_copies (id, username, hero_id, stars, copies) values ('ghost/kael/0', 'ghost', 'kael', 0, 1)",
                "insert into equipment_pieces (id, username, slot, rarity, refine, affixes, created_at) " +
                    "values ('p1', 'ghost', 'RING', 'COMMON', 0, '', 0)",
            )

        orphans.forEach { assertRejected("23503", it) }
    }

    @Test
    fun `a hero id absent from heroes is rejected in hero_skills, card_copies, equipment_pieces and player_cards`() {
        assertRejected(
            "23503",
            "insert into hero_skills (id, hero_id, slot, name, skill_type, effect, cooldown_seconds, image) " +
                "values ('nobody/1', 'nobody', 1, 'n', 'ACTIVE', 'e', 1, 'i')",
        )
        assertRejected(
            "23503",
            "insert into card_copies (id, username, hero_id, stars, copies) values ('yan/nobody/0', 'yan', 'nobody', 0, 1)",
        )
        assertRejected(
            "23503",
            "insert into equipment_pieces (id, username, slot, rarity, refine, affixes, hero_id, created_at) " +
                "values ('p1', 'yan', 'RING', 'COMMON', 0, '', 'nobody', 0)",
        )
        assertRejected(
            "23503",
            "insert into player_cards (username, starting_element, leader_id, cleared_chapters, wins_today) values ('yan', 'FIRE', 'nobody', '', 0)",
        )
    }

    @Test
    fun `a stage of a missing chapter, enemy or drop rule is rejected`() {
        assertRejected("23503", stageInsert, 999, enemy, enemy, 1, 2)
        assertRejected("23503", stageInsert, 1, 999_999L, enemy, 1, 2)
        assertRejected("23503", stageInsert, 1, enemy, 999_999L, 1, 2)
        assertRejected("23503", stageInsert, 1, enemy, enemy, 999, 2)
        assertRejected("23503", stageInsert, 1, enemy, enemy, 1, 999)
    }

    @Test
    fun `a chapter with a missing boss enemy or boss drop rule is rejected`() {
        assertRejected("23503", chapterInsert, 999_999L, 3)
        assertRejected("23503", chapterInsert, enemy, 999)
    }

    @Test
    fun `a progress on a chapter and stage pair absent from stages is rejected`() {
        assertRejected(
            "23503",
            "insert into progress (username, chapter, stage, encounter, phase, completed) values ('yan', 1, 11, 'PHASE', 1, false)",
        )
        assertRejected(
            "23503",
            "insert into progress (username, chapter, stage, encounter, phase, completed) values ('yan', 6, 1, 'PHASE', 1, false)",
        )
    }

    @Test
    fun `a wallet queue of a missing drop rule is rejected`() {
        assertRejected(
            "23503",
            "insert into wallet_drop_queues (id, username, drop_rule_id, drops, allowance, allowance_updated_at) " +
                "values ('yan/999', 'yan', 999, '1', 20, 0)",
        )
    }

    @Test
    fun `deleting a user deletes that player's rows in the 7 player tables and leaves other players`() {
        users("ana")
        listOf("yan", "ana").forEach { name ->
            jdbc.update("insert into refresh_tokens (token_hash, username, expires_at, revoked) values (?, ?, 1, false)", "h-$name", name)
            jdbc.update("insert into wallets (username, copper) values (?, 5)", name)
            jdbc.update(
                "insert into wallet_drop_queues (id, username, drop_rule_id, drops, allowance, allowance_updated_at) values (?, ?, 1, '1', 20, 0)",
                "$name/1",
                name,
            )
            jdbc.update(
                "insert into progress (username, chapter, stage, encounter, phase, completed) values (?, 1, 1, 'PHASE', 1, false)",
                name,
            )
            jdbc.update(
                "insert into player_cards (username, starting_element, leader_id, cleared_chapters, wins_today) values (?, 'FIRE', 'kael', '', 0)",
                name,
            )
            jdbc.update("insert into card_copies (id, username, hero_id, stars, copies) values (?, ?, 'kael', 0, 1)", "$name/kael/0", name)
            jdbc.update(
                "insert into equipment_pieces (id, username, slot, rarity, refine, affixes, hero_id, created_at) " +
                    "values (?, ?, 'RING', 'COMMON', 0, '', 'kael', 0)",
                "piece-$name",
                name,
            )
        }
        val tables =
            listOf("refresh_tokens", "wallets", "wallet_drop_queues", "progress", "player_cards", "card_copies", "equipment_pieces")

        jdbc.update("delete from users where username = 'yan'")

        tables.forEach { assertEquals(0, count(it, "yan"), "$it rows of the deleted user") }
        tables.forEach { assertEquals(1, count(it, "ana"), "$it rows of the other user") }
    }

    @Test
    fun `deleting a referenced hero, chapter, stage, enemy or drop rule is rejected`() {
        jdbc.update("insert into progress (username, chapter, stage, encounter, phase, completed) values ('yan', 1, 1, 'PHASE', 1, false)")

        assertRejected("23503", "delete from heroes where id = 'kael'")
        assertRejected("23503", "delete from chapters where number = 1")
        assertRejected("23503", "delete from stages where id = '1/1'")
        assertRejected("23503", "delete from enemies where id = ?", enemy)
        assertRejected("23503", "delete from drop_rules where id = 1")
    }

    @Test
    fun `a second enemy with the same four attributes is rejected`() {
        assertRejected(
            "23505",
            "insert into enemies (element, physical_defense, magical_defense, crit_resistance) " +
                "select element, physical_defense, magical_defense, crit_resistance from enemies where id = ?",
            enemy,
        )
    }

    @Test
    fun `enemy attributes outside their bounds are rejected`() {
        val insert = "insert into enemies (element, physical_defense, magical_defense, crit_resistance) values (?, ?, ?, ?)"

        assertRejected("23514", insert, "FIRE", 91, 0, 0)
        assertRejected("23514", insert, "FIRE", 0, 91, 0)
        assertRejected("23514", insert, "FIRE", 0, 0, 101)
        assertRejected("23514", insert, "PLASMA", 1, 2, 3)
    }

    @Test
    fun `drop rule values outside their bounds are rejected`() {
        val insert = "insert into drop_rules (id, min_copper, max_copper, kill_interval_ms) values (900, ?, ?, ?)"

        assertRejected("23514", insert, 0, 5, 1500L)
        assertRejected("23514", insert, 5, 4, 1500L)
        assertRejected("23514", insert, 1, 5, 0L)
    }
}
