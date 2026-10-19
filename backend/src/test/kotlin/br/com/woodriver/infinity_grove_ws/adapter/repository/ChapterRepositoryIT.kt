package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.EnemyStats
import br.com.woodriver.infinity_grove_ws.domain.StageDefinition
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ChapterRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var repository: ChapterRepository

    @Autowired
    private lateinit var jdbc: JdbcTemplate

    // chapter 1 is the seeded one other tests play against, so these tests use their own number
    private val number = 90

    private fun chapter(
        bossHealth: Int = 321,
        stages: Int = 3,
    ) = ChapterDefinition(
        number,
        bossHealth = bossHealth,
        bossTimeLimitMs = 61_000,
        stages =
            (1..stages).map {
                StageDefinition(
                    number = it,
                    phasesPerStage = 4 + it,
                    monsterHealth = 20 + it,
                    minibossHealth = 100 + it,
                    minibossTimeLimitMs = 31_000L + it,
                    monster = EnemyStats(Element.WATER, it, it + 1, it + 2),
                    miniboss = EnemyStats(Element.LIGHT, 20 + it, 30 + it, 40 + it),
                    monsterDropRuleId = 2,
                    minibossDropRuleId = 3,
                )
            },
        boss = EnemyStats(Element.DARKNESS, 55, 66, 77),
        bossDropRuleId = 4,
    )

    private fun clean() {
        jpaStageRepository.deleteAll(jpaStageRepository.findAllByChapterOrderByNumber(number))
        jpaChapterRepository.deleteById(number)
        removeUnusedEnemies()
    }

    // the enemies these tests add are referenced by no seeded stage or chapter
    private fun removeUnusedEnemies() {
        jdbc.update(
            "delete from enemies e where not exists (select 1 from stages s where e.id in (s.monster_enemy_id, s.miniboss_enemy_id)) " +
                "and not exists (select 1 from chapters c where c.boss_enemy_id = e.id)",
        )
    }

    @BeforeTest
    fun cleanBefore() = jpaChapterRepository.findById(number).ifPresent { clean() }

    @AfterTest
    fun cleanAfter() = jpaChapterRepository.findById(number).ifPresent { clean() }

    @Test
    fun `a saved chapter reads back equal with every stage field in stage order`() {
        repository.save(chapter())

        assertEquals(chapter(), repository.findByNumber(number))
    }

    @Test
    fun `saving a chapter again replaces its values`() {
        repository.save(chapter(bossHealth = 321))

        repository.save(chapter(bossHealth = 999))

        assertEquals(999, repository.findByNumber(number)!!.bossHealth)
    }

    @Test
    fun `existsByNumber is false before the save and true after`() {
        assertFalse(repository.existsByNumber(number))

        repository.save(chapter())

        assertTrue(repository.existsByNumber(number))
    }

    @Test
    fun `an unknown chapter reads null`() {
        assertNull(repository.findByNumber(12345))
    }

    @Test
    fun `chapters do not mix their stages`() {
        repository.save(chapter(stages = 3))
        val other = ChapterDefinition(91, 5, 1000, listOf(StageDefinition(1, 1, 1, 1, 1000)))
        repository.save(other)

        try {
            assertEquals(3, repository.findByNumber(number)!!.stageCount)
            assertEquals(1, repository.findByNumber(91)!!.stageCount)
        } finally {
            jpaStageRepository.deleteAll(jpaStageRepository.findAllByChapterOrderByNumber(91))
            jpaChapterRepository.deleteById(91)
        }
    }

    @Test
    fun `a stored element that is not one of the five fails the load`() {
        repository.save(chapter())
        jdbc.update("update enemies set element = 'PLASMA' where id = (select monster_enemy_id from stages where id = ?)", "$number/1")

        // the repository is transactional, so Spring wraps the enum error
        val e = assertFailsWith<RuntimeException> { repository.findByNumber(number) }

        assertTrue(e.message!!.contains("PLASMA"), e.message)
    }

    @Test
    fun `rows written by SQL read the enemies and drop rules they point at`() {
        val boss =
            jdbc.queryForObject(
                "insert into enemies (element, physical_defense, magical_defense, crit_resistance) values ('NATURE', 85, 86, 87) returning id",
                Long::class.java,
            )
        val monster =
            jdbc.queryForObject(
                "insert into enemies (element, physical_defense, magical_defense, crit_resistance) values ('LIGHT', 88, 89, 90) returning id",
                Long::class.java,
            )
        jdbc.update(
            "insert into chapters (number, boss_health, boss_time_limit_ms, boss_enemy_id, boss_drop_rule_id) values (?, 5, 1000, ?, 3)",
            number,
            boss,
        )
        jdbc.update(
            "insert into stages (id, chapter, number, phases_per_stage, monster_health, miniboss_health, miniboss_time_limit_ms, " +
                "monster_enemy_id, miniboss_enemy_id, monster_drop_rule_id, miniboss_drop_rule_id) " +
                "values (?, ?, 1, 1, 1, 1, 1000, ?, ?, 1, 2)",
            "$number/1",
            number,
            monster,
            boss,
        )

        val read = repository.findByNumber(number)!!

        assertEquals(EnemyStats(Element.NATURE, 85, 86, 87), read.boss)
        assertEquals(EnemyStats(Element.LIGHT, 88, 89, 90), read.stage(1).monster)
        assertEquals(EnemyStats(Element.NATURE, 85, 86, 87), read.stage(1).miniboss)
        assertEquals(3, read.bossDropRuleId)
        assertEquals(1, read.stage(1).monsterDropRuleId)
        assertEquals(2, read.stage(1).minibossDropRuleId)
    }

    @Test
    fun `saving the five seed chapters reads each back equal to its definition`() {
        (1..5).forEach { repository.save(ChapterDefinition.of(it)) }

        (1..5).forEach { assertEquals(ChapterDefinition.of(it), repository.findByNumber(it)) }
    }

    @Test
    fun `the 50 seeded stages share 5 phase monsters, one per element with no defense and no resistance`() {
        (1..5).forEach { repository.save(ChapterDefinition.of(it)) }

        val monsters =
            jdbc.queryForList(
                "select distinct e.element, e.physical_defense, e.magical_defense, e.crit_resistance " +
                    "from enemies e join stages s on s.monster_enemy_id = e.id where s.chapter between 1 and 5",
            )
        val zeroRows =
            jdbc.queryForList(
                "select element from enemies where physical_defense = 0 and magical_defense = 0 and crit_resistance = 0",
                String::class.java,
            )

        assertEquals(5, monsters.size)
        assertEquals(Element.entries.map { it.name }.toSet(), zeroRows.toSet())
        assertEquals(5, zeroRows.size)
        monsters.forEach {
            assertEquals(0, it["physical_defense"])
            assertEquals(0, it["magical_defense"])
            assertEquals(0, it["crit_resistance"])
        }
    }
}
