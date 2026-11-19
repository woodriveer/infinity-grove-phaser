package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

/**
 * `V13__miniboss_adds.sql` (spec miniboss-adds): the stored stages of chapters 11 to 15 get two adds of 3 times the phase monster health, the
 * table refuses values outside its bounds, and the file can run again.
 */
class StageAddsMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    private fun migrate() = jdbc.execute(ClassPathResource("db/migration/V13__miniboss_adds.sql").getContentAsString(Charsets.UTF_8))

    private fun count(sql: String = "select count(*) from stage_adds") = jdbc.queryForObject(sql, Int::class.java)

    private fun insert(
        id: String,
        stageId: String,
        slot: Int,
        hitPoints: Long = 10,
        defenseBuff: Int = 30,
    ) = jdbc.update(
        "insert into stage_adds (id, stage_id, slot, hit_points, defense_buff) values (?, ?, ?, ?, ?)",
        id,
        stageId,
        slot,
        hitPoints,
        defenseBuff,
    )

    private fun row(id: String) = jdbc.queryForMap("select stage_id, slot, hit_points, defense_buff from stage_adds where id = ?", id)

    // the test database is shared: every test leaves the 100 seeded rows back
    @AfterTest
    fun restore() {
        jdbc.update("delete from stage_adds")
        jdbc.update("update stages set monster_hit_points = 1572864 where id = '12/3'")
        migrate()
    }

    @Test
    fun `the migration gives every stored stage of chapters 11 to 15 two adds with 3 times its phase monster health`() {
        jdbc.update("delete from stage_adds")

        migrate()

        assertEquals(100, count())
        val first = row("11/1/1")
        assertEquals("11/1", first["stage_id"])
        assertEquals(1, first["slot"])
        assertEquals(1_966_080L, first["hit_points"])
        assertEquals(30, first["defense_buff"])
        val last = row("15/10/2")
        assertEquals(59_768_832L, last["hit_points"])
        assertEquals(50, last["defense_buff"])
        assertEquals(40, row("13/5/1")["defense_buff"])
    }

    @Test
    fun `the migration gives no add to chapters 1 to 10`() {
        jdbc.update("delete from stage_adds")

        migrate()

        assertEquals(0, count("select count(*) from stage_adds a join stages s on s.id = a.stage_id where s.chapter <= 10"))
    }

    @Test
    fun `the migration uses the phase monster health the stage holds now`() {
        jdbc.update("delete from stage_adds")
        jdbc.update("update stages set monster_hit_points = 1000 where id = '12/3'")

        migrate()

        val add = row("12/3/1")
        assertEquals(3_000L, add["hit_points"])
        assertEquals(35, add["defense_buff"])
    }

    @Test
    fun `running the migration twice keeps 100 rows and a buff tuned in the database`() {
        jdbc.update("update stage_adds set defense_buff = 10 where id = '11/1/1'")

        migrate()
        migrate()

        assertEquals(100, count())
        assertEquals(10, row("11/1/1")["defense_buff"])
    }

    @Test
    fun `an add slot of 0 or 3 is refused and 1 and 2 are accepted`() {
        assertFailsWith<DataIntegrityViolationException> { insert("t/0", "1/1", 0) }
        assertFailsWith<DataIntegrityViolationException> { insert("t/3", "1/1", 3) }

        assertEquals(1, insert("t/1", "1/1", 1))
        assertEquals(1, insert("t/2", "1/1", 2))
    }

    @Test
    fun `an add of 0 hit points is refused and 1 is accepted`() {
        assertFailsWith<DataIntegrityViolationException> { insert("t/1", "1/2", 1, hitPoints = 0) }

        assertEquals(1, insert("t/2", "1/2", 2, hitPoints = 1))
    }

    @Test
    fun `an add buff of -1 or 91 is refused and 0 and 90 are accepted`() {
        assertFailsWith<DataIntegrityViolationException> { insert("t/1", "1/3", 1, defenseBuff = -1) }
        assertFailsWith<DataIntegrityViolationException> { insert("t/2", "1/3", 2, defenseBuff = 91) }

        assertEquals(1, insert("t/3", "1/4", 1, defenseBuff = 0))
        assertEquals(1, insert("t/4", "1/4", 2, defenseBuff = 90))
    }

    @Test
    fun `an add of a stage that does not exist is refused`() {
        assertFailsWith<DataIntegrityViolationException> { insert("t/1", "99/1", 1) }
    }

    @Test
    fun `a second add in the same slot of a stage is refused`() {
        assertFailsWith<DataIntegrityViolationException> { insert("x/1", "11/1", 1) }
    }

    @Test
    fun `a stage with adds cannot be deleted`() {
        assertFailsWith<DataIntegrityViolationException> { jdbc.update("delete from stages where id = '11/1'") }

        assertEquals(1, count("select count(*) from stage_adds where id = '11/1/1'"))
    }
}
