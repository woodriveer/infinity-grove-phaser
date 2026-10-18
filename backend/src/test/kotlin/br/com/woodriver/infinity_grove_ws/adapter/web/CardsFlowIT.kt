package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.ControllableChanceRoller
import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.ProgressEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import kotlin.test.Test

/** One player from registration to farming, read only through the http routes (progress is placed directly to skip 50 phases). */
class CardsFlowIT : IntegrationTestBase() {
    private fun asUser(token: String): RequestSpecification = given().header("Authorization", token)

    private fun placeAt(
        stage: Int,
        encounter: String,
    ) = jpaProgressRepository.save(ProgressEntity("yan", 1, stage, encounter, 1, false))

    private fun clear(
        token: String,
        stage: Int,
        encounter: String,
    ) = asUser(token)
        .contentType(ContentType.JSON)
        .body("""{"chapter":1,"stage":$stage,"encounter":"$encounter","phase":1,"outcome":"CLEARED"}""")
        .post("/progress/outcome")

    @Test
    fun `a player registers, collects cards, fuses, takes a new leader and farms`() {
        val token =
            "Bearer " +
                given()
                    .contentType(ContentType.JSON)
                    .body("""{"username":"yan","password":"password123","startingElement":"FIRE"}""")
                    .post("/users")
                    .then()
                    .statusCode(201)
                    .extract()
                    .path<String>("accessToken")

        asUser(token)
            .get("/heroes")
            .then()
            .body("leaderId", equalTo("kael"))
            .body("heroes[0].copies.0", equalTo(1))
            .body("heroes[0].skills.unlocked", equalTo(listOf(false, false, false)))

        chance.value = 0.0
        repeat(2) {
            placeAt(1, "MINIBOSS")
            clear(token, 1, "MINIBOSS").then().statusCode(200).body("drop.heroId", equalTo("kael"))
        }
        asUser(token).get("/heroes").then().body("heroes[0].copies.0", equalTo(3))

        asUser(token)
            .contentType(ContentType.JSON)
            .body("""{"stars":0}""")
            .post("/heroes/kael/fuse")
            .then()
            .statusCode(200)
            .body("stars", equalTo(1))
            .body("copies.0", equalTo(0))
            .body("copies.1", equalTo(1))
            .body("skills.unlocked", equalTo(listOf(true, false, false)))

        chance.value = ControllableChanceRoller.NO_DROP
        placeAt(10, "CHAPTER_BOSS")
        clear(token, 10, "CHAPTER_BOSS")
            .then()
            .statusCode(200)
            .body("drop.heroId", equalTo("lyra"))
            .body("completed", equalTo(true))
        asUser(token)
            .get("/heroes")
            .then()
            .body("heroes[1].owned", equalTo(true))
            .body("heroes[1].copies.0", equalTo(1))

        asUser(token)
            .contentType(ContentType.JSON)
            .body("""{"heroId":"lyra"}""")
            .put("/leader")
            .then()
            .statusCode(200)
            .body("leaderId", equalTo("lyra"))

        asUser(token)
            .get("/farm")
            .then()
            .body("bosses", hasSize<Any>(11))
            .body("chapterBossWinsLeft", equalTo(9))
        asUser(token)
            .contentType(ContentType.JSON)
            .body("""{"boss":{"kind":"CHAPTER_BOSS"},"outcome":"CLEARED"}""")
            .post("/farm/outcome")
            .then()
            .statusCode(200)
            .body("chapterBossWinsLeft", equalTo(8))
    }
}
