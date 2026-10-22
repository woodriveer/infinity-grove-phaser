package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.PieceEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.WalletEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

class EquipmentRerollIT : IntegrationTestBase() {
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
        id: String = "w1",
        refine: Int = 5,
    ) = jpaPieceRepository.save(PieceEntity(id, "yan", "WEAPON", "UNCOMMON", 3, refine, "CRIT_CHANCE:2,BOSS_DAMAGE_PCT:6", null, 1))

    private fun funded(copper: Long) = jpaWalletRepository.save(WalletEntity("yan", copper))

    private fun copper() = jpaWalletRepository.findById("yan").get().copper

    private fun reroll(
        id: String,
        body: String,
    ) = asUser().contentType(ContentType.JSON).body(body).post("/equipment/$id/reroll")

    @Test
    fun `a plus 5 piece rerolls affix 0 to another type, keeps affix 1 and the level, and costs 5000`() {
        piece()
        funded(6_000)
        chance.value = 0.0

        reroll("w1", """{"affix":0}""")
            .then()
            .statusCode(200)
            .body("equipment.pieces[0].refine", equalTo(5))
            .body("equipment.pieces[0].affixes[0].type", equalTo("CRIT_DAMAGE_PCT"))
            .body("equipment.pieces[0].affixes[1].type", equalTo("BOSS_DAMAGE_PCT"))
            .body("equipment.pieces[0].affixes[1].value", equalTo(9))
            .body("wallet.copper", equalTo(0))
            .body("wallet.silver", equalTo(10))

        assertEquals("CRIT_DAMAGE_PCT:20,BOSS_DAMAGE_PCT:6", jpaPieceRepository.findById("w1").get().affixes)
        assertEquals(1_000L, copper())
    }

    @Test
    fun `below plus 5 is 409 REFINE_TOO_LOW and changes nothing`() {
        piece(refine = 4)
        funded(6_000)

        reroll("w1", """{"affix":0}""").then().statusCode(409).body("code", equalTo("REFINE_TOO_LOW"))

        assertEquals("CRIT_CHANCE:2,BOSS_DAMAGE_PCT:6", jpaPieceRepository.findById("w1").get().affixes)
        assertEquals(6_000L, copper())
    }

    @Test
    fun `under 5000 copper is 409 NOT_ENOUGH_COPPER and changes nothing`() {
        piece()
        funded(4_999)

        reroll("w1", """{"affix":0}""").then().statusCode(409).body("code", equalTo("NOT_ENOUGH_COPPER"))

        assertEquals("CRIT_CHANCE:2,BOSS_DAMAGE_PCT:6", jpaPieceRepository.findById("w1").get().affixes)
        assertEquals(4_999L, copper())
    }

    @Test
    fun `an affix index outside the piece is 400 INVALID_AFFIX and changes nothing`() {
        piece()
        funded(6_000)

        reroll("w1", """{"affix":2}""").then().statusCode(400).body("code", equalTo("INVALID_AFFIX"))
        reroll("w1", """{"affix":-1}""").then().statusCode(400).body("code", equalTo("INVALID_AFFIX"))

        assertEquals(6_000L, copper())
    }

    @Test
    fun `a missing affix or a non integer affix is 400 and a missing piece is 404`() {
        piece()
        funded(6_000)

        reroll("w1", """{}""").then().statusCode(400)
        reroll("w1", """{"affix":"0"}""").then().statusCode(400)
        reroll("ghost", """{"affix":0}""").then().statusCode(404).body("code", equalTo("EQUIPMENT_NOT_FOUND"))
        assertEquals(6_000L, copper())
    }

    @Test
    fun `reroll without a token is 401`() {
        given()
            .contentType(ContentType.JSON)
            .body("""{"affix":0}""")
            .post("/equipment/w1/reroll")
            .then()
            .statusCode(401)
    }
}
