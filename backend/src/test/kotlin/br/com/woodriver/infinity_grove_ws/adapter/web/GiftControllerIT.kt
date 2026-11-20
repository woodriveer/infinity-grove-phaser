package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.ControllableChanceRoller
import br.com.woodriver.infinity_grove_ws.ControllableGiftCalendar
import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.PieceEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.contains
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.nullValue
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.JdbcTemplate
import java.time.LocalDate
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

class GiftControllerIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

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
        chance.value = 0.5
        giftCalendar.today = LocalDate.of(2026, 11, 20)
    }

    @AfterTest
    fun restoreClock() {
        giftCalendar.today = ControllableGiftCalendar.NOT_GIFT_DAY
        chance.value = ControllableChanceRoller.NO_DROP
    }

    private fun count(sql: String) = jdbc.queryForObject(sql, Int::class.java)

    @Test
    fun `on November 20 the first claim answers the staff and GET equipment lists it`() {
        val pieceId =
            asUser()
                .post("/gifts/claim")
                .then()
                .statusCode(200)
                .body("granted", equalTo(true))
                .body("gift", equalTo("BLACK_AWARENESS_STAFF"))
                .body("piece.slot", equalTo("WEAPON"))
                .body("piece.rarity", equalTo("LEGENDARY"))
                .body("piece.refine", equalTo(0))
                .body("piece.clickDamage", equalTo(11.0f))
                .body("piece.affixes.type", contains("BOSS_DAMAGE_PCT", "BOSS_TIME_SECONDS", "CRIT_DAMAGE_PCT", "ARMOR_PIERCE_PCT"))
                .body("piece.affixes.value", contains(28, 6, 55, 28))
                .body("piece.refineCost", equalTo(4000))
                .body("piece.sellPrice", equalTo(500))
                .body("piece.special", equalTo("BLACK_AWARENESS_STAFF"))
                .body("piece.heroId", nullValue())
                .extract()
                .path<String>("piece.id")

        asUser()
            .get("/equipment")
            .then()
            .statusCode(200)
            .body("pieces", hasSize<Any>(1))
            .body("pieces[0].special", equalTo("BLACK_AWARENESS_STAFF"))
            .body("pieces[0].id", equalTo(pieceId))
    }

    @Test
    fun `a second claim answers granted false without gift or piece`() {
        asUser()
            .post("/gifts/claim")
            .then()
            .statusCode(200)
            .body("granted", equalTo(true))

        asUser()
            .post("/gifts/claim")
            .then()
            .statusCode(200)
            .body("granted", equalTo(false))
            .body("gift", nullValue())
            .body("piece", nullValue())

        asUser().get("/equipment").then().body("pieces", hasSize<Any>(1))
    }

    @Test
    fun `on November 19 the claim answers granted false and stores nothing`() {
        giftCalendar.today = LocalDate.of(2026, 11, 19)

        asUser()
            .post("/gifts/claim")
            .then()
            .statusCode(200)
            .body("granted", equalTo(false))

        asUser().get("/equipment").then().body("pieces", hasSize<Any>(0))
        assertEquals(0, count("select count(*) from player_gifts"))
    }

    @Test
    fun `a full bag receives the staff as the 101st piece`() {
        repeat(100) { i ->
            jpaPieceRepository.save(PieceEntity("r$i", "yan", "RING", "COMMON", null, 0, "CLICK_DAMAGE_PCT:7", null, i.toLong()))
        }

        asUser()
            .post("/gifts/claim")
            .then()
            .statusCode(200)
            .body("granted", equalTo(true))

        asUser()
            .get("/equipment")
            .then()
            .body("pieces", hasSize<Any>(101))
            .body("capacity", equalTo(100))
    }

    @Test
    fun `two claims at once give exactly one staff`() {
        val pool = Executors.newFixedThreadPool(2)

        val granted =
            try {
                List(2) {
                    Callable {
                        asUser()
                            .post("/gifts/claim")
                            .then()
                            .statusCode(200)
                            .extract()
                            .path<Boolean>("granted")
                    }
                }.map(pool::submit)
                    .map { it.get() }
            } finally {
                pool.shutdown()
            }

        assertEquals(listOf(false, true), granted.sorted())
        assertEquals(1, count("select count(*) from equipment_pieces where username = 'yan' and special = 'BLACK_AWARENESS_STAFF'"))
    }

    @Test
    fun `a claim without a token is 401`() {
        given().post("/gifts/claim").then().statusCode(401)

        assertEquals(0, count("select count(*) from player_gifts"))
    }
}
