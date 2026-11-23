package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaTalentRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.ProgressEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.TalentEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.TalentRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.WalletEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.ValidatableResponse
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.nullValue
import org.springframework.beans.factory.annotation.Autowired
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

class TalentControllerIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jpaTalentRepository: JpaTalentRepository

    @Autowired
    private lateinit var talentRepository: TalentRepository

    private lateinit var token: String

    private fun asUser(): RequestSpecification = given().header("Authorization", token)

    @BeforeTest
    fun registerPlayer() {
        token =
            "Bearer " +
            given()
                .contentType(ContentType.JSON)
                .body("""{"username":"yan","password":"password123","startingElement":"FIRE"}""")
                .post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path<String>("accessToken")
    }

    // the race tests need the progress row that the upgrade locks to exist already; the first insert would order the requests by accident
    private fun withProgress() = jpaProgressRepository.save(ProgressEntity("yan", 1, 1, "PHASE", 1, false))

    private fun earned(points: Int) = talentRepository.award("yan", "test:$points", points)

    private fun copper() = jpaWalletRepository.findById("yan").map { it.copper }.orElse(0L)

    private fun level(id: String) = jpaTalentRepository.findAllByUsername("yan").firstOrNull { it.talentId == id }?.level ?: 0

    private fun upgrade(
        id: String,
        fromLevel: Any?,
    ): ValidatableResponse =
        asUser()
            .contentType(ContentType.JSON)
            .body(mapOf("fromLevel" to fromLevel))
            .post("/talents/$id/upgrade")
            .then()

    @Test
    fun `a new player gets the 28 talents at level 0 with a next cost of 1, 2, 3 and 2 points and no points`() {
        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("talents.size()", equalTo(28))
            .body(
                "talents.id.findAll { !it.contains('_G') }",
                equalTo(
                    listOf(
                        "MINIBOSS_TIME",
                        "BOSS_DAMAGE",
                        "PHYSICAL_BREAK",
                        "ARMOR_PIERCE",
                        "CLICK_DAMAGE",
                        "CRIT_CHANCE",
                        "CRIT_DAMAGE",
                        "COMBO",
                        "CLICK_FLAT_DAMAGE",
                        "COMBO_FURY",
                    ),
                ),
            ).body(
                "talents.branch",
                equalTo(
                    List(3) {
                        listOf("TIME", "TIME", "BREAK", "BREAK", "POWER", "POWER", "POWER", "COMBO", "POWER")
                    }.flatten() + "COMBO",
                ),
            ).body("talents.level", equalTo(List(28) { 0 }))
            .body("talents.value", equalTo(List(28) { 0 }))
            .body("talents.nextCost", equalTo(List(9) { 1 } + List(9) { 2 } + List(9) { 3 } + 2))
            .body("talents.maxLevel", equalTo(List(27) { 10 } + 4))
            .body("talents.grade", equalTo(List(9) { 1 } + List(9) { 2 } + List(9) { 3 } + 1))
            .body("talents.unlocked", equalTo(List(9) { true } + List(19) { false }))
            .body("talents[16].id", equalTo("COMBO_G2"))
            .body("talents[16].baseId", equalTo("COMBO"))
            .body("talents[16].perLevel", equalTo(10))
            .body("talents[4].label", equalTo("Dano de clique (%)"))
            .body("talents[4].unit", equalTo("%"))
            .body("talents[4].perLevel", equalTo(5))
            .body("talents[7].label", equalTo("Limite de dano do combo"))
            .body("talents[7].unit", equalTo("%"))
            .body("talents[7].perLevel", equalTo(5))
            .body("talents[8].label", equalTo("Dano direto de clique"))
            .body("talents[8].unit", equalTo("dmg"))
            .body("talents[8].perLevel", equalTo(2))
            .body("points.earned", equalTo(0))
            .body("points.spent", equalTo(0))
            .body("points.available", equalTo(0))
    }

    @Test
    fun `POST reset takes back every level and answers all the earned points as available`() {
        earned(3)
        upgrade("COMBO", 0).statusCode(200)
        upgrade("CLICK_DAMAGE", 0).statusCode(200)

        asUser()
            .post("/talents/reset")
            .then()
            .statusCode(200)
            .body("talents.level", equalTo(List(28) { 0 }))
            .body("points.earned", equalTo(3))
            .body("points.spent", equalTo(0))
            .body("points.available", equalTo(3))

        assertEquals(0, level("COMBO"))
    }

    @Test
    fun `a grade 2 talent is locked at 409 until grade 1 is at level 10, then costs 2 points a level`() {
        earned(30)
        upgrade("COMBO_G2", 0).statusCode(409).body("code", equalTo("TALENT_LOCKED"))
        repeat(10) { n -> upgrade("COMBO", n).statusCode(200) }

        upgrade("COMBO_G2", 0)
            .statusCode(200)
            .body("talents[16].level", equalTo(1))
            .body("talents[16].value", equalTo(10))
            .body("talents[16].unlocked", equalTo(true))
            .body("talents[25].unlocked", equalTo(false))
            .body("points.spent", equalTo(12))
            .body("points.available", equalTo(18))
    }

    @Test
    fun `the defense break is labelled Quebra de defesa in each grade`() {
        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("talents[2].id", equalTo("PHYSICAL_BREAK"))
            .body("talents[2].label", equalTo("Quebra de defesa"))
            .body("talents[11].id", equalTo("PHYSICAL_BREAK_G2"))
            .body("talents[11].label", equalTo("Quebra de defesa"))
            .body("talents[11].perLevel", equalTo(2))
            .body("talents[20].id", equalTo("PHYSICAL_BREAK_G3"))
            .body("talents[20].label", equalTo("Quebra de defesa"))
            .body("talents[20].perLevel", equalTo(3))
    }

    @Test
    fun `a magical break upgrade is 404 TALENT_NOT_FOUND`() {
        earned(5)

        listOf("MAGICAL_BREAK", "MAGICAL_BREAK_G2", "MAGICAL_BREAK_G3").forEach {
            upgrade(it, 0).statusCode(404).body("code", equalTo("TALENT_NOT_FOUND"))
        }
        assertEquals(0, level("MAGICAL_BREAK"))
    }

    @Test
    fun `a stored magical break row is ignored and its points are available`() {
        earned(20)
        talentRepository.save("yan", "PHYSICAL_BREAK", 3)
        talentRepository.save("yan", "MAGICAL_BREAK", 5)

        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("talents.size()", equalTo(28))
            .body("points.earned", equalTo(20))
            .body("points.spent", equalTo(3))
            .body("points.available", equalTo(17))
    }

    @Test
    fun `POST reset deletes a stored magical break row`() {
        earned(3)
        talentRepository.save("yan", "MAGICAL_BREAK", 5)

        asUser()
            .post("/talents/reset")
            .then()
            .statusCode(200)
            .body("points.available", equalTo(3))

        assertEquals(0, level("MAGICAL_BREAK"))
    }

    @Test
    fun `POST reset without a token is refused`() {
        given().post("/talents/reset").then().statusCode(401)
    }

    @Test
    fun `upgrading COMBO from level 0 with 3 points answers level 1 and value 5 and leaves 2 points`() {
        earned(3)

        upgrade("COMBO", 0)
            .statusCode(200)
            .body("talents[7].level", equalTo(1))
            .body("talents[7].value", equalTo(5))
            .body("talents[7].nextCost", equalTo(1))
            .body("points.earned", equalTo(3))
            .body("points.spent", equalTo(1))
            .body("points.available", equalTo(2))
            .body("wallet", nullValue())

        assertEquals(1, level("COMBO"))
    }

    @Test
    fun `an upgrade leaves the wallet untouched`() {
        jpaWalletRepository.save(WalletEntity("yan", 5_000))
        earned(1)

        upgrade("CLICK_DAMAGE", 0).statusCode(200)

        assertEquals(5_000L, copper())
    }

    @Test
    fun `the second level also costs 1 point`() {
        earned(2)
        upgrade("COMBO", 0).statusCode(200)

        upgrade(
            "COMBO",
            1,
        ).statusCode(200).body("talents[7].level", equalTo(2)).body("talents[7].value", equalTo(10)).body("points.available", equalTo(0))
    }

    @Test
    fun `at level 10 the combo talent is worth 50`() {
        jpaTalentRepository.save(TalentEntity("yan", "COMBO", 10))
        earned(10)

        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("talents[7].value", equalTo(50))
            .body("talents[7].nextCost", nullValue())
    }

    @Test
    fun `a request made for another level than the stored one is 409 TALENT_LEVEL_MISMATCH and changes nothing`() {
        earned(10)
        jpaTalentRepository.save(TalentEntity("yan", "CLICK_DAMAGE", 3))

        upgrade("CLICK_DAMAGE", 2).statusCode(409).body("code", equalTo("TALENT_LEVEL_MISMATCH"))

        assertEquals(3, level("CLICK_DAMAGE"))
    }

    @Test
    fun `a player with no available point is 409 NOT_ENOUGH_TALENT_POINTS and changes nothing`() {
        jpaWalletRepository.save(WalletEntity("yan", 1_000_000))

        upgrade("CLICK_DAMAGE", 0).statusCode(409).body("code", equalTo("NOT_ENOUGH_TALENT_POINTS"))

        assertEquals(0, level("CLICK_DAMAGE"))
        assertEquals(1_000_000L, copper())
    }

    @Test
    fun `a talent at level 10 is 409 TALENT_MAX_LEVEL, spends nothing and has a null next cost`() {
        earned(20)
        jpaTalentRepository.save(TalentEntity("yan", "CLICK_DAMAGE", 10))

        upgrade("CLICK_DAMAGE", 10).statusCode(409).body("code", equalTo("TALENT_MAX_LEVEL"))
        asUser()
            .get(
                "/talents",
            ).then()
            .statusCode(
                200,
            ).body("talents[4].nextCost", nullValue())
            .body("talents[4].value", equalTo(50))
            .body("points.available", equalTo(10))
    }

    @Test
    fun `an unknown talent is 404 TALENT_NOT_FOUND`() {
        earned(1)

        upgrade("NOPE", 0).statusCode(404).body("code", equalTo("TALENT_NOT_FOUND"))
    }

    @Test
    fun `a missing, negative, too high or non integer fromLevel is 400 INVALID_TALENT_REQUEST`() {
        earned(5)

        listOf(null, -1, 11, "1", 1.5).forEach { sent ->
            upgrade("CLICK_DAMAGE", sent).statusCode(400).body("code", equalTo("INVALID_TALENT_REQUEST"))
        }

        asUser()
            .contentType(
                ContentType.JSON,
            ).body("{}")
            .post("/talents/CLICK_DAMAGE/upgrade")
            .then()
            .statusCode(400)
            .body("code", equalTo("INVALID_TALENT_REQUEST"))
        asUser().get("/talents").then().body("points.available", equalTo(5))
    }

    @Test
    fun `every talent route needs a token`() {
        given().get("/talents").then().statusCode(401)
        given()
            .contentType(ContentType.JSON)
            .body("""{"fromLevel":0}""")
            .post("/talents/CLICK_DAMAGE/upgrade")
            .then()
            .statusCode(401)
    }

    @Test
    fun `two requests with the same fromLevel succeed once and answer 409 to the other`() {
        withProgress()
        earned(10)
        val pool = Executors.newFixedThreadPool(2)

        val statuses =
            try {
                List(2) { Callable { upgrade("CLICK_DAMAGE", 0).extract().statusCode() } }
                    .map(pool::submit)
                    .map { it.get() }
            } finally {
                pool.shutdown()
            }

        assertEquals(listOf(200, 409), statuses.sorted())
        assertEquals(1, level("CLICK_DAMAGE"))
        asUser().get("/talents").then().body("points.spent", equalTo(1))
    }

    @Test
    fun `two upgrades of different talents with one point accept exactly one`() {
        withProgress()
        earned(1)
        val pool = Executors.newFixedThreadPool(2)

        val statuses =
            try {
                listOf("COMBO", "CLICK_DAMAGE")
                    .map { id -> Callable { upgrade(id, 0).extract().statusCode() } }
                    .map(pool::submit)
                    .map { it.get() }
            } finally {
                pool.shutdown()
            }

        assertEquals(listOf(200, 409), statuses.sorted())
        asUser()
            .get("/talents")
            .then()
            .body("points.spent", equalTo(1))
            .body("points.available", equalTo(0))
    }

    @Test
    fun `the levels and points of one player do not touch another and go with the player`() {
        users("other")
        jpaTalentRepository.save(TalentEntity("other", "CLICK_DAMAGE", 6))
        talentRepository.award("other", "legacy", 6)
        earned(1)
        upgrade("CLICK_DAMAGE", 0).statusCode(200)

        assertEquals(6, jpaTalentRepository.findAllByUsername("other").single().level)
        assertEquals(6, talentRepository.earnedPoints("other"))

        jpaUserRepository.deleteById("yan")

        assertEquals(emptyList(), jpaTalentRepository.findAllByUsername("yan"))
        assertEquals(0, talentRepository.earnedPoints("yan"))
        assertEquals(1, jpaTalentRepository.findAllByUsername("other").size)
    }

    private val grade1Ids =
        listOf(
            "MINIBOSS_TIME",
            "BOSS_DAMAGE",
            "PHYSICAL_BREAK",
            "ARMOR_PIERCE",
            "CLICK_DAMAGE",
            "CRIT_CHANCE",
            "CRIT_DAMAGE",
            "COMBO",
            "CLICK_FLAT_DAMAGE",
        )

    @Test
    fun `every talent answers what opens it`() {
        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("talents.requiredId", equalTo(List(9) { null } + grade1Ids + grade1Ids.map { "${it}_G2" } + "COMBO"))
            .body("talents.requiredLevel", equalTo(List(9) { null } + List(18) { 10 } + 10))
    }

    @Test
    fun `the boss damage, armor pierce and Fúria crescente rows carry their labels and values`() {
        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("talents[1].id", equalTo("BOSS_DAMAGE"))
            .body("talents[1].label", equalTo("Dano contra chefes"))
            .body("talents[1].unit", equalTo("%"))
            .body("talents[1].perLevel", equalTo(2))
            .body("talents[10].perLevel", equalTo(4))
            .body("talents[19].perLevel", equalTo(6))
            .body("talents[3].id", equalTo("ARMOR_PIERCE"))
            .body("talents[3].label", equalTo("Perfuração de armadura"))
            .body("talents[3].perLevel", equalTo(1))
            .body("talents[12].perLevel", equalTo(2))
            .body("talents[21].perLevel", equalTo(3))
            .body("talents[27].id", equalTo("COMBO_FURY"))
            .body("talents[27].label", equalTo("Fúria crescente"))
            .body("talents[27].unit", equalTo("combo-step"))
            .body("talents[27].maxLevel", equalTo(4))
            .body("talents[27].grade", equalTo(1))
            .body("talents[27].baseId", equalTo("COMBO_FURY"))
            .body("talents[27].nextCost", equalTo(2))
            .body("talents[27].unlocked", equalTo(false))
    }

    @Test
    fun `Fúria crescente is locked at 409 until COMBO is at level 10, then costs 2 points a level`() {
        earned(12)
        upgrade("COMBO_FURY", 0).statusCode(409).body("code", equalTo("TALENT_LOCKED"))
        repeat(10) { n -> upgrade("COMBO", n).statusCode(200) }

        upgrade("COMBO_FURY", 0)
            .statusCode(200)
            .body("talents[27].level", equalTo(1))
            .body("talents[27].value", equalTo(1))
            .body("talents[27].nextCost", equalTo(2))
            .body("talents[27].unlocked", equalTo(true))
            .body("points.spent", equalTo(12))
            .body("points.available", equalTo(0))
    }

    @Test
    fun `Fúria crescente at level 4 is 409 TALENT_MAX_LEVEL with a null next cost`() {
        earned(18)
        talentRepository.save("yan", "COMBO", 10)
        talentRepository.save("yan", "COMBO_FURY", 4)

        upgrade("COMBO_FURY", 4).statusCode(409).body("code", equalTo("TALENT_MAX_LEVEL"))
        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("talents[27].nextCost", nullValue())
            .body("points.spent", equalTo(18))

        assertEquals(4, level("COMBO_FURY"))
    }

    @Test
    fun `a fromLevel of 5 or -1 for Fúria crescente is 400 INVALID_TALENT_REQUEST`() {
        earned(5)

        listOf(5, -1).forEach { sent ->
            upgrade("COMBO_FURY", sent)
                .statusCode(400)
                .body("code", equalTo("INVALID_TALENT_REQUEST"))
                .body("detail", equalTo("fromLevel must be an integer between 0 and 4"))
        }
    }

    @Test
    fun `a retired chapter boss time or critical resistance break upgrade is 404 TALENT_NOT_FOUND`() {
        earned(5)

        listOf(
            "BOSS_TIME",
            "BOSS_TIME_G2",
            "BOSS_TIME_G3",
            "CRIT_RESIST_BREAK",
            "CRIT_RESIST_BREAK_G2",
            "CRIT_RESIST_BREAK_G3",
        ).forEach {
            upgrade(it, 0).statusCode(404).body("code", equalTo("TALENT_NOT_FOUND"))
        }
        assertEquals(0, level("BOSS_TIME"))
    }

    @Test
    fun `a stored BOSS_TIME or CRIT_RESIST_BREAK row is ignored and its points are available`() {
        earned(20)
        talentRepository.save("yan", "PHYSICAL_BREAK", 3)
        talentRepository.save("yan", "BOSS_TIME", 5)
        talentRepository.save("yan", "CRIT_RESIST_BREAK_G2", 2)

        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("talents.size()", equalTo(28))
            .body("points.earned", equalTo(20))
            .body("points.spent", equalTo(3))
            .body("points.available", equalTo(17))
    }

    @Test
    fun `POST reset deletes a stored BOSS_TIME row`() {
        earned(3)
        talentRepository.save("yan", "BOSS_TIME", 5)

        asUser()
            .post("/talents/reset")
            .then()
            .statusCode(200)
            .body("points.available", equalTo(3))

        assertEquals(0, level("BOSS_TIME"))
    }
}
