package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.ProgressEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.ValidatableResponse
import org.hamcrest.Matchers.contains
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.greaterThanOrEqualTo
import org.hamcrest.Matchers.lessThan
import org.hamcrest.Matchers.nullValue
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.Test
import kotlin.test.assertTrue

class RankingControllerIT : IntegrationTestBase() {
    @Autowired
    private lateinit var jdbc: JdbcTemplate

    private fun boss(
        username: String,
        chapter: Int,
        ms: Long,
        at: Long,
    ) = jdbc.update(
        "insert into player_boss_times (username, chapter, best_ms, achieved_at) values (?, ?, ?, ?)",
        username,
        chapter,
        ms,
        at,
    )

    private fun story(
        username: String,
        ms: Long,
    ) = jdbc.update("insert into player_story_times (username, best_ms, achieved_at) values (?, ?, 1)", username, ms)

    private fun power(
        username: String,
        value: Double,
    ) = jdbc.update("insert into player_click_power (username, best_power, achieved_at) values (?, ?, 1)", username, value)

    private fun get(
        path: String,
        caller: String = "test-caller",
    ): ValidatableResponse = authenticated(caller).get(path).then()

    private fun rawBody(
        path: String,
        caller: String = "test-caller",
    ): String = get(path, caller).statusCode(200).extract().asString()

    /** Players `p01` to `p12` with chapter 3 times of 1 000 x n ms. */
    private fun twelveInChapterThree() {
        val names = (1..12).map { "p%02d".format(it) }
        users(*names.toTypedArray())
        names.forEachIndexed { index, name -> boss(name, 3, 1_000L * (index + 1), (index + 1).toLong()) }
    }

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

    private fun outcome(
        token: String,
        stage: Int,
        encounter: String,
    ): ValidatableResponse =
        given()
            .header("Authorization", token)
            .contentType(ContentType.JSON)
            .body("""{"chapter":3,"stage":$stage,"encounter":"$encounter","phase":1,"outcome":"CLEARED"}""")
            .post("/progress/outcome")
            .then()
            .statusCode(200)

    @Test
    fun `the boss board of chapter 3 answers the top 10 in ascending time with integer values`() {
        twelveInChapterThree()

        get("/rankings/boss-time?chapter=3")
            .statusCode(200)
            .body("board", equalTo("boss-time"))
            .body("chapter", equalTo(3))
            .body("entries.size()", equalTo(10))
            .body("entries[0].position", equalTo(1))
            .body("entries[0].username", equalTo("p01"))
            .body("entries[0].value", equalTo(1000))
            .body("me", nullValue())
    }

    @Test
    fun `the caller 12th of the boss board gets its own row`() {
        twelveInChapterThree()

        get("/rankings/boss-time?chapter=3", caller = "p12")
            .statusCode(200)
            .body("me.position", equalTo(12))
            .body("me.username", equalTo("p12"))
            .body("me.value", equalTo(12000))
    }

    @Test
    fun `the story board orders ascending and answers chapter null`() {
        users("ana", "bob")
        story("ana", 3_600_000)
        story("bob", 1_365_000)

        get("/rankings/story-time?chapter=3")
            .statusCode(200)
            .body("board", equalTo("story-time"))
            .body("chapter", nullValue())
            .body("entries.value", contains(1_365_000, 3_600_000))
    }

    @Test
    fun `the click power board answers a JSON number largest first`() {
        users("ana", "bob")
        power("ana", 41.0)
        power("bob", 16.5)

        val body = rawBody("/rankings/click-power")

        assertTrue(body.indexOf("\"value\":41.0") in 0 until body.indexOf("\"value\":16.5"), body)
    }

    @Test
    fun `the fortune board lists the peaks largest first without 0`() {
        users("ana", "bob", "cid")
        jdbc.update("insert into wallets (username, copper) values ('ana', 500), ('bob', 0), ('cid', 700)")

        get("/rankings/fortune")
            .statusCode(200)
            .body("entries.username", contains("cid", "ana"))
            .body("entries.value", contains(700, 500))
    }

    @Test
    fun `a tie goes to the earlier record`() {
        users("ana", "bob")
        boss("ana", 3, 5_000, 20)
        boss("bob", 3, 5_000, 10)

        get("/rankings/boss-time?chapter=3")
            .statusCode(200)
            .body("entries.username", contains("bob", "ana"))
    }

    @Test
    fun `an unknown board is 404 RANKING_NOT_FOUND`() {
        get("/rankings/gold")
            .statusCode(404)
            .body("code", equalTo("RANKING_NOT_FOUND"))
    }

    @Test
    fun `a boss board without a chapter, with 16 or with abc is 400 INVALID_RANKING_REQUEST`() {
        listOf("/rankings/boss-time", "/rankings/boss-time?chapter=16", "/rankings/boss-time?chapter=abc").forEach { path ->
            get(path)
                .statusCode(400)
                .body("code", equalTo("INVALID_RANKING_REQUEST"))
        }
    }

    @Test
    fun `the boards need a token`() {
        given().get("/rankings/fortune").then().statusCode(401)
        given().post("/rankings/click-power").then().statusCode(401)
    }

    @Test
    fun `a real boss fight lands on the board`() {
        val token = register()
        jpaProgressRepository.save(ProgressEntity("yan", 3, 10, "MINIBOSS", 1, false))

        outcome(token, 10, "MINIBOSS")
        Thread.sleep(1_100)
        outcome(token, 10, "CHAPTER_BOSS")

        get("/rankings/boss-time?chapter=3", caller = "yan")
            .statusCode(200)
            .body("me.position", equalTo(1))
            .body("me.value", greaterThanOrEqualTo(1100))
            .body("me.value", lessThan(10_000))
    }

    @Test
    fun `the click power refresh answers the value and the best`() {
        val token = register()

        val refresh =
            given()
                .header("Authorization", token)
                .post("/rankings/click-power")
                .then()
                .statusCode(200)
                .extract()
                .asString()
        assertTrue(refresh.contains("\"value\":1.0") && refresh.contains("\"best\":1.0"), refresh)

        val board = rawBody("/rankings/click-power", caller = "yan")
        assertTrue(board.contains("\"username\":\"yan\"") && board.contains("\"value\":1.0"), board)
    }

    @Test
    fun `a farm win records the click power`() {
        val token = register()
        jpaProgressRepository.save(ProgressEntity("yan", 1, 2, "PHASE", 1, false))

        given()
            .header("Authorization", token)
            .contentType(ContentType.JSON)
            .body("""{"boss":{"kind":"MINIBOSS","stage":1},"outcome":"CLEARED"}""")
            .post("/farm/outcome")
            .then()
            .statusCode(200)

        get("/rankings/click-power", caller = "yan")
            .statusCode(200)
            .body("entries.username", contains("yan"))
    }
}
