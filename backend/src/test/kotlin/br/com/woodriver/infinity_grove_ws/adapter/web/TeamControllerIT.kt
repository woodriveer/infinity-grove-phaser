package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.CardCopyEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.TeamRepository
import br.com.woodriver.infinity_grove_ws.domain.CopyKey
import br.com.woodriver.infinity_grove_ws.domain.Team
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.Response
import org.hamcrest.Matchers.equalTo
import org.springframework.beans.factory.annotation.Autowired
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class TeamControllerIT : IntegrationTestBase() {
    @Autowired
    private lateinit var teamRepository: TeamRepository

    /** Registers a player over HTTP and returns the `Authorization` header value. */
    private fun register(
        username: String = "yan",
        element: String = "FIRE",
    ): String =
        "Bearer " +
            given()
                .contentType(ContentType.JSON)
                .body("""{"username":"$username","password":"password123","startingElement":"$element"}""")
                .post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path<String>("accessToken")

    private fun cleared(
        csv: String,
        username: String = "yan",
    ) {
        jpaPlayerCardsRepository
            .findById(username)
            .get()
            .also { it.clearedChapters = csv }
            .let(jpaPlayerCardsRepository::save)
    }

    private fun give(
        heroId: String,
        username: String = "yan",
    ) {
        jpaCardCopyRepository.save(CardCopyEntity.from(username, CopyKey(heroId, 0), 1))
    }

    private fun bought(
        n: Int,
        username: String = "yan",
    ) = teamRepository.save(username, Team(n))

    private fun put(
        token: String,
        body: Any?,
    ): Response =
        given()
            .header("Authorization", token)
            .contentType(ContentType.JSON)
            .body(body)
            .put("/team")

    @Test
    fun `PUT team stores owned heroes in bought slots and answers leaderId and team`() {
        val token = register()
        cleared("5")
        bought(1)
        give("lyra")

        put(token, """{"allies":["lyra",null,null,null]}""")
            .then()
            .statusCode(200)
            .body("leaderId", equalTo("kael"))
            .body("team.unlocked", equalTo(true))
            .body("team.openSlots", equalTo(1))
            .body("team.boughtSlots", equalTo(1))
            .body("team.slotPrices", equalTo(listOf(10000, 20000, 30000, 40000)))
            .body("team.allies", equalTo(listOf("lyra", null, null, null)))

        assertEquals(Team(1, listOf("lyra", null, null, null)), teamRepository.find("yan"))
    }

    @Test
    fun `the same PUT team twice answers 200 with the same team both times`() {
        val token = register()
        cleared("5")
        bought(1)
        give("lyra")

        val first = put(token, """{"allies":["lyra",null,null,null]}""")
        val second = put(token, """{"allies":["lyra",null,null,null]}""")

        assertEquals(200, first.statusCode())
        assertEquals(200, second.statusCode())
        assertEquals(first.body.asString(), second.body.asString())
        assertEquals(Team(1, listOf("lyra", null, null, null)), teamRepository.find("yan"))
    }

    @Test
    fun `PUT team on a locked team answers 409 TEAM_LOCKED and stores nothing`() {
        val token = register()

        put(token, """{"allies":[null,null,null,null]}""").then().statusCode(409).body("code", equalTo("TEAM_LOCKED"))

        assertEquals(Team(), teamRepository.find("yan"))
    }

    @Test
    fun `PUT team with a hero in a slot that is not bought answers 409 TEAM_SLOT_NOT_BOUGHT`() {
        val token = register()
        cleared("5,6")
        bought(1)
        give("lyra")
        give("orina")

        put(token, """{"allies":["lyra","orina",null,null]}""")
            .then()
            .statusCode(409)
            .body("code", equalTo("TEAM_SLOT_NOT_BOUGHT"))

        assertEquals(Team(1), teamRepository.find("yan"))
    }

    @Test
    fun `PUT team with a hero not owned answers 409 HERO_NOT_OWNED`() {
        val token = register()
        cleared("5")
        bought(1)

        put(token, """{"allies":["vex",null,null,null]}""").then().statusCode(409).body("code", equalTo("HERO_NOT_OWNED"))

        assertEquals(Team(1), teamRepository.find("yan"))
    }

    @Test
    fun `PUT team with an unknown hero answers 404 HERO_NOT_FOUND`() {
        val token = register()
        cleared("5")
        bought(1)

        put(token, """{"allies":["ghost",null,null,null]}""").then().statusCode(404).body("code", equalTo("HERO_NOT_FOUND"))
    }

    @Test
    fun `PUT team without allies answers 400 INVALID_TEAM`() {
        val token = register()

        put(token, "{}").then().statusCode(400).body("code", equalTo("INVALID_TEAM"))
    }

    @Test
    fun `PUT team with allies that is not a list answers 400 INVALID_TEAM`() {
        val token = register()

        put(token, """{"allies":"lyra"}""").then().statusCode(400).body("code", equalTo("INVALID_TEAM"))
    }

    @Test
    fun `PUT team with 3 entries answers 400 INVALID_TEAM`() {
        val token = register()

        put(token, """{"allies":["lyra",null,null]}""").then().statusCode(400).body("code", equalTo("INVALID_TEAM"))
    }

    @Test
    fun `PUT team with 5 entries answers 400 INVALID_TEAM`() {
        val token = register()

        put(token, """{"allies":["lyra",null,null,null,null]}""").then().statusCode(400).body("code", equalTo("INVALID_TEAM"))
    }

    @Test
    fun `PUT team with a number entry answers 400 INVALID_TEAM`() {
        val token = register()

        put(token, """{"allies":[1,null,null,null]}""").then().statusCode(400).body("code", equalTo("INVALID_TEAM"))
    }

    @Test
    fun `PUT team with a hero twice answers 400 INVALID_TEAM`() {
        val token = register()
        cleared("5,6")
        bought(2)
        give("lyra")

        put(token, """{"allies":["lyra","lyra",null,null]}""").then().statusCode(400).body("code", equalTo("INVALID_TEAM"))
    }

    @Test
    fun `PUT team with the leader answers 400 INVALID_TEAM`() {
        val token = register()
        cleared("5")
        bought(1)

        put(token, """{"allies":["kael",null,null,null]}""").then().statusCode(400).body("code", equalTo("INVALID_TEAM"))
    }

    @Test
    fun `PUT team checks INVALID_TEAM before HERO_NOT_FOUND`() {
        val token = register()

        put(token, """{"allies":["ghost","ghost",null,null]}""").then().statusCode(400).body("code", equalTo("INVALID_TEAM"))
    }

    @Test
    fun `PUT team checks HERO_NOT_FOUND before TEAM_LOCKED`() {
        val token = register()

        put(token, """{"allies":["ghost",null,null,null]}""").then().statusCode(404).body("code", equalTo("HERO_NOT_FOUND"))
    }

    @Test
    fun `PUT team checks TEAM_LOCKED before TEAM_SLOT_NOT_BOUGHT`() {
        val token = register()
        bought(0)
        give("lyra")

        put(token, """{"allies":["lyra",null,null,null]}""").then().statusCode(409).body("code", equalTo("TEAM_LOCKED"))
    }

    @Test
    fun `PUT team checks TEAM_SLOT_NOT_BOUGHT before HERO_NOT_OWNED`() {
        val token = register()
        cleared("5")

        put(token, """{"allies":["vex",null,null,null]}""")
            .then()
            .statusCode(409)
            .body("code", equalTo("TEAM_SLOT_NOT_BOUGHT"))
    }

    @Test
    fun `PUT team answers 401 without a token`() {
        given()
            .contentType(ContentType.JSON)
            .body("""{"allies":[null,null,null,null]}""")
            .put("/team")
            .then()
            .statusCode(401)
    }

    @Test
    fun `two PUT team of the same player at once store one of the two bodies`() {
        val token = register()
        cleared("5,6")
        bought(2)
        give("lyra")
        give("orina")
        give("seraphine")
        val bodies =
            listOf(
                """{"allies":["lyra","orina",null,null]}""" to listOf("lyra", "orina", null, null),
                """{"allies":["orina","seraphine",null,null]}""" to listOf("orina", "seraphine", null, null),
            )
        val pool = Executors.newFixedThreadPool(2)
        val start = CountDownLatch(1)

        val calls =
            bodies.map { (body, _) ->
                pool.submit<Int> {
                    start.await(5, TimeUnit.SECONDS)
                    put(token, body).statusCode()
                }
            }
        start.countDown()
        val statuses = calls.map { it.get(15, TimeUnit.SECONDS) }
        pool.shutdown()

        assertEquals(listOf(200, 200), statuses)
        assertTrue(teamRepository.find("yan").allies in bodies.map { it.second })
    }

    @Test
    fun `a player changes only their own team`() {
        val yan = register("yan", "FIRE")
        val ana = register("ana", "FIRE")
        cleared("5", "ana")
        bought(1, "ana")
        give("lyra", "ana")

        put(ana, """{"allies":["lyra",null,null,null]}""").then().statusCode(200)

        given()
            .header("Authorization", yan)
            .get("/heroes")
            .then()
            .statusCode(200)
            .body("team.allies", equalTo(listOf(null, null, null, null)))
    }
}
