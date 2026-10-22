package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.PieceEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.ProgressEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.nullValue
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

/** The equipment a won boss drops, read over http from the report response and from the database. */
class EquipmentDropFlowIT : IntegrationTestBase() {
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

    private fun placeAt(
        stage: Int,
        encounter: String,
    ) = jpaProgressRepository.save(ProgressEntity("yan", 1, stage, encounter, 1, false))

    private fun report(
        stage: Int,
        encounter: String,
        outcome: String = "CLEARED",
    ) = asUser()
        .contentType(ContentType.JSON)
        .body("""{"chapter":1,"stage":$stage,"encounter":"$encounter","phase":1,"outcome":"$outcome"}""")
        .post("/progress/outcome")

    @Test
    fun `a cleared miniboss drops a piece at a roll below 25 percent and stores it`() {
        chance.value = 0.0
        placeAt(1, "MINIBOSS")

        report(1, "MINIBOSS")
            .then()
            .statusCode(200)
            .body("equipmentDrop.sold", equalTo(false))
            .body("equipmentDrop.piece.rarity", equalTo("COMMON"))
            .body("equipmentDrop.piece.slot", equalTo("WEAPON"))
            .body("equipmentDrop.piece.refine", equalTo(0))
            .body("equipmentDrop.piece.clickDamage", equalTo(2.0f))
            .body("equipmentDrop.piece.affixes", hasSize<Any>(1))
            .body("equipmentDrop.piece.affixes[0].type", equalTo("CRIT_CHANCE"))
            .body("equipmentDrop.piece.affixes[0].value", equalTo(1))
            .body("equipmentDrop.piece.refineCost", equalTo(500))
            .body("equipmentDrop.piece.sellPrice", equalTo(100))

        assertEquals(1, jpaPieceRepository.count())
        assertEquals("yan", jpaPieceRepository.findAll().single().username)
    }

    @Test
    fun `a cleared miniboss at a roll of 25 percent or more drops no piece`() {
        chance.value = 0.25
        placeAt(1, "MINIBOSS")

        report(1, "MINIBOSS").then().statusCode(200).body("equipmentDrop", nullValue())

        assertEquals(0, jpaPieceRepository.count())
    }

    @Test
    fun `a cleared chapter boss always drops a piece`() {
        chance.value = 0.5
        placeAt(10, "CHAPTER_BOSS")

        report(10, "CHAPTER_BOSS")
            .then()
            .statusCode(200)
            .body("equipmentDrop.piece.rarity", equalTo("UNCOMMON"))
            .body("equipmentDrop.piece.slot", equalTo("RING"))
            .body("equipmentDrop.piece.affixes", hasSize<Any>(2))
            .body("equipmentDrop.piece.clickDamage", nullValue())

        assertEquals(1, jpaPieceRepository.count())
    }

    @Test
    fun `a failed boss a cleared phase and a rejected report drop no piece`() {
        chance.value = 0.0
        placeAt(1, "MINIBOSS")
        report(1, "MINIBOSS", "FAILED").then().statusCode(200).body("equipmentDrop", nullValue())
        placeAt(1, "PHASE")
        report(1, "PHASE").then().statusCode(200).body("equipmentDrop", nullValue())
        placeAt(1, "MINIBOSS")
        report(5, "MINIBOSS").then().statusCode(409)

        assertEquals(0, jpaPieceRepository.count())
    }

    @Test
    fun `a drop into a full bag is sold into the wallet and not stored`() {
        chance.value = 0.0
        repeat(
            100,
        ) { jpaPieceRepository.save(PieceEntity("filler-$it", "yan", "RING", "COMMON", null, 0, "CRIT_CHANCE:1", null, it.toLong())) }
        placeAt(10, "CHAPTER_BOSS")

        report(10, "CHAPTER_BOSS")
            .then()
            .statusCode(200)
            .body("equipmentDrop.sold", equalTo(true))
            .body("equipmentDrop.piece.rarity", equalTo("COMMON"))

        assertEquals(100, jpaPieceRepository.count())
        asUser()
            .get("/wallet")
            .then()
            .statusCode(200)
            .body("wallet.silver", equalTo(1))
            .body("wallet.copper", equalTo(0))
    }
}
