package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.AutoClickRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.CrystalRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.ProgressEntity
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

class AutoClickControllerIT : IntegrationTestBase() {
    @Autowired
    private lateinit var autoClickRepository: AutoClickRepository

    @Autowired
    private lateinit var crystalRepository: CrystalRepository

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

    private fun atChapter(chapter: Int) = jpaProgressRepository.save(ProgressEntity("yan", chapter, 1, "PHASE", 1, false))

    private fun crystals(amount: Long) = crystalRepository.save("yan", amount)

    private fun level() = autoClickRepository.level("yan")

    private fun balance() = crystalRepository.balance("yan")

    private fun upgrade(fromLevel: Any?): ValidatableResponse =
        asUser()
            .contentType(ContentType.JSON)
            .body(mapOf("fromLevel" to fromLevel))
            .post("/auto-click/upgrade")
            .then()

    @Test
    fun `a new player gets level 0 at 500 ms with 0 crystals and the 250 ms upgrade for 10 crystals`() {
        asUser()
            .get("/auto-click")
            .then()
            .statusCode(200)
            .body("level", equalTo(0))
            .body("maxLevel", equalTo(4))
            .body("intervalMs", equalTo(500))
            .body("crystals", equalTo(0))
            .body("next.level", equalTo(1))
            .body("next.intervalMs", equalTo(250))
            .body("next.price", equalTo(10))
    }

    @Test
    fun `GET answers the stored level and crystals`() {
        autoClickRepository.save("yan", 3)
        crystals(42)

        asUser()
            .get("/auto-click")
            .then()
            .statusCode(200)
            .body("level", equalTo(3))
            .body("intervalMs", equalTo(100))
            .body("crystals", equalTo(42))
            .body("next.level", equalTo(4))
            .body("next.intervalMs", equalTo(50))
            .body("next.price", equalTo(100))
    }

    @Test
    fun `upgrading from level 0 in chapter 2 with 10 crystals answers level 1 at 250 ms, 0 crystals and the 150 ms upgrade for 25`() {
        atChapter(2)
        crystals(10)

        upgrade(0)
            .statusCode(200)
            .body("level", equalTo(1))
            .body("intervalMs", equalTo(250))
            .body("crystals", equalTo(0))
            .body("next.level", equalTo(2))
            .body("next.intervalMs", equalTo(150))
            .body("next.price", equalTo(25))

        assertEquals(1, level())
        assertEquals(0L, balance())
    }

    @Test
    fun `upgrading to level 4 answers 50 ms and no next upgrade`() {
        atChapter(3)
        autoClickRepository.save("yan", 3)
        crystals(150)

        upgrade(3)
            .statusCode(200)
            .body("level", equalTo(4))
            .body("intervalMs", equalTo(50))
            .body("crystals", equalTo(50))
            .body("next", nullValue())
    }

    @Test
    fun `fewer crystals than the price answer 409 NOT_ENOUGH_CRYSTALS and change nothing`() {
        atChapter(2)
        crystals(9)

        upgrade(0).statusCode(409).body("code", equalTo("NOT_ENOUGH_CRYSTALS"))

        assertEquals(0, level())
        assertEquals(9L, balance())
    }

    @Test
    fun `level 4 answers 409 AUTO_CLICK_MAX_LEVEL and changes nothing`() {
        atChapter(2)
        autoClickRepository.save("yan", 4)
        crystals(1000)

        upgrade(4).statusCode(409).body("code", equalTo("AUTO_CLICK_MAX_LEVEL"))

        assertEquals(4, level())
        assertEquals(1000L, balance())
    }

    @Test
    fun `a player in chapter 1 answers 409 AUTO_CLICK_LOCKED and changes nothing`() {
        atChapter(1)
        crystals(1000)

        upgrade(0).statusCode(409).body("code", equalTo("AUTO_CLICK_LOCKED"))

        assertEquals(0, level())
        assertEquals(1000L, balance())
    }

    @Test
    fun `a stale fromLevel answers 409 AUTO_CLICK_LEVEL_MISMATCH with the stored state and changes nothing`() {
        atChapter(2)
        autoClickRepository.save("yan", 2)
        crystals(1000)

        upgrade(1)
            .statusCode(409)
            .body("code", equalTo("AUTO_CLICK_LEVEL_MISMATCH"))
            .body("autoClick.level", equalTo(2))
            .body("autoClick.intervalMs", equalTo(150))
            .body("autoClick.crystals", equalTo(1000))
            .body("autoClick.next.price", equalTo(50))

        assertEquals(2, level())
        assertEquals(1000L, balance())
    }

    @Test
    fun `a missing, negative or non-integer fromLevel answers 400 INVALID_AUTO_CLICK_REQUEST`() {
        atChapter(2)
        crystals(100)

        upgrade(null).statusCode(400).body("code", equalTo("INVALID_AUTO_CLICK_REQUEST"))
        upgrade(-1).statusCode(400).body("code", equalTo("INVALID_AUTO_CLICK_REQUEST"))
        upgrade("one").statusCode(400).body("code", equalTo("INVALID_AUTO_CLICK_REQUEST"))

        assertEquals(0, level())
        assertEquals(100L, balance())
    }

    @Test
    fun `every auto click route needs a token`() {
        given().get("/auto-click").then().statusCode(401)
        given()
            .contentType(ContentType.JSON)
            .body("""{"fromLevel":0}""")
            .post("/auto-click/upgrade")
            .then()
            .statusCode(401)
    }

    @Test
    fun `two upgrades from the same level apply exactly one`() {
        atChapter(2)
        crystals(1000)
        val pool = Executors.newFixedThreadPool(2)

        val statuses =
            try {
                List(2) { Callable { upgrade(0).extract().statusCode() } }
                    .map(pool::submit)
                    .map { it.get() }
            } finally {
                pool.shutdown()
            }

        assertEquals(listOf(200, 409), statuses.sorted())
        assertEquals(1, level())
        assertEquals(990L, balance())
    }
}
