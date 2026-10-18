package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.PieceEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.WalletEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

class EquipmentRefineIT : IntegrationTestBase() {
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

    private fun piece(
        id: String,
        refine: Int = 0,
        rarity: String = "COMMON",
        username: String = "yan",
    ) = jpaPieceRepository.save(PieceEntity(id, username, "WEAPON", rarity, 3, refine, "CRIT_CHANCE:2", null, 1))

    private fun funded(copper: Long) = jpaWalletRepository.save(WalletEntity("yan", copper))

    private fun copper() = jpaWalletRepository.findById("yan").get().copper

    @Test
    fun `refine with 600 copper levels a common piece to plus 1 and leaves 100 copper`() {
        piece("w1")
        funded(600)

        asUser()
            .post("/equipment/w1/refine")
            .then()
            .statusCode(200)
            .body("equipment.pieces[0].refine", equalTo(1))
            .body("equipment.pieces[0].clickDamage", equalTo(3.3f))
            .body("equipment.pieces[0].refineCost", equalTo(850))
            .body("wallet.gold", equalTo(0))
            .body("wallet.silver", equalTo(1))
            .body("wallet.copper", equalTo(0))

        assertEquals(1, jpaPieceRepository.findById("w1").get().refine)
        assertEquals(100L, copper())
    }

    @Test
    fun `a second refine without the copper is 409 NOT_ENOUGH_COPPER and changes nothing`() {
        piece("w1")
        funded(600)
        asUser().post("/equipment/w1/refine").then().statusCode(200)

        asUser()
            .post("/equipment/w1/refine")
            .then()
            .statusCode(409)
            .body("code", equalTo("NOT_ENOUGH_COPPER"))

        assertEquals(1, jpaPieceRepository.findById("w1").get().refine)
        assertEquals(100L, copper())
    }

    @Test
    fun `a piece at plus 10 is 409 MAX_REFINE and changes nothing`() {
        piece("w1", refine = 10)
        funded(10_000_000)

        asUser()
            .post("/equipment/w1/refine")
            .then()
            .statusCode(409)
            .body("code", equalTo("MAX_REFINE"))

        assertEquals(10_000_000L, copper())
    }

    @Test
    fun `a missing piece and a piece of another account are 404`() {
        funded(10_000)
        piece("theirs", username = "other")

        asUser()
            .post("/equipment/ghost/refine")
            .then()
            .statusCode(404)
            .body("code", equalTo("EQUIPMENT_NOT_FOUND"))
        asUser().post("/equipment/theirs/refine").then().statusCode(404)

        assertEquals(10_000L, copper())
    }

    @Test
    fun `refine without a token is 401`() {
        given().post("/equipment/w1/refine").then().statusCode(401)
    }

    @Test
    fun `two refines at once on a wallet that pays one succeed once and never overdraw`() {
        piece("w1")
        funded(500)
        val pool = Executors.newFixedThreadPool(2)

        val statuses =
            try {
                List(2) { Callable { asUser().post("/equipment/w1/refine").statusCode() } }
                    .map(pool::submit)
                    .map { it.get() }
            } finally {
                pool.shutdown()
            }

        assertEquals(listOf(200, 409), statuses.sorted())
        assertEquals(1, jpaPieceRepository.findById("w1").get().refine)
        assertEquals(0L, copper())
    }
}
