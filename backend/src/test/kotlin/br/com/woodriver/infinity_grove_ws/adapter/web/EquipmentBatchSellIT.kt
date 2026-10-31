package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.PieceEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.WalletEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

class EquipmentBatchSellIT : IntegrationTestBase() {
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
        rarity: String = "COMMON",
        refine: Int = 0,
        heroId: String? = null,
        username: String = "yan",
    ) = jpaPieceRepository.save(PieceEntity(id, username, "WEAPON", rarity, 3, refine, "CRIT_CHANCE:2", heroId, 1))

    private fun copper() = jpaWalletRepository.findById("yan").get().copper

    private fun sell(body: String) = asUser().contentType(ContentType.JSON).body(body).post("/equipment/sell")

    @Test
    fun `selling three pieces at once credits the sum and removes them`() {
        piece("c")
        piece("r", "RARE", 4)
        piece("u", "UNCOMMON")
        piece("keep")
        jpaWalletRepository.save(WalletEntity("yan", 50))

        sell("""{"pieceIds":["c","r","u"]}""")
            .then()
            .statusCode(200)
            .body("sold", equalTo(3))
            .body("earned", equalTo(1200))
            .body("wallet.gold", equalTo(0))
            .body("wallet.silver", equalTo(12))
            .body("wallet.copper", equalTo(50))
            .body("equipment.pieces", hasSize<Any>(1))
            .body("equipment.pieces[0].id", equalTo("keep"))
            .body("equipment.capacity", equalTo(100))

        assertEquals(1L, jpaPieceRepository.count())
        assertEquals(1250L, copper())
    }

    @Test
    fun `a worn piece in the batch is taken off its hero and sold`() {
        piece("w", heroId = "kael")
        jpaWalletRepository.save(WalletEntity("yan", 0))

        sell("""{"pieceIds":["w"]}""")
            .then()
            .statusCode(200)
            .body("sold", equalTo(1))
            .body("earned", equalTo(100))
            .body("equipment.pieces", hasSize<Any>(0))

        assertEquals(0L, jpaPieceRepository.count())
        assertEquals(100L, copper())
    }

    @Test
    fun `one unknown id or one id of another account makes the batch 404 and sells nothing`() {
        users("other")
        piece("a")
        piece("theirs", username = "other")
        jpaWalletRepository.save(WalletEntity("yan", 10))

        sell("""{"pieceIds":["a","theirs"]}""")
            .then()
            .statusCode(404)
            .body("code", equalTo("EQUIPMENT_NOT_FOUND"))
        sell("""{"pieceIds":["a","ghost"]}""").then().statusCode(404)

        assertEquals(2L, jpaPieceRepository.count())
        assertEquals(10L, copper())
    }

    @Test
    fun `an empty batch, a repeated id and 101 ids are 400 INVALID_SELL_BATCH and change nothing`() {
        piece("a")
        jpaWalletRepository.save(WalletEntity("yan", 10))
        val hundredAndOne = (1..101).joinToString(",") { "\"p$it\"" }

        listOf("""{"pieceIds":[]}""", """{"pieceIds":["a","a"]}""", """{"pieceIds":[$hundredAndOne]}""").forEach { body ->
            sell(body).then().statusCode(400).body("code", equalTo("INVALID_SELL_BATCH"))
        }

        assertEquals(1L, jpaPieceRepository.count())
        assertEquals(10L, copper())
    }

    @Test
    fun `a body without a list of string ids is 400`() {
        piece("a")
        jpaWalletRepository.save(WalletEntity("yan", 10))

        listOf("{}", """{"pieceIds":"a"}""", """{"pieceIds":[1,2]}""").forEach { body ->
            sell(body).then().statusCode(400)
        }

        assertEquals(1L, jpaPieceRepository.count())
        assertEquals(10L, copper())
    }

    @Test
    fun `batch sell without a token is 401`() {
        given()
            .contentType(ContentType.JSON)
            .body("""{"pieceIds":["a"]}""")
            .post("/equipment/sell")
            .then()
            .statusCode(401)
    }

    @Test
    fun `two identical batches at once pay once`() {
        piece("a")
        piece("b")
        jpaWalletRepository.save(WalletEntity("yan", 0))
        val pool = Executors.newFixedThreadPool(2)

        val statuses =
            try {
                List(2) { Callable { sell("""{"pieceIds":["a","b"]}""").statusCode() } }
                    .map(pool::submit)
                    .map { it.get() }
            } finally {
                pool.shutdown()
            }

        assertEquals(listOf(200, 404), statuses.sorted())
        assertEquals(200L, copper())
        assertEquals(0L, jpaPieceRepository.count())
    }

    @Test
    fun `the single sale still answers on its own path`() {
        piece("a")
        jpaWalletRepository.save(WalletEntity("yan", 0))

        asUser()
            .post("/equipment/a/sell")
            .then()
            .statusCode(200)
            .body("wallet.silver", equalTo(1))

        assertEquals(100L, copper())
    }
}
