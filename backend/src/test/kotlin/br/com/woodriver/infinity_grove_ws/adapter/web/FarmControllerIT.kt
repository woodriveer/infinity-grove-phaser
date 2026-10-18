package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.ProgressEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.Response
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.nullValue
import java.time.LocalDate
import java.time.ZoneOffset
import kotlin.test.Test
import kotlin.test.assertEquals

class FarmControllerIT : IntegrationTestBase() {
    private fun register(username: String = "yan"): String =
        "Bearer " +
            given()
                .contentType(ContentType.JSON)
                .body("""{"username":"$username","password":"password123","startingElement":"FIRE"}""")
                .post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path<String>("accessToken")

    private fun asUser(token: String): RequestSpecification = given().header("Authorization", token)

    private fun progressAt(
        stage: Int,
        encounter: String,
        completed: Boolean = false,
    ) = jpaProgressRepository.save(ProgressEntity("yan", 1, stage, encounter, 1, completed))

    private fun finished() = progressAt(10, "CHAPTER_BOSS", completed = true)

    private fun win(
        token: String,
        boss: String,
        outcome: String = "CLEARED",
    ): Response = asUser(token).contentType(ContentType.JSON).body("""{"boss":$boss,"outcome":"$outcome"}""").post("/farm/outcome")

    private val miniboss3 = """{"kind":"MINIBOSS","stage":3}"""
    private val chapterBoss = """{"kind":"CHAPTER_BOSS"}"""

    @Test
    fun `GET farm lists every miniboss, the chapter boss and ten wins left once the campaign is completed`() {
        val token = register()
        finished()

        asUser(token)
            .get("/farm")
            .then()
            .statusCode(200)
            .body("bosses", hasSize<Any>(11))
            .body("bosses[0].kind", equalTo("MINIBOSS"))
            .body("bosses[0].stage", equalTo(1))
            .body("bosses[9].stage", equalTo(10))
            .body("bosses[10].kind", equalTo("CHAPTER_BOSS"))
            .body("bosses[10].stage", nullValue())
            .body("chapterBossWinsLeft", equalTo(10))
    }

    @Test
    fun `GET farm lists only the minibosses already passed in the middle of the campaign`() {
        val token = register()
        progressAt(4, "PHASE")

        asUser(token)
            .get("/farm")
            .then()
            .statusCode(200)
            .body("bosses.stage", equalTo(listOf(1, 2, 3)))
            .body("chapterBossWinsLeft", equalTo(10))
    }

    @Test
    fun `a miniboss farm win answers the dropped card when the roll hits`() {
        val token = register()
        finished()
        chance.value = 0.0

        win(token, miniboss3)
            .then()
            .statusCode(200)
            .body("drop.heroId", equalTo("kael"))
            .body("drop.heroName", equalTo("Kael Raizférrea"))
            .body("drop.stars", equalTo(0))
            .body("chapterBossWinsLeft", equalTo(10))

        assertEquals(2, jpaCardCopyRepository.findAllByUsername("yan").single { it.stars == 0 }.copies)
    }

    @Test
    fun `a farm win answers a null drop when the roll misses and leaves the campaign untouched`() {
        val token = register()
        finished()

        win(token, miniboss3).then().statusCode(200).body("drop", nullValue())

        val stored = jpaProgressRepository.findById("yan").get()
        assertEquals(listOf(10, "CHAPTER_BOSS", true), listOf(stored.stage, stored.encounter, stored.completed))
    }

    @Test
    fun `a chapter boss farm win drops the next chapter hero and uses one of the ten daily wins`() {
        val token = register()
        finished()
        chance.value = 0.0

        win(token, chapterBoss)
            .then()
            .statusCode(200)
            .body("drop.heroId", equalTo("lyra"))
            .body("chapterBossWinsLeft", equalTo(9))
        asUser(token).get("/farm").then().body("chapterBossWinsLeft", equalTo(9))
    }

    @Test
    fun `a failed farm fight answers 200 with no drop and keeps the wins`() {
        val token = register()
        finished()
        chance.value = 0.0

        win(token, chapterBoss, "FAILED")
            .then()
            .statusCode(200)
            .body("drop", nullValue())
            .body("chapterBossWinsLeft", equalTo(10))

        assertEquals(1, jpaCardCopyRepository.findAllByUsername("yan").size)
    }

    @Test
    fun `an eleventh chapter boss win in a UTC day answers 409 DAILY_LIMIT_REACHED`() {
        val token = register()
        finished()
        val cards = jpaPlayerCardsRepository.findById("yan").get()
        cards.winsDay = LocalDate.now(ZoneOffset.UTC).toString()
        cards.winsToday = 10
        jpaPlayerCardsRepository.save(cards)
        chance.value = 0.0

        win(token, chapterBoss).then().statusCode(409).body("code", equalTo("DAILY_LIMIT_REACHED"))

        assertEquals(1, jpaCardCopyRepository.findAllByUsername("yan").single().copies)
        asUser(token).get("/farm").then().body("chapterBossWinsLeft", equalTo(0))
    }

    @Test
    fun `a boss not beaten yet answers 409 BOSS_NOT_AVAILABLE`() {
        val token = register()
        progressAt(3, "PHASE")

        win(token, miniboss3).then().statusCode(409).body("code", equalTo("BOSS_NOT_AVAILABLE"))
        win(token, chapterBoss).then().statusCode(409).body("code", equalTo("BOSS_NOT_AVAILABLE"))
    }

    @Test
    fun `a second farm win right after the first answers 409 FARM_TOO_FAST`() {
        val token = register()
        finished()

        win(token, miniboss3).then().statusCode(200)
        win(token, miniboss3).then().statusCode(409).body("code", equalTo("FARM_TOO_FAST"))
    }

    @Test
    fun `a malformed body answers 400`() {
        val token = register()
        finished()

        listOf(
            """{"outcome":"CLEARED"}""",
            """{"boss":{"kind":"PHASE"},"outcome":"CLEARED"}""",
            """{"boss":{"kind":"MINIBOSS"},"outcome":"CLEARED"}""",
            """{"boss":{"kind":"CHAPTER_BOSS","stage":2},"outcome":"CLEARED"}""",
            """{"boss":{"kind":"MINIBOSS","stage":"3"},"outcome":"CLEARED"}""",
            """{"boss":{"kind":"MINIBOSS","stage":3},"outcome":"WON"}""",
            """{"boss":{"kind":"MINIBOSS","stage":3}}""",
        ).forEach { body ->
            asUser(token)
                .contentType(ContentType.JSON)
                .body(body)
                .post("/farm/outcome")
                .then()
                .statusCode(400)
        }
    }

    @Test
    fun `every route answers 401 without a token`() {
        given().get("/farm").then().statusCode(401)
        given()
            .contentType(
                ContentType.JSON,
            ).body("""{"boss":$chapterBoss,"outcome":"CLEARED"}""")
            .post("/farm/outcome")
            .then()
            .statusCode(401)
    }
}
