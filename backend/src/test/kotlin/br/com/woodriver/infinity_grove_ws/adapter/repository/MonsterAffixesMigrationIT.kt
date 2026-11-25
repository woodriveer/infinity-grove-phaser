package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.MonsterAffix
import br.com.woodriver.infinity_grove_ws.domain.MonsterAffixType
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

/**
 * `V17__monster_affixes.sql` (spec early-game-rebalance): the stored chapters 2 to 15 get their 27 miniboss affixes and 14 boss affixes, the
 * tables refuse values outside their bounds, and the file can run again.
 */
class MonsterAffixesMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    private fun migrate() = jdbc.execute(ClassPathResource("db/migration/V17__monster_affixes.sql").getContentAsString(Charsets.UTF_8))

    private fun clear() {
        jdbc.update("delete from stage_affixes")
        jdbc.update("delete from chapter_affixes")
    }

    private fun count(table: String) = jdbc.queryForObject("select count(*) from $table", Int::class.java)

    private fun stageRow(id: String) = jdbc.queryForMap("select affix, amount, period_ms from stage_affixes where stage_id = ?", id)

    private fun chapterRow(chapter: Int) =
        jdbc.queryForMap("select affix, amount, period_ms from chapter_affixes where chapter = ?", chapter)

    private fun insertStage(
        stageId: String,
        affix: String,
        amount: Long,
        periodMs: Long?,
    ) = jdbc.update("insert into stage_affixes (stage_id, affix, amount, period_ms) values (?, ?, ?, ?)", stageId, affix, amount, periodMs)

    private fun insertChapter(
        chapter: Int,
        affix: String,
        amount: Long,
        periodMs: Long?,
    ) = jdbc.update("insert into chapter_affixes (chapter, affix, amount, period_ms) values (?, ?, ?, ?)", chapter, affix, amount, periodMs)

    // the test database is shared: every test leaves the 27 and 14 seeded rows back
    @AfterTest
    fun restore() {
        clear()
        migrate()
    }

    @Test
    fun `the migration gives the stored chapters 2 to 15 their 27 miniboss affixes and 14 boss affixes`() {
        clear()

        migrate()

        assertEquals(27, count("stage_affixes"))
        assertEquals(14, count("chapter_affixes"))
        assertEquals(mapOf("affix" to "SHELL", "amount" to 6L, "period_ms" to null), stageRow("3/3"))
        assertEquals(mapOf("affix" to "HIT_SHIELD", "amount" to 15L, "period_ms" to 6000L), stageRow("3/6"))
        assertEquals(mapOf("affix" to "SHELL", "amount" to 346L, "period_ms" to null), stageRow("10/6"))
        assertEquals(mapOf("affix" to "REGENERATION", "amount" to 25L, "period_ms" to null), chapterRow(4))
        assertEquals(mapOf("affix" to "SHELL", "amount" to 365L, "period_ms" to null), chapterRow(12))
        assertEquals(0, jdbc.queryForObject("select count(*) from stage_affixes where stage_id ~ '^1[1-5]/'", Int::class.java))
    }

    @Test
    fun `the rows of the migration are the affixes the seed writes`() {
        clear()

        migrate()

        (2..15).forEach { c ->
            val chapter = ChapterDefinition.of(c)
            chapter.stages.forEach { stage ->
                val row = jdbc.queryForList("select affix, amount, period_ms from stage_affixes where stage_id = ?", "$c/${stage.number}")
                assertEquals(stage.minibossAffix, row.singleOrNull()?.toAffix(), "stage $c/${stage.number}")
            }
            val boss = jdbc.queryForList("select affix, amount, period_ms from chapter_affixes where chapter = ?", c)
            assertEquals(chapter.bossAffix, boss.singleOrNull()?.toAffix(), "boss of chapter $c")
        }
    }

    private fun Map<String, Any?>.toAffix() =
        MonsterAffix(MonsterAffixType.valueOf(this["affix"] as String), this["amount"] as Long, this["period_ms"] as Long?)

    @Test
    fun `a second run changes nothing`() {
        clear()
        migrate()
        val stages = jdbc.queryForList("select * from stage_affixes order by stage_id")
        val chapters = jdbc.queryForList("select * from chapter_affixes order by chapter")

        migrate()

        assertEquals(stages, jdbc.queryForList("select * from stage_affixes order by stage_id"))
        assertEquals(chapters, jdbc.queryForList("select * from chapter_affixes order by chapter"))
        assertEquals(27, count("stage_affixes"))
        assertEquals(14, count("chapter_affixes"))
    }

    @Test
    fun `the tables refuse an amount of 0, an unknown affix and a shield without period`() {
        clear()

        assertFailsWith<DataIntegrityViolationException> { insertStage("1/3", "SHELL", 0, null) }
        assertFailsWith<DataIntegrityViolationException> { insertStage("1/3", "POISON", 5, null) }
        assertFailsWith<DataIntegrityViolationException> { insertStage("1/3", "HIT_SHIELD", 10, null) }
        assertFailsWith<DataIntegrityViolationException> { insertChapter(1, "SHELL", 0, null) }
        assertFailsWith<DataIntegrityViolationException> { insertChapter(1, "POISON", 5, null) }
        assertFailsWith<DataIntegrityViolationException> { insertChapter(1, "HIT_SHIELD", 10, null) }
        assertEquals(1, insertStage("1/3", "SHELL", 1, null))
        assertEquals(1, insertChapter(1, "HIT_SHIELD", 10, 6000))
    }

    @Test
    fun `a non-shield affix with a period is refused`() {
        clear()

        assertFailsWith<DataIntegrityViolationException> { insertStage("1/3", "SHELL", 5, 6000) }
        assertFailsWith<DataIntegrityViolationException> { insertChapter(1, "ARMORED", 20, 6000) }
        assertFailsWith<DataIntegrityViolationException> { insertStage("1/3", "HIT_SHIELD", 10, 600_001) }
    }

    @Test
    fun `a stage affix on a stage that does not exist is refused`() {
        clear()

        assertFailsWith<DataIntegrityViolationException> { insertStage("99/3", "SHELL", 5, null) }
        assertFailsWith<DataIntegrityViolationException> { insertChapter(99, "SHELL", 5, null) }
    }
}
