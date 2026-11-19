package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.CardCopyEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.ProgressEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.TeamRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.WalletEntity
import br.com.woodriver.infinity_grove_ws.domain.CopyKey
import br.com.woodriver.infinity_grove_ws.domain.Team
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.Response
import org.hamcrest.Matchers.equalTo
import org.springframework.beans.factory.annotation.Autowired
import java.util.concurrent.Callable
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

    private fun funded(
        copper: Long,
        username: String = "yan",
    ) = jpaWalletRepository.save(WalletEntity(username, copper))

    private fun copper(username: String = "yan") = jpaWalletRepository.findById(username).get().copper

    private fun buy(
        token: String,
        fromSlots: Any?,
    ): Response =
        given()
            .header("Authorization", token)
            .contentType(ContentType.JSON)
            .body(mapOf("fromSlots" to fromSlots))
            .post("/team/slots")

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

    @Test
    fun `POST team slots buys slot 1 for 1 ouro and answers the team and the wallet`() {
        val token = register()
        cleared("5")
        funded(15_000)

        buy(token, 0)
            .then()
            .statusCode(200)
            .body("team.boughtSlots", equalTo(1))
            .body("team.openSlots", equalTo(1))
            .body("team.allies", equalTo(listOf(null, null, null, null)))
            .body("wallet.gold", equalTo(0))
            .body("wallet.silver", equalTo(50))
            .body("wallet.copper", equalTo(0))

        assertEquals(5_000L, copper())
    }

    @Test
    fun `a second POST team slots with the same fromSlots answers 409 TEAM_SLOT_MISMATCH with the stored team`() {
        val token = register()
        cleared("5")
        funded(15_000)
        buy(token, 0).then().statusCode(200)

        buy(token, 0)
            .then()
            .statusCode(409)
            .body("code", equalTo("TEAM_SLOT_MISMATCH"))
            .body("team.boughtSlots", equalTo(1))
            .body("team.openSlots", equalTo(1))
            .body("team.unlocked", equalTo(true))

        assertEquals(5_000L, copper())
    }

    @Test
    fun `POST team slots with every open slot bought answers 409 TEAM_SLOT_LOCKED`() {
        val token = register()
        cleared("5")
        bought(1)
        funded(50_000)

        buy(token, 1).then().statusCode(409).body("code", equalTo("TEAM_SLOT_LOCKED"))

        assertEquals(50_000L, copper())
    }

    @Test
    fun `POST team slots before the chapter 5 boss answers 409 TEAM_SLOT_LOCKED`() {
        val token = register()
        funded(50_000)

        buy(token, 0).then().statusCode(409).body("code", equalTo("TEAM_SLOT_LOCKED"))
    }

    @Test
    fun `POST team slots with 4 bought slots answers 409 TEAM_SLOTS_MAX`() {
        val token = register()
        cleared("5,6,7,8")
        bought(4)

        buy(token, 4).then().statusCode(409).body("code", equalTo("TEAM_SLOTS_MAX"))
    }

    @Test
    fun `POST team slots without enough copper answers 409 NOT_ENOUGH_COPPER and changes nothing`() {
        val token = register()
        cleared("5")
        funded(9_999)

        buy(token, 0).then().statusCode(409).body("code", equalTo("NOT_ENOUGH_COPPER"))

        assertEquals(9_999L, copper())
        assertEquals(Team(), teamRepository.find("yan"))
    }

    @Test
    fun `POST team slots without fromSlots answers 400 INVALID_TEAM_SLOT_REQUEST`() {
        val token = register()

        given()
            .header("Authorization", token)
            .contentType(ContentType.JSON)
            .body("{}")
            .post("/team/slots")
            .then()
            .statusCode(400)
            .body("code", equalTo("INVALID_TEAM_SLOT_REQUEST"))
    }

    @Test
    fun `POST team slots with a string fromSlots answers 400 INVALID_TEAM_SLOT_REQUEST`() {
        val token = register()

        buy(token, "0").then().statusCode(400).body("code", equalTo("INVALID_TEAM_SLOT_REQUEST"))
    }

    @Test
    fun `POST team slots with a decimal fromSlots answers 400 INVALID_TEAM_SLOT_REQUEST`() {
        val token = register()

        buy(token, 0.5).then().statusCode(400).body("code", equalTo("INVALID_TEAM_SLOT_REQUEST"))
    }

    @Test
    fun `POST team slots with a negative fromSlots answers 400 INVALID_TEAM_SLOT_REQUEST`() {
        val token = register()

        buy(token, -1).then().statusCode(400).body("code", equalTo("INVALID_TEAM_SLOT_REQUEST"))
    }

    @Test
    fun `POST team slots checks TEAM_SLOT_MISMATCH before TEAM_SLOTS_MAX`() {
        val token = register()
        bought(4)

        buy(token, 3).then().statusCode(409).body("code", equalTo("TEAM_SLOT_MISMATCH"))
    }

    @Test
    fun `POST team slots checks TEAM_SLOTS_MAX before TEAM_SLOT_LOCKED`() {
        val token = register()
        cleared("5")
        bought(4)

        buy(token, 4).then().statusCode(409).body("code", equalTo("TEAM_SLOTS_MAX"))
    }

    @Test
    fun `POST team slots checks TEAM_SLOT_LOCKED before NOT_ENOUGH_COPPER`() {
        val token = register()
        funded(0)

        buy(token, 0).then().statusCode(409).body("code", equalTo("TEAM_SLOT_LOCKED"))
    }

    @Test
    fun `two POST team slots with the same fromSlots at once buy one slot and charge once`() {
        val token = register()
        cleared("5")
        funded(30_000)
        val pool = Executors.newFixedThreadPool(2)

        val answers =
            try {
                List(2) { Callable { buy(token, 0).let { it.statusCode() to it.path<String>("code") } } }
                    .map(pool::submit)
                    .map { it.get(15, TimeUnit.SECONDS) }
            } finally {
                pool.shutdown()
            }

        assertEquals(listOf(200 to null, 409 to "TEAM_SLOT_MISMATCH"), answers.sortedBy { it.first })
        assertEquals(20_000L, copper())
        assertEquals(1, teamRepository.find("yan").boughtSlots)
    }

    @Test
    fun `POST team slots answers 401 without a token`() {
        given()
            .contentType(ContentType.JSON)
            .body("""{"fromSlots":0}""")
            .post("/team/slots")
            .then()
            .statusCode(401)
    }

    @Test
    fun `a purchase changes only the buyer's team and wallet`() {
        register("yan", "FIRE")
        val ana = register("ana", "FIRE")
        cleared("5", "ana")
        funded(15_000, "ana")
        funded(15_000)

        buy(ana, 0).then().statusCode(200)

        assertEquals(Team(), teamRepository.find("yan"))
        assertEquals(15_000L, copper())
        assertEquals(Team(1), teamRepository.find("ana"))
        assertEquals(5_000L, copper("ana"))
    }

    @Test
    fun `bought slots survive an account reset`() {
        val token = register()
        cleared("5,6")
        jpaProgressRepository.save(ProgressEntity("yan", 6, 1, "PHASE", 1, false))
        funded(30_000)
        buy(token, 0).then().statusCode(200)
        buy(token, 1).then().statusCode(200)

        given()
            .header("Authorization", token)
            .contentType(ContentType.JSON)
            .body("""{"fromChapter":6}""")
            .post("/account/reset")
            .then()
            .statusCode(200)

        given()
            .header("Authorization", token)
            .get("/heroes")
            .then()
            .statusCode(200)
            .body("team.boughtSlots", equalTo(2))
            .body("team.openSlots", equalTo(2))
    }
}
