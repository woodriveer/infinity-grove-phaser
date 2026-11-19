package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.TalentPoints
import br.com.woodriver.infinity_grove_ws.domain.TalentRules
import br.com.woodriver.infinity_grove_ws.usecase.ListTalentsUseCase
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * `V11__unified_damage.sql` (spec unified-damage): the levels of the magical defense break are deleted, and the hero texts that named a
 * damage type become the new ones only where the old seeded text is still there.
 */
class UnifiedDamageMigrationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    @Autowired
    private lateinit var repository: TalentRepository

    @Autowired
    private lateinit var listTalents: ListTalentsUseCase

    @Autowired
    private lateinit var rules: TalentRules

    /** One stored hero text: [slot] is null for the leader bonus of the hero, the skill slot otherwise. */
    private data class TextRow(
        val heroId: String,
        val slot: Int?,
        val old: String,
        val new: String,
    )

    private val texts =
        listOf(
            TextRow("orina", null, "+20% de Poder Arcano para todo o grupo.", "+20% de dano total."),
            TextRow(
                "kael",
                1,
                "Um golpe que rasga o próprio espaço, causando 1500% de dano físico a todos os inimigos e ignorando 30% da resistência física.",
                "Um golpe que rasga o próprio espaço, causando 1500% de dano a todos os inimigos e ignorando 30% da defesa.",
            ),
            TextRow(
                "kael",
                3,
                "Um grito de guerra que causa Medo: inimigos perdem 30% de resistência física por 10s.",
                "Um grito de guerra que causa Medo: inimigos perdem 30 pontos de defesa por 10s.",
            ),
            TextRow(
                "lyra",
                1,
                "Dispara duas flechas, cada uma causando 300% de dano físico.",
                "Dispara duas flechas, cada uma causando 300% de dano.",
            ),
            TextRow(
                "orina",
                1,
                "Vinhas mágicas prendem os inimigos por 2s; enquanto presos, recebem +25% de dano mágico.",
                "Vinhas de espinhos prendem os inimigos por 2s; enquanto presos, recebem +25% de dano.",
            ),
            TextRow(
                "orina",
                2,
                "Raios caem por 6s, causando 200% de dano mágico por segundo a todos os inimigos.",
                "Raios caem por 6s, causando 200% de dano por segundo a todos os inimigos.",
            ),
            TextRow(
                "orina",
                3,
                "Uma chuva de estrelas causa 2500% de dano mágico em área.",
                "Uma chuva de estrelas causa 2500% de dano em área.",
            ),
            TextRow(
                "seraphine",
                1,
                "Por 15s, todos os aliados ganham +20% de Precisão, +30% de Força e +25% de velocidade de ataque.",
                "Por 15s, todos os aliados ganham +20% de Precisão, +30% de dano e +25% de velocidade de ataque.",
            ),
            TextRow(
                "seraphine",
                2,
                "Um pilar de luz atinge todos os inimigos, causando 800% de dano mágico (+50% contra criaturas do Submundo).",
                "Um pilar de luz atinge todos os inimigos, causando 800% de dano (+50% contra criaturas do Submundo).",
            ),
        )

    private fun migrate() = jdbc.execute(ClassPathResource("db/migration/V11__unified_damage.sql").getContentAsString(Charsets.UTF_8))

    private fun write(
        row: TextRow,
        text: String,
    ) {
        if (row.slot == null) {
            jdbc.update("update heroes set leader_bonus = ? where id = ?", text, row.heroId)
        } else {
            jdbc.update("update hero_skills set effect = ? where hero_id = ? and slot = ?", text, row.heroId, row.slot)
        }
    }

    private fun read(row: TextRow): String? =
        if (row.slot == null) {
            jdbc.queryForObject("select leader_bonus from heroes where id = ?", String::class.java, row.heroId)
        } else {
            jdbc.queryForObject("select effect from hero_skills where hero_id = ? and slot = ?", String::class.java, row.heroId, row.slot)
        }

    @BeforeTest
    fun players() = users("yan", "other", "plain")

    @AfterTest
    fun restoreTexts() = texts.forEach { write(it, it.new) }

    @Test
    fun `every grade of the magical break is deleted and the other levels stay`() {
        repository.save("yan", "MAGICAL_BREAK", 10)
        repository.save("yan", "MAGICAL_BREAK_G2", 3)
        repository.save("yan", "MAGICAL_BREAK_G3", 1)
        repository.save("yan", "PHYSICAL_BREAK", 3)
        repository.save("other", "MAGICAL_BREAK", 4)
        repository.save("other", "COMBO", 2)

        migrate()

        assertEquals(mapOf("PHYSICAL_BREAK" to 3), repository.findAll("yan"))
        assertEquals(mapOf("COMBO" to 2), repository.findAll("other"))
    }

    @Test
    fun `the points of the deleted levels are available again`() {
        repository.award("yan", "test", 20)
        repository.save("yan", "PHYSICAL_BREAK", 3)
        repository.save("yan", "MAGICAL_BREAK", 5)

        migrate()

        assertEquals(TalentPoints(20, 3), listTalents.list("yan").points(rules))
        assertEquals(17, listTalents.list("yan").points(rules).available)
    }

    @Test
    fun `10 levels of grade 1 and 3 of grade 2 give 16 points back`() {
        repository.award("yan", "test", 20)
        repository.save("yan", "MAGICAL_BREAK", 10)
        repository.save("yan", "MAGICAL_BREAK_G2", 3)

        migrate()

        val awardedSql = "select coalesce(sum(points), 0) from talent_point_awards where username = 'yan'"
        val awarded = jdbc.queryForObject(awardedSql, Int::class.java)
        assertEquals(20, awarded)
        assertEquals(emptyMap(), repository.findAll("yan"))
        assertEquals(20, listTalents.list("yan").points(rules).available)
    }

    @Test
    fun `a player who never bought the magical break keeps their levels and points`() {
        repository.award("plain", "test", 6)
        repository.save("plain", "CLICK_DAMAGE", 4)

        migrate()

        assertEquals(mapOf("CLICK_DAMAGE" to 4), repository.findAll("plain"))
        assertEquals(TalentPoints(6, 4), listTalents.list("plain").points(rules))
    }

    @Test
    fun `talent point awards and wallets are untouched`() {
        repository.award("yan", "test", 7)
        repository.award("other", "test", 3)
        repository.save("yan", "MAGICAL_BREAK", 2)
        jdbc.update("insert into wallets (username, copper) values ('yan', 1234)")
        val awardsSql = "select username, award_key, points from talent_point_awards order by username, award_key"
        val walletsSql = "select username, copper from wallets order by username"
        val awardsBefore = jdbc.queryForList(awardsSql)
        val walletsBefore = jdbc.queryForList(walletsSql)

        migrate()

        assertEquals(awardsBefore, jdbc.queryForList(awardsSql))
        assertEquals(walletsBefore, jdbc.queryForList(walletsSql))
    }

    @Test
    fun `a database seeded with the old texts gets the new ones`() {
        texts.forEach { write(it, it.old) }

        migrate()

        assertEquals(texts.map { it.new }, texts.map(::read))
    }

    @Test
    fun `a text tuned in the database survives`() {
        write(texts.first { it.heroId == "orina" && it.slot == null }, "Tuned")
        write(texts.first { it.heroId == "kael" && it.slot == 1 }, "Tuned")

        migrate()

        assertEquals("Tuned", read(texts.first { it.heroId == "orina" && it.slot == null }))
        assertEquals("Tuned", read(texts.first { it.heroId == "kael" && it.slot == 1 }))
    }

    @Test
    fun `every one of the nine texts tuned in the database survives`() {
        texts.forEachIndexed { index, row -> write(row, "Tuned $index") }

        migrate()

        assertEquals(texts.indices.map { "Tuned $it" }, texts.map(::read))
    }

    @Test
    fun `a text equal to the new one is left as it is`() {
        texts.forEach { write(it, it.new) }

        migrate()

        assertEquals(texts.map { it.new }, texts.map(::read))
    }

    @Test
    fun `a new database seeds the new texts`() {
        assertEquals("+20% de dano total.", jdbc.queryForObject("select leader_bonus from heroes where id = 'orina'", String::class.java))
        assertEquals(
            "Vinhas de espinhos prendem os inimigos por 2s; enquanto presos, recebem +25% de dano.",
            jdbc.queryForObject("select effect from hero_skills where hero_id = 'orina' and slot = 1", String::class.java),
        )
    }

    @Test
    fun `running the migration twice gives the same result`() {
        texts.forEach { write(it, it.old) }
        repository.save("yan", "MAGICAL_BREAK", 2)

        migrate()
        migrate()

        assertEquals(texts.map { it.new }, texts.map(::read))
        assertEquals(emptyMap(), repository.findAll("yan"))
    }
}
