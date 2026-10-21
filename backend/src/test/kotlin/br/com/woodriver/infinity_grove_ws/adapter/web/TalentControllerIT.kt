package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaTalentRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.TalentEntity
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

    private fun funded(copper: Long) = jpaWalletRepository.save(WalletEntity("yan", copper))

    private fun copper() = jpaWalletRepository.findById("yan").get().copper

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
    fun `a new player gets the 8 talents at level 0 with a next cost of 300`() {
        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("talents.size()", equalTo(8))
            .body("talents.id", equalTo(listOf("MINIBOSS_TIME", "BOSS_TIME", "PHYSICAL_BREAK", "MAGICAL_BREAK", "CRIT_RESIST_BREAK", "CLICK_DAMAGE", "CRIT_CHANCE", "CRIT_DAMAGE")))
            .body("talents.branch", equalTo(listOf("TIME", "TIME", "BREAK", "BREAK", "BREAK", "POWER", "POWER", "POWER")))
            .body("talents.level", equalTo(List(8) { 0 }))
            .body("talents.value", equalTo(List(8) { 0 }))
            .body("talents.nextCost", equalTo(List(8) { 300 }))
            .body("talents.maxLevel", equalTo(List(8) { 10 }))
            .body("talents[5].label", equalTo("Dano de clique"))
            .body("talents[5].unit", equalTo("%"))
            .body("talents[5].perLevel", equalTo(3))
    }

    @Test
    fun `upgrading from level 0 with 300 copper answers level 1 and takes the copper`() {
        funded(300)

        upgrade("CLICK_DAMAGE", 0)
            .statusCode(200)
            .body("talents[5].level", equalTo(1))
            .body("talents[5].value", equalTo(3))
            .body("talents[5].nextCost", equalTo(480))
            .body("wallet.gold", equalTo(0))
            .body("wallet.silver", equalTo(0))
            .body("wallet.copper", equalTo(0))

        assertEquals(1, level("CLICK_DAMAGE"))
        assertEquals(0L, copper())
    }

    @Test
    fun `the second level costs 480`() {
        funded(1_000)
        upgrade("CLICK_DAMAGE", 0).statusCode(200)

        upgrade("CLICK_DAMAGE", 1).statusCode(200).body("talents[5].level", equalTo(2)).body("talents[5].nextCost", equalTo(768))

        assertEquals(220L, copper())
    }

    @Test
    fun `at level 9 the next cost is 20616`() {
        jpaTalentRepository.save(TalentEntity("yan", "CLICK_DAMAGE", 9))

        asUser().get("/talents").then().statusCode(200).body("talents[5].nextCost", equalTo(20616)).body("talents[5].value", equalTo(27))
    }

    @Test
    fun `a request made for another level than the stored one is 409 TALENT_LEVEL_MISMATCH and changes nothing`() {
        funded(1_000)
        jpaTalentRepository.save(TalentEntity("yan", "CLICK_DAMAGE", 3))

        upgrade("CLICK_DAMAGE", 2).statusCode(409).body("code", equalTo("TALENT_LEVEL_MISMATCH"))

        assertEquals(3, level("CLICK_DAMAGE"))
        assertEquals(1_000L, copper())
    }

    @Test
    fun `a wallet with less copper than the price is 409 NOT_ENOUGH_COPPER and changes nothing`() {
        funded(299)

        upgrade("CLICK_DAMAGE", 0).statusCode(409).body("code", equalTo("NOT_ENOUGH_COPPER"))

        assertEquals(0, level("CLICK_DAMAGE"))
        assertEquals(299L, copper())
    }

    @Test
    fun `a talent at level 10 is 409 TALENT_MAX_LEVEL, takes nothing and has a null next cost`() {
        funded(1_000_000)
        jpaTalentRepository.save(TalentEntity("yan", "CLICK_DAMAGE", 10))

        upgrade("CLICK_DAMAGE", 10).statusCode(409).body("code", equalTo("TALENT_MAX_LEVEL"))
        asUser().get("/talents").then().statusCode(200).body("talents[5].nextCost", nullValue()).body("talents[5].value", equalTo(30))

        assertEquals(1_000_000L, copper())
    }

    @Test
    fun `an unknown talent is 404 TALENT_NOT_FOUND`() {
        funded(1_000)

        upgrade("NOPE", 0).statusCode(404).body("code", equalTo("TALENT_NOT_FOUND"))
    }

    @Test
    fun `a missing, negative, too high or non integer fromLevel is 400 INVALID_TALENT_REQUEST`() {
        funded(1_000)

        listOf(null, -1, 11, "1", 1.5).forEach { sent ->
            upgrade("CLICK_DAMAGE", sent).statusCode(400).body("code", equalTo("INVALID_TALENT_REQUEST"))
        }

        asUser().contentType(ContentType.JSON).body("{}").post("/talents/CLICK_DAMAGE/upgrade").then().statusCode(400).body("code", equalTo("INVALID_TALENT_REQUEST"))
        assertEquals(1_000L, copper())
    }

    @Test
    fun `every talent route needs a token`() {
        given().get("/talents").then().statusCode(401)
        given().contentType(ContentType.JSON).body("""{"fromLevel":0}""").post("/talents/CLICK_DAMAGE/upgrade").then().statusCode(401)
    }

    @Test
    fun `two requests with the same fromLevel on a rich wallet succeed once and answer 409 to the other`() {
        funded(10_000)
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
        assertEquals(9_700L, copper())
    }

    @Test
    fun `the levels of one player do not touch another and go with the player`() {
        users("other")
        jpaTalentRepository.save(TalentEntity("other", "CLICK_DAMAGE", 6))
        funded(300)
        upgrade("CLICK_DAMAGE", 0).statusCode(200)

        assertEquals(6, jpaTalentRepository.findAllByUsername("other").single().level)

        jpaWalletRepository.deleteById("yan")
        jpaUserRepository.deleteById("yan")

        assertEquals(emptyList(), jpaTalentRepository.findAllByUsername("yan"))
        assertEquals(1, jpaTalentRepository.findAllByUsername("other").size)
    }
}
