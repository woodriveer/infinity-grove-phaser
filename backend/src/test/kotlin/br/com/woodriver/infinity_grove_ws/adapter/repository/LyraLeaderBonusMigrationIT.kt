package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

/** `V2__lyra_leader_bonus.sql`: a database seeded before it gets Lyra's new leader bonus, a tuned value is left alone. */
class LyraLeaderBonusMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    private val seeded = "30% de chance de executar um clique duplo crítico."
    private val old = "Ventos Ligeiros dura 50% mais."
    private lateinit var kaelSeeded: String

    private fun bonusOf(id: String) = jdbc.queryForObject("select leader_bonus from heroes where id = ?", String::class.java, id)

    private fun setBonus(
        id: String,
        text: String,
    ) = jdbc.update("update heroes set leader_bonus = ? where id = ?", text, id)

    private fun migrate() = jdbc.execute(ClassPathResource("db/migration/V2__lyra_leader_bonus.sql").getContentAsString(Charsets.UTF_8))

    @BeforeTest
    fun remember() {
        kaelSeeded = bonusOf("kael")!!
    }

    @AfterTest
    fun restore() {
        setBonus("lyra", seeded)
        setBonus("kael", kaelSeeded)
    }

    @Test
    fun `a new database seeds the double critical click`() {
        assertEquals(seeded, bonusOf("lyra"))
    }

    @Test
    fun `a database seeded with the old text gets the new one`() {
        setBonus("lyra", old)

        migrate()

        assertEquals(seeded, bonusOf("lyra"))
    }

    @Test
    fun `a bonus tuned in the database survives`() {
        setBonus("lyra", "Tuned")

        migrate()

        assertEquals("Tuned", bonusOf("lyra"))
    }

    @Test
    fun `another hero that holds the old text keeps it`() {
        setBonus("kael", old)

        migrate()

        assertEquals(old, bonusOf("kael"))
    }

    @Test
    fun `the other heroes keep their bonus`() {
        val before = jdbc.queryForList("select leader_bonus from heroes where id <> 'lyra' order by id", String::class.java)

        migrate()

        assertEquals(before, jdbc.queryForList("select leader_bonus from heroes where id <> 'lyra' order by id", String::class.java))
    }
}
