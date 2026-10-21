package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals

/** `V2__lyra_leader_bonus.sql`: a database seeded before it gets Lyra's new leader bonus, a tuned value is left alone. */
class LyraLeaderBonusMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    private val seeded = "30% de chance de executar um clique duplo crítico."
    private val old = "Ventos Ligeiros dura 50% mais."

    private fun bonus() = jdbc.queryForObject("select leader_bonus from heroes where id = 'lyra'", String::class.java)

    private fun migrate() = jdbc.execute(ClassPathResource("db/migration/V2__lyra_leader_bonus.sql").getContentAsString(Charsets.UTF_8))

    @AfterTest
    fun restore() {
        jdbc.update("update heroes set leader_bonus = ? where id = 'lyra'", seeded)
    }

    @Test
    fun `a new database seeds the double critical click`() {
        assertEquals(seeded, bonus())
    }

    @Test
    fun `a database seeded with the old text gets the new one`() {
        jdbc.update("update heroes set leader_bonus = ? where id = 'lyra'", old)

        migrate()

        assertEquals(seeded, bonus())
    }

    @Test
    fun `a bonus tuned in the database survives`() {
        jdbc.update("update heroes set leader_bonus = 'Tuned' where id = 'lyra'")

        migrate()

        assertEquals("Tuned", bonus())
    }

    @Test
    fun `the other heroes keep their bonus`() {
        val before = jdbc.queryForList("select leader_bonus from heroes where id <> 'lyra' order by id", String::class.java)

        migrate()

        assertEquals(before, jdbc.queryForList("select leader_bonus from heroes where id <> 'lyra' order by id", String::class.java))
    }
}
