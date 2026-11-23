package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.TalentPoints
import br.com.woodriver.infinity_grove_ws.domain.TalentRules
import br.com.woodriver.infinity_grove_ws.usecase.ListTalentsUseCase
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * `V15__talent_tree_rework.sql` (spec talent-tree-rework): the levels of the chapter boss time and of the critical resistance break are
 * deleted, so their talent points come back, and every other level stays.
 */
class TalentTreeReworkMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    @Autowired
    private lateinit var repository: TalentRepository

    @Autowired
    private lateinit var listTalents: ListTalentsUseCase

    @Autowired
    private lateinit var rules: TalentRules

    private fun migrate() = jdbc.execute(ClassPathResource("db/migration/V15__talent_tree_rework.sql").getContentAsString(Charsets.UTF_8))

    @BeforeTest
    fun players() = users("yan", "other")

    @Test
    fun `every grade of the chapter boss time and the critical resistance break is deleted and the other levels stay`() {
        repository.save("yan", "BOSS_TIME", 10)
        repository.save("yan", "BOSS_TIME_G2", 2)
        repository.save("yan", "BOSS_TIME_G3", 1)
        repository.save("yan", "CRIT_RESIST_BREAK", 4)
        repository.save("yan", "CRIT_RESIST_BREAK_G2", 3)
        repository.save("yan", "CRIT_RESIST_BREAK_G3", 1)
        repository.save("yan", "COMBO", 3)
        repository.save("yan", "MINIBOSS_TIME", 2)
        repository.save("other", "CRIT_RESIST_BREAK", 5)
        repository.save("other", "PHYSICAL_BREAK", 1)

        migrate()

        assertEquals(mapOf("COMBO" to 3, "MINIBOSS_TIME" to 2), repository.findAll("yan"))
        assertEquals(mapOf("PHYSICAL_BREAK" to 1), repository.findAll("other"))
    }

    @Test
    fun `the points of the deleted levels are available again`() {
        repository.award("yan", "test", 30)
        repository.save("yan", "BOSS_TIME", 10)
        repository.save("yan", "BOSS_TIME_G2", 2)
        repository.save("yan", "CRIT_RESIST_BREAK", 4)
        repository.save("yan", "COMBO", 3)

        migrate()

        assertEquals(TalentPoints(30, 3), listTalents.list("yan").points(rules))
        assertEquals(27, listTalents.list("yan").points(rules).available)
    }

    @Test
    fun `a second run deletes nothing and fails on nothing`() {
        repository.save("yan", "BOSS_TIME", 1)
        repository.save("yan", "COMBO", 2)

        migrate()
        migrate()

        assertEquals(mapOf("COMBO" to 2), repository.findAll("yan"))
    }

    @Test
    fun `a player without a retired level keeps every row`() {
        repository.save("other", "PHYSICAL_BREAK", 1)
        repository.save("other", "COMBO", 2)
        repository.save("other", "COMBO_FURY", 1)

        migrate()

        assertEquals(mapOf("PHYSICAL_BREAK" to 1, "COMBO" to 2, "COMBO_FURY" to 1), repository.findAll("other"))
    }
}
