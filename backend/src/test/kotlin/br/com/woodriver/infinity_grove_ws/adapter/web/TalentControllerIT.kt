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
    fun `a new player gets the 10 talents at level 0 with a next cost of 1 point and no points`() {
        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("talents.size()", equalTo(10))
            .body(
                "talents.id",
                equalTo(
                    listOf(
                        "MINIBOSS_TIME",
                        "BOSS_TIME",
                        "PHYSICAL_BREAK",
                        "MAGICAL_BREAK",
                        "CRIT_RESIST_BREAK",
                        "CLICK_DAMAGE",
                        "CRIT_CHANCE",
                        "CRIT_DAMAGE",
                        "COMBO",
                        "CLICK_FLAT_DAMAGE",
                    ),
                ),
            ).body("talents.branch", equalTo(listOf("TIME", "TIME", "BREAK", "BREAK", "BREAK", "POWER", "POWER", "POWER", "COMBO", "POWER")))
            .body("talents.level", equalTo(List(10) { 0 }))
            .body("talents.value", equalTo(List(10) { 0 }))
            .body("talents.nextCost", equalTo(List(10) { 1 }))
            .body("talents.maxLevel", equalTo(List(10) { 10 }))
            .body("talents[5].label", equalTo("Dano de clique (%)"))
            .body("talents[5].unit", equalTo("%"))
            .body("talents[5].perLevel", equalTo(5))
            .body("talents[8].label", equalTo("Limite de dano do combo"))
            .body("talents[8].unit", equalTo("%"))
            .body("talents[8].perLevel", equalTo(5))
            .body("talents[9].label", equalTo("Dano direto de clique"))
            .body("talents[9].unit", equalTo("dmg"))
            .body("talents[9].perLevel", equalTo(2))
            .body("points.earned", equalTo(0))
            .body("points.spent", equalTo(0))
            .body("points.available", equalTo(0))
    }

    @Test
    fun `upgrading COMBO from level 0 with 3 points answers level 1 and value 5 and leaves 2 points`() {
        earned(3)

        upgrade("COMBO", 0)
            .statusCode(200)
            .body("talents[8].level", equalTo(1))
            .body("talents[8].value", equalTo(5))
            .body("talents[8].nextCost", equalTo(1))
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
        ).statusCode(200).body("talents[8].level", equalTo(2)).body("talents[8].value", equalTo(10)).body("points.available", equalTo(0))
    }

    @Test
    fun `at level 10 the combo talent is worth 50`() {
        jpaTalentRepository.save(TalentEntity("yan", "COMBO", 10))
        earned(10)

        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("talents[8].value", equalTo(50))
            .body("talents[8].nextCost", nullValue())
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
            ).body("talents[5].nextCost", nullValue())
            .body("talents[5].value", equalTo(50))
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
}
