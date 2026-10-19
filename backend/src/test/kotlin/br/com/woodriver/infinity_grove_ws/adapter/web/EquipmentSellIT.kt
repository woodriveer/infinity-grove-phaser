package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.PieceEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.WalletEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

class EquipmentSellIT : IntegrationTestBase() {
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
        username: String = "yan",
        heroId: String? = null,
    ) = jpaPieceRepository.save(PieceEntity(id, username, "WEAPON", "COMMON", 3, 0, "CRIT_CHANCE:2", heroId, 1))

    private fun copper() = jpaWalletRepository.findById("yan").get().copper

    @Test
    fun `selling a common plus 0 piece credits 100 copper and removes it`() {
        piece("w1")
        jpaWalletRepository.save(WalletEntity("yan", 0))

        asUser()
            .post("/equipment/w1/sell")
            .then()
            .statusCode(200)
            .body("equipment.pieces", hasSize<Any>(0))
            .body("wallet.silver", equalTo(1))
            .body("wallet.copper", equalTo(0))

        assertEquals(0, jpaPieceRepository.count())
        assertEquals(100L, copper())
    }

    @Test
    fun `selling a worn piece takes it off the hero and sells it`() {
        piece("w1", heroId = "kael")
        jpaWalletRepository.save(WalletEntity("yan", 5))

        asUser()
            .post("/equipment/w1/sell")
            .then()
            .statusCode(200)
            .body("equipment.pieces", hasSize<Any>(0))

        assertEquals(0, jpaPieceRepository.count())
        assertEquals(105L, copper())
    }

    @Test
    fun `selling with no wallet row yet creates the wallet`() {
        piece("w1")

        asUser().post("/equipment/w1/sell").then().statusCode(200)

        assertEquals(100L, copper())
    }

    @Test
    fun `a missing piece and a piece of another account are 404 and credit nothing`() {
        jpaWalletRepository.save(WalletEntity("yan", 10))
        users("other")
        piece("theirs", username = "other")

        asUser()
            .post("/equipment/ghost/sell")
            .then()
            .statusCode(404)
            .body("code", equalTo("EQUIPMENT_NOT_FOUND"))
        asUser().post("/equipment/theirs/sell").then().statusCode(404)

        assertEquals(10L, copper())
        assertEquals(1, jpaPieceRepository.count())
    }

    @Test
    fun `sell without a token is 401`() {
        given().post("/equipment/w1/sell").then().statusCode(401)
    }
}
