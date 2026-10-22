package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals

/** `V4__monster_health_growth.sql`: a database seeded with the linear health gets the new growth, a tuned value is left alone. */
class MonsterHealthMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    private fun migrate() = jdbc.execute(ClassPathResource("db/migration/V4__monster_health_growth.sql").getContentAsString(Charsets.UTF_8))

    private fun stage(chapter: Int, number: Int) =
        jdbc.queryForMap("select monster_health, miniboss_health from stages where chapter = ? and number = ?", chapter, number)

    private fun boss(chapter: Int) = jdbc.queryForObject("select boss_health from chapters where number = ?", Int::class.java, chapter)

    private fun setOld(chapter: Int, number: Int) =
        jdbc.update(
            "update stages set monster_health = ?, miniboss_health = ? where chapter = ? and number = ?",
            (10 + number - 1) * chapter,
            (10 + number - 1) * chapter * 5,
            chapter,
            number,
        )

    @AfterTest
    fun restore() {
        migrate()
        jdbc.update("update chapters set boss_health = 2000 * power(4, number - 1)::integer")
        jdbc.update("update stages set monster_health = (40 + 4 * (number - 1)) * power(4, chapter - 1)::integer, miniboss_health = (40 + 4 * (number - 1)) * power(4, chapter - 1)::integer * 5")
    }

    @Test
    fun `a new database seeds the grown health`() {
        assertEquals(40, stage(1, 1)["monster_health"])
        assertEquals(76 * 64, stage(4, 10)["monster_health"])
        assertEquals(2000 * 256, boss(5))
    }

    @Test
    fun `a database seeded with the linear health gets the grown one`() {
        setOld(3, 7)
        jdbc.update("update chapters set boss_health = 900 where number = 3")

        migrate()

        assertEquals(64 * 16, stage(3, 7)["monster_health"])
        assertEquals(64 * 16 * 5, stage(3, 7)["miniboss_health"])
        assertEquals(2000 * 16, boss(3))
    }

    @Test
    fun `a health tuned in the database survives`() {
        jdbc.update("update stages set monster_health = 77, miniboss_health = 999 where chapter = 2 and number = 2")
        jdbc.update("update chapters set boss_health = 1234 where number = 2")

        migrate()

        assertEquals(77, stage(2, 2)["monster_health"])
        assertEquals(1234, boss(2))
    }
}
