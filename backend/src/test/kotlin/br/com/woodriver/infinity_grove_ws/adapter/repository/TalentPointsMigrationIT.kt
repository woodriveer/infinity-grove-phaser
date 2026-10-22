package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

/** `V5__talent_point_awards.sql`: a player who already owns talent levels gets as many points as the levels cost. */
class TalentPointsMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    @Autowired
    private lateinit var repository: TalentRepository

    // the table is created by Flyway when the context starts; only the grant of the legacy awards is run again
    private fun grantLegacy() {
        val sql = ClassPathResource("db/migration/V5__talent_point_awards.sql").getContentAsString(Charsets.UTF_8)
        jdbc.execute(sql.substring(sql.indexOf("insert into talent_point_awards")))
    }

    @BeforeTest
    fun players() = users("yan", "other", "fresh")

    @Test
    fun `a player whose levels sum to 7 gets 7 earned points and none available`() {
        repository.save("yan", "CLICK_DAMAGE", 3)
        repository.save("yan", "CRIT_CHANCE", 4)

        grantLegacy()

        assertEquals(7, repository.earnedPoints("yan"))
        assertEquals(
            7,
            jdbc.queryForObject("select points from talent_point_awards where username = 'yan' and award_key = 'legacy'", Int::class.java),
        )
    }

    @Test
    fun `each player gets only the points of their own levels and a player with none gets no row`() {
        repository.save("yan", "CLICK_DAMAGE", 2)
        repository.save("other", "BOSS_TIME", 5)

        grantLegacy()

        assertEquals(2, repository.earnedPoints("yan"))
        assertEquals(5, repository.earnedPoints("other"))
        assertEquals(0, jdbc.queryForObject("select count(*) from talent_point_awards where username = 'fresh'", Int::class.java))
    }
}
