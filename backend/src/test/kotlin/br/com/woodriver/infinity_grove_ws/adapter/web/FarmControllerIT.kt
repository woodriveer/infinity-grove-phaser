package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.ProgressEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.TalentRepository
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.Response
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.nullValue
import org.springframework.beans.factory.annotation.Autowired
import java.time.LocalDate
import java.time.ZoneOffset
import kotlin.test.Test
import kotlin.test.assertEquals

class FarmControllerIT : IntegrationTestBase() {
    @Autowired
    private lateinit var talentRepository: TalentRepository

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
        chapter: Int = 1,
    ) = jpaProgressRepository.save(ProgressEntity("yan", chapter, stage, encounter, 1, completed))

    private fun finished() = progressAt(10, "CHAPTER_BOSS", completed = true, chapter = 15)

    private fun win(
        token: String,
        boss: String,
        outcome: String = "CLEARED",
        chapter: Any? = null,
    ): Response {
        val chapterField = if (chapter == null) "" else ",\"chapter\":$chapter"
        return asUser(token)
            .contentType(ContentType.JSON)
            .body("""{"boss":$boss,"outcome":"$outcome"$chapterField}""")
            .post("/farm/outcome")
    }

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
            .body("drop.heroId", equalTo("seraphine"))
            .body("drop.heroName", equalTo("Seraphine Aurora"))
            .body("drop.stars", equalTo(0))
            .body("chapterBossWinsLeft", equalTo(10))

        assertEquals(1, jpaCardCopyRepository.findAllByUsername("yan").single { it.heroId == "seraphine" && it.stars == 0 }.copies)
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
            .body("drop.heroId", equalTo("seraphine"))
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

    @Test
    fun `a farmed chapter boss win returns the equipment drop and stores the piece`() {
        val token = register()
        finished()
        chance.value = 0.5

        win(token, chapterBoss)
            .then()
            .statusCode(200)
            .body("equipmentDrop.sold", equalTo(false))
            .body("equipmentDrop.piece.rarity", equalTo("RARE"))
            .body("equipmentDrop.piece.slot", equalTo("RING"))

        assertEquals(1, jpaPieceRepository.count())
    }

    @Test
    fun `a farmed miniboss win drops a piece below 25 percent and none at 25 percent`() {
        val token = register()
        finished()
        chance.value = 0.2499
        win(token, miniboss3).then().statusCode(200).body("equipmentDrop.sold", equalTo(false))
        chance.value = 0.25
        Thread.sleep(5100)
        win(token, miniboss3).then().statusCode(200).body("equipmentDrop", nullValue())

        assertEquals(1, jpaPieceRepository.count())
    }

    @Test
    fun `a failed farm fight and a refused win drop no piece`() {
        val token = register()
        progressAt(4, "PHASE")
        chance.value = 0.0

        win(token, miniboss3, "FAILED").then().statusCode(200).body("equipmentDrop", nullValue())
        win(token, chapterBoss).then().statusCode(409)

        assertEquals(0, jpaPieceRepository.count())
    }

    @Test
    fun `a farm win pays no talent points`() {
        val token = register()
        finished()

        win(token, miniboss3).then().statusCode(200)

        assertEquals(0, talentRepository.earnedPoints("yan"))
    }

    @Test
    fun `GET farm answers the current chapter, the reached chapters and the chapter definition`() {
        val token = register()
        progressAt(4, "PHASE", chapter = 3)

        asUser(token)
            .get("/farm")
            .then()
            .statusCode(200)
            .body("chapter", equalTo(3))
            .body("chapters", equalTo(listOf(1, 2, 3)))
            .body("bosses.stage", equalTo(listOf(1, 2, 3)))
            .body("definition.bossHealth", equalTo(32000))
            .body("definition.stages", hasSize<Any>(10))
            .body("definition.stages[0].minibossHealth", equalTo(3200))
    }

    @Test
    fun `GET farm of an earlier chapter answers its eleven bosses and its definition`() {
        val token = register()
        progressAt(4, "PHASE", chapter = 3)

        asUser(token)
            .get("/farm?chapter=2")
            .then()
            .statusCode(200)
            .body("chapter", equalTo(2))
            .body("bosses", hasSize<Any>(11))
            .body("bosses[10].kind", equalTo("CHAPTER_BOSS"))
            .body("bosses[10].stage", nullValue())
            .body("definition.bossHealth", equalTo(8000))
            .body("definition.stages[0].minibossHealth", equalTo(800))
            .body("definition.boss.element", equalTo("FIRE"))
            .body("definition.boss.physicalDefense", equalTo(35))
            .body("chapterBossWinsLeft", equalTo(10))
    }

    @Test
    fun `GET farm above the reached chapter answers the reached chapter`() {
        val token = register()
        progressAt(4, "PHASE", chapter = 3)

        asUser(token)
            .get("/farm?chapter=9")
            .then()
            .statusCode(200)
            .body("chapter", equalTo(3))
            .body("bosses.stage", equalTo(listOf(1, 2, 3)))
    }

    @Test
    fun `GET farm with a chapter that is not an integer of at least 1 answers 400`() {
        val token = register()
        progressAt(4, "PHASE", chapter = 3)

        listOf("0", "-1", "abc", "2.5").forEach { chapter ->
            asUser(token)
                .get("/farm?chapter=$chapter")
                .then()
                .statusCode(400)
                .body("detail", equalTo("chapter must be an integer of at least 1"))
        }
    }

    @Test
    fun `an earlier chapter miniboss win drops the hero of that chapter and leaves the campaign`() {
        val token = register()
        progressAt(4, "PHASE", chapter = 3)
        chance.value = 0.0

        win(token, miniboss3, chapter = 2)
            .then()
            .statusCode(200)
            .body("drop.heroId", equalTo("lyra"))
            .body("drop.heroName", equalTo("Lyra Folhaveloz"))

        val stored = jpaProgressRepository.findById("yan").get()
        assertEquals(listOf(3, 4, "PHASE", false), listOf(stored.chapter, stored.stage, stored.encounter, stored.completed))
    }

    @Test
    fun `an earlier chapter boss win uses one of the shared daily wins`() {
        val token = register()
        progressAt(4, "PHASE", chapter = 3)
        chance.value = 0.0

        win(token, chapterBoss, chapter = 1)
            .then()
            .statusCode(200)
            .body("drop.heroId", equalTo("lyra"))
            .body("chapterBossWinsLeft", equalTo(9))

        asUser(token).get("/farm?chapter=2").then().body("chapterBossWinsLeft", equalTo(9))
    }

    @Test
    fun `a win without a chapter still fights the current chapter`() {
        val token = register()
        progressAt(4, "PHASE", chapter = 3)
        chance.value = 0.0

        win(token, miniboss3).then().statusCode(200).body("drop.heroId", equalTo("orina"))
    }

    @Test
    fun `a win of a chapter above the current one answers 409 BOSS_NOT_AVAILABLE`() {
        val token = register()
        progressAt(4, "PHASE", chapter = 3)
        chance.value = 0.0

        win(token, miniboss3, chapter = 4).then().statusCode(409).body("code", equalTo("BOSS_NOT_AVAILABLE"))

        assertEquals(1, jpaCardCopyRepository.findAllByUsername("yan").size)
    }

    @Test
    fun `a win with a chapter that is not an integer of at least 1 answers 400`() {
        val token = register()
        progressAt(4, "PHASE", chapter = 3)

        listOf<Any>(0, "\"2\"", 2.5).forEach { chapter ->
            win(token, miniboss3, chapter = chapter)
                .then()
                .statusCode(400)
                .body("detail", equalTo("chapter must be an integer of at least 1"))
        }
    }

    @Test
    fun `a win with a chapter below 1 drops no card`() {
        val token = register()
        progressAt(4, "PHASE", chapter = 3)
        chance.value = 0.0

        win(token, miniboss3, chapter = 0).then().statusCode(400)

        assertEquals(1, jpaCardCopyRepository.findAllByUsername("yan").size)
    }

    @Test
    fun `a farm win of an earlier chapter boss pays no talent points and keeps the campaign`() {
        val token = register()
        progressAt(4, "PHASE", chapter = 3)
        chance.value = 0.0

        win(token, chapterBoss, chapter = 2).then().statusCode(200)

        assertEquals(0, talentRepository.earnedPoints("yan"))
        val stored = jpaProgressRepository.findById("yan").get()
        assertEquals(listOf(3, 4, "PHASE", false), listOf(stored.chapter, stored.stage, stored.encounter, stored.completed))
    }

    @Test
    fun `a win with a null chapter fights the current chapter`() {
        val token = register()
        progressAt(4, "PHASE", chapter = 3)
        chance.value = 0.0

        asUser(token)
            .contentType(ContentType.JSON)
            .body("""{"boss":$miniboss3,"outcome":"CLEARED","chapter":null}""")
            .post("/farm/outcome")
            .then()
            .statusCode(200)
            .body("drop.heroId", equalTo("orina"))
    }
}
