package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.CardCopyEntity
import br.com.woodriver.infinity_grove_ws.domain.CopyKey
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.Response
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.test.Test
import kotlin.test.assertEquals

class HeroControllerIT : IntegrationTestBase() {
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

    private fun asUser(token: String): RequestSpecification = given().header("Authorization", token)

    private fun give(
        username: String,
        heroId: String,
        stars: Int,
        copies: Int,
    ) {
        jpaCardCopyRepository.save(CardCopyEntity.from(username, CopyKey(heroId, stars), copies))
    }

    private fun fuse(
        token: String,
        heroId: String,
        body: String,
    ): Response = asUser(token).contentType(ContentType.JSON).body(body).post("/heroes/$heroId/fuse")

    private fun leader(
        token: String,
        body: String,
    ): Response = asUser(token).contentType(ContentType.JSON).body(body).put("/leader")

    @Test
    fun `GET heroes answers the five heroes, the leader, chapters and unlocked flags`() {
        val token = register(element = "WATER")

        asUser(token)
            .get("/heroes")
            .then()
            .statusCode(200)
            .body("leaderId", equalTo("orina"))
            .body("heroes", hasSize<Any>(5))
            .body("heroes.id", equalTo(listOf("kael", "lyra", "orina", "seraphine", "vex")))
            .body("heroes.chapter", equalTo(listOf(2, 3, 1, 5, 4)))
            .body("heroes[2].name", equalTo("Orina Brumaestrela"))
            .body("heroes[2].element", equalTo("WATER"))
            .body("heroes[2].heroClass", equalTo("Maga"))
            .body("heroes[2].portrait", equalTo("orina_position"))
            .body("heroes[2].owned", equalTo(true))
            .body("heroes[2].stars", equalTo(0))
            .body("heroes[2].copies.0", equalTo(1))
            .body("heroes[2].copies.3", equalTo(0))
            .body("heroes[2].copies.9", equalTo(0))
            .body("heroes[2].skills", hasSize<Any>(3))
            .body("heroes[2].skills.unlocked", equalTo(listOf(false, false, false)))
            .body("heroes[2].skills[0].name", equalTo("Prisão de Espinhos"))
            .body("heroes[2].skills[0].cooldownSeconds", equalTo(18))
            .body("heroes[2].skills[0].image", equalTo("orina_grasp_prision"))
            .body("heroes[0].owned", equalTo(false))
    }

    @Test
    fun `GET heroes answers the level of every skill`() {
        val token = register()
        give("yan", "kael", 4, 1)

        asUser(token)
            .get("/heroes")
            .then()
            .statusCode(200)
            .body("heroes[0].stars", equalTo(4))
            .body("heroes[0].copies.4", equalTo(1))
            .body("heroes[0].skills.level", equalTo(listOf(2, 1, 1)))
            .body("heroes[0].skills.unlocked", equalTo(listOf(true, true, true)))
            .body("heroes[1].skills.level", equalTo(listOf(0, 0, 0)))
    }

    @Test
    fun `fuse answers the updated hero and unlocks the first skill`() {
        val token = register()
        give("yan", "kael", 0, 3)

        fuse(token, "kael", """{"stars":0}""")
            .then()
            .statusCode(200)
            .body("id", equalTo("kael"))
            .body("stars", equalTo(1))
            .body("copies.0", equalTo(0))
            .body("copies.1", equalTo(1))
            .body("skills.unlocked", equalTo(listOf(true, false, false)))
    }

    @Test
    fun `fuse to three stars unlocks every skill`() {
        val token = register()
        give("yan", "kael", 2, 3)

        fuse(token, "kael", """{"stars":2}""")
            .then()
            .statusCode(200)
            .body("stars", equalTo(3))
            .body("skills.unlocked", equalTo(listOf(true, true, true)))
    }

    @Test
    fun `fuse answers the level of every skill`() {
        val token = register()
        give("yan", "kael", 0, 3)

        fuse(token, "kael", """{"stars":0}""")
            .then()
            .statusCode(200)
            .body("skills.level", equalTo(listOf(1, 0, 0)))
    }

    @Test
    fun `fuse without three copies answers 409 NOT_ENOUGH_CARDS and keeps the bag`() {
        val token = register()

        fuse(token, "kael", """{"stars":0}""").then().statusCode(409).body("code", equalTo("NOT_ENOUGH_CARDS"))

        assertEquals(1, jpaCardCopyRepository.findAllByUsername("yan").single().copies)
    }

    @Test
    fun `fuse with stars missing, negative or three answers 400 INVALID_FUSION`() {
        val token = register()
        give("yan", "kael", 3, 5)

        listOf("{}", """{"stars":-1}""", """{"stars":3}""", """{"stars":"0"}""").forEach { body ->
            fuse(token, "kael", body).then().statusCode(400).body("code", equalTo("INVALID_FUSION"))
        }
    }

    @Test
    fun `fuse of an unknown hero answers 404 HERO_NOT_FOUND`() {
        val token = register()

        fuse(token, "ghost", """{"stars":0}""").then().statusCode(404).body("code", equalTo("HERO_NOT_FOUND"))
    }

    @Test
    fun `PUT leader accepts an owned hero`() {
        val token = register()
        give("yan", "lyra", 0, 1)

        leader(token, """{"heroId":"lyra"}""").then().statusCode(200).body("leaderId", equalTo("lyra"))

        asUser(token).get("/heroes").then().body("leaderId", equalTo("lyra"))
    }

    @Test
    fun `PUT leader for a hero not owned answers 409 HERO_NOT_OWNED and keeps the leader`() {
        val token = register()

        leader(token, """{"heroId":"lyra"}""").then().statusCode(409).body("code", equalTo("HERO_NOT_OWNED"))

        asUser(token).get("/heroes").then().body("leaderId", equalTo("kael"))
    }

    @Test
    fun `PUT leader for an unknown hero answers 404 HERO_NOT_FOUND and a missing hero 400`() {
        val token = register()

        leader(token, """{"heroId":"ghost"}""").then().statusCode(404).body("code", equalTo("HERO_NOT_FOUND"))
        leader(token, "{}").then().statusCode(400)
    }

    @Test
    fun `every route answers 401 without a token`() {
        given().get("/heroes").then().statusCode(401)
        given()
            .contentType(ContentType.JSON)
            .body("""{"stars":0}""")
            .post("/heroes/kael/fuse")
            .then()
            .statusCode(401)
        given()
            .contentType(ContentType.JSON)
            .body("""{"heroId":"kael"}""")
            .put("/leader")
            .then()
            .statusCode(401)
    }

    @Test
    fun `two simultaneous fusions of the same three cards give exactly one 200 and one 409`() {
        val token = register()
        give("yan", "kael", 0, 3)
        val pool = Executors.newFixedThreadPool(2)
        val start = CountDownLatch(1)

        val calls =
            (1..2).map {
                pool.submit<Int> {
                    start.await(5, TimeUnit.SECONDS)
                    fuse(token, "kael", """{"stars":0}""").statusCode()
                }
            }
        start.countDown()
        val statuses = calls.map { it.get(15, TimeUnit.SECONDS) }.sorted()
        pool.shutdown()

        assertEquals(listOf(200, 409), statuses)
        assertEquals(
            mapOf(1 to 1),
            jpaCardCopyRepository.findAllByUsername("yan").associate { it.stars to it.copies }.filterKeys { it == 1 },
        )
        assertEquals(0, jpaCardCopyRepository.findAllByUsername("yan").count { it.stars == 0 })
    }

    @Test
    fun `a player only reads and changes their own bag`() {
        val yan = register("yan", "FIRE")
        val ana = register("ana", "NATURE")
        give("yan", "kael", 0, 3)

        fuse(yan, "kael", """{"stars":0}""").then().statusCode(200)

        asUser(ana)
            .get("/heroes")
            .then()
            .body("heroes[0].owned", equalTo(false))
            .body("leaderId", equalTo("lyra"))
        fuse(ana, "kael", """{"stars":0}""").then().statusCode(409)
    }
}
