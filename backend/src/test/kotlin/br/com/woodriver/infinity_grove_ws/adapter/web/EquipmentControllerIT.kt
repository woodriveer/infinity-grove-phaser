package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.CardCopyEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.PieceEntity
import br.com.woodriver.infinity_grove_ws.domain.CopyKey
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.nullValue
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

class EquipmentControllerIT : IntegrationTestBase() {
    private lateinit var token: String

    private fun asUser(): RequestSpecification = given().header("Authorization", token)

    private fun register(username: String): String =
        "Bearer " +
            given()
                .contentType(ContentType.JSON)
                .body("""{"username":"$username","password":"password123","startingElement":"FIRE"}""")
                .post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path<String>("accessToken")

    @BeforeTest
    fun registerPlayer() {
        token = register("yan")
    }

    private fun weapon(
        id: String,
        username: String = "yan",
        heroId: String? = null,
        createdAt: Long = 1,
    ) = jpaPieceRepository.save(
        PieceEntity(id, username, "WEAPON", "RARE", 4, 3, "CRIT_DAMAGE_PCT:21,BOSS_TIME_SECONDS:2,ARMOR_PIERCE_PCT:9", heroId, createdAt),
    )

    private fun ring(
        id: String,
        heroId: String? = null,
        createdAt: Long = 2,
    ) = jpaPieceRepository.save(PieceEntity(id, "yan", "RING", "COMMON", null, 0, "CLICK_DAMAGE_PCT:7", heroId, createdAt))

    private fun equip(
        id: String,
        heroId: String,
    ) = asUser().contentType(ContentType.JSON).body("""{"heroId":"$heroId"}""").post("/equipment/$id/equip")

    @Test
    fun `GET equipment lists the pieces with refined values, costs and the capacity`() {
        weapon("w1", heroId = "kael")
        ring("r1")

        asUser()
            .get("/equipment")
            .then()
            .statusCode(200)
            .body("capacity", equalTo(100))
            .body("pieces", hasSize<Any>(2))
            .body("pieces[0].id", equalTo("w1"))
            .body("pieces[0].slot", equalTo("WEAPON"))
            .body("pieces[0].rarity", equalTo("RARE"))
            .body("pieces[0].refine", equalTo(3))
            .body("pieces[0].clickDamage", equalTo(5.2f))
            .body("pieces[0].heroId", equalTo("kael"))
            .body("pieces[0].affixes[0].type", equalTo("CRIT_DAMAGE_PCT"))
            .body("pieces[0].affixes[0].value", equalTo(27))
            .body("pieces[0].refineCost", equalTo(7368))
            .body("pieces[0].rerollCost", nullValue())
            .body("pieces[0].sellPrice", equalTo(750))
            .body("pieces[1].clickDamage", nullValue())
            .body("pieces[1].heroId", nullValue())
            .body("pieces[1].refineCost", equalTo(500))
    }

    @Test
    fun `GET equipment of a player without pieces is an empty list`() {
        asUser()
            .get("/equipment")
            .then()
            .statusCode(200)
            .body("pieces", hasSize<Any>(0))
    }

    @Test
    fun `GET equipment never shows the pieces of another account`() {
        register("other")
        weapon("theirs", username = "other")

        asUser()
            .get("/equipment")
            .then()
            .statusCode(200)
            .body("pieces", hasSize<Any>(0))
    }

    @Test
    fun `equip puts the piece on the hero and answers the whole list`() {
        ring("r1")

        equip("r1", "kael")
            .then()
            .statusCode(200)
            .body("pieces[0].heroId", equalTo("kael"))

        assertEquals("kael", jpaPieceRepository.findById("r1").get().heroId)
    }

    @Test
    fun `equip on a taken slot sends the old piece back to the bag`() {
        ring("old", "kael", createdAt = 2)
        ring("new", createdAt = 3)

        equip("new", "kael")
            .then()
            .statusCode(200)
            .body("pieces.find { it.id == 'new' }.heroId", equalTo("kael"))
            .body("pieces.find { it.id == 'old' }.heroId", nullValue())
    }

    @Test
    fun `equip moves a piece worn by another hero and leaves that slot empty`() {
        jpaCardCopyRepository.save(CardCopyEntity.from("yan", CopyKey("lyra", 0), 1))
        ring("r1", "kael")

        equip("r1", "lyra").then().statusCode(200).body("pieces[0].heroId", equalTo("lyra"))

        assertEquals("lyra", jpaPieceRepository.findById("r1").get().heroId)
    }

    @Test
    fun `equip on a hero the player does not own is 409 HERO_NOT_OWNED and changes nothing`() {
        ring("r1")

        equip("r1", "vex").then().statusCode(409).body("code", equalTo("HERO_NOT_OWNED"))

        assertEquals(null, jpaPieceRepository.findById("r1").get().heroId)
    }

    @Test
    fun `equip of a missing piece or of a piece of another account is 404 EQUIPMENT_NOT_FOUND`() {
        register("other")
        weapon("theirs", username = "other")

        equip("ghost", "kael").then().statusCode(404).body("code", equalTo("EQUIPMENT_NOT_FOUND"))
        equip("theirs", "kael").then().statusCode(404).body("code", equalTo("EQUIPMENT_NOT_FOUND"))
        assertEquals(null, jpaPieceRepository.findById("theirs").get().heroId)
    }

    @Test
    fun `equip without a hero id is 400`() {
        ring("r1")

        asUser()
            .contentType(ContentType.JSON)
            .body("""{}""")
            .post("/equipment/r1/equip")
            .then()
            .statusCode(400)
    }

    @Test
    fun `unequip empties the slot and keeps the piece`() {
        ring("r1", "kael")

        asUser()
            .post("/equipment/r1/unequip")
            .then()
            .statusCode(200)
            .body("pieces", hasSize<Any>(1))
            .body("pieces[0].heroId", nullValue())

        assertEquals(null, jpaPieceRepository.findById("r1").get().heroId)
    }

    @Test
    fun `unequip of a missing piece is 404`() {
        asUser()
            .post("/equipment/ghost/unequip")
            .then()
            .statusCode(404)
            .body("code", equalTo("EQUIPMENT_NOT_FOUND"))
    }

    @Test
    fun `every equipment route needs a token`() {
        given().get("/equipment").then().statusCode(401)
        given()
            .contentType(ContentType.JSON)
            .body("""{"heroId":"kael"}""")
            .post("/equipment/r1/equip")
            .then()
            .statusCode(401)
        given().post("/equipment/r1/unequip").then().statusCode(401)
    }
}
