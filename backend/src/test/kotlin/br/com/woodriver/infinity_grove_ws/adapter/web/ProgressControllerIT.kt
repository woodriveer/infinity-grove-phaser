package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.CardCopyEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.PlayerCardsEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.ProgressEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.UserEntity
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.HeroSeed
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.Response
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.nullValue
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse

class ProgressControllerIT : IntegrationTestBase() {
    private fun user(name: String = "yan") = jpaUserRepository.save(UserEntity(name, "hash", 1L, 1L))

    private fun asUser(name: String = "yan"): RequestSpecification = given().header("Authorization", bearerToken(name))

    private fun getProgress(name: String = "yan"): Response = asUser(name).get("/progress")

    private fun body(
        stage: Int,
        encounter: String,
        phase: Int,
        outcome: String,
        chapter: Int = 1,
    ) = """{"chapter":$chapter,"stage":$stage,"encounter":"$encounter","phase":$phase,"outcome":"$outcome"}"""

    private fun report(
        json: String,
        name: String = "yan",
    ): Response = asUser(name).contentType(ContentType.JSON).body(json).post("/progress/outcome")

    private fun store(
        stage: Int,
        encounter: String,
        phase: Int,
        completed: Boolean = false,
        name: String = "yan",
    ) = jpaProgressRepository.save(ProgressEntity(name, 1, stage, encounter, phase, completed))

    private fun position(response: Response) =
        listOf(
            response.path<Int>("stage"),
            response.path<String>("encounter"),
            response.path<Int>("phase"),
            response.path<Boolean>("completed"),
        )

    @Test
    fun `GET progress creates stage 1 phase 1 with the whole chapter definition`() {
        user()

        getProgress()
            .then()
            .statusCode(200)
            .body("chapter", equalTo(1))
            .body("stage", equalTo(1))
            .body("encounter", equalTo("PHASE"))
            .body("phase", equalTo(1))
            .body("completed", equalTo(false))
            .body("definition.bossHealth", equalTo(300))
            .body("definition.bossTimeLimitMs", equalTo(60_000))
            .body("definition.stages", hasSize<Int>(10))
            .body("definition.stages[0].number", equalTo(1))
            .body("definition.stages[0].phasesPerStage", equalTo(5))
            .body("definition.stages[0].monsterHealth", equalTo(10))
            .body("definition.stages[0].minibossHealth", equalTo(50))
            .body("definition.stages[0].minibossTimeLimitMs", equalTo(30_000))
            .body("definition.stages[9].number", equalTo(10))
            .body("definition.stages[9].monsterHealth", equalTo(19))
            .body("definition.stages[9].minibossHealth", equalTo(95))
    }

    @Test
    fun `GET progress carries the enemy stats of the phase monster, the miniboss and the chapter boss`() {
        user()

        getProgress()
            .then()
            .statusCode(200)
            .body("definition.boss.element", equalTo("DARKNESS"))
            .body("definition.boss.physicalDefense", equalTo(30))
            .body("definition.boss.magicalDefense", equalTo(30))
            .body("definition.boss.critResistance", equalTo(30))
            .body("definition.stages[0].monster.element", equalTo("FIRE"))
            .body("definition.stages[0].monster.physicalDefense", equalTo(0))
            .body("definition.stages[0].monster.magicalDefense", equalTo(0))
            .body("definition.stages[0].monster.critResistance", equalTo(0))
            .body("definition.stages[0].miniboss.element", equalTo("FIRE"))
            .body("definition.stages[0].miniboss.physicalDefense", equalTo(11))
            .body("definition.stages[0].miniboss.magicalDefense", equalTo(11))
            .body("definition.stages[0].miniboss.critResistance", equalTo(12))
            .body("definition.stages[4].monster.element", equalTo("DARKNESS"))
            .body("definition.stages[9].miniboss.critResistance", equalTo(30))
    }

    @Test
    fun `GET progress fails with 400 when a stored element is not one of the five`() {
        user()
        val stage = jpaStageRepository.findById("1/1").get()
        val original = stage.monsterElement
        jpaStageRepository.save(stage.apply { monsterElement = "PLASMA" })

        try {
            getProgress().then().statusCode(400)
        } finally {
            jpaStageRepository.save(stage.apply { monsterElement = original })
        }
    }

    @Test
    fun `GET progress twice returns the same position`() {
        user()

        assertEquals(position(getProgress()), position(getProgress()))
    }

    @Test
    fun `GET progress for a valid token whose user does not exist is 404 and creates no row`() {
        getProgress("ghost").then().statusCode(404).body("code", equalTo("USER_NOT_FOUND"))

        assertEquals(0, jpaProgressRepository.count())
    }

    @Test
    fun `clearing every encounter walks 10 stages of 5 phases, 10 minibosses and the chapter boss to completion`() {
        user()
        var current = getProgress()
        var clears = 0

        while (!current.path<Boolean>("completed")) {
            current =
                report(body(current.path("stage"), current.path("encounter"), current.path("phase"), "CLEARED"))
                    .then()
                    .statusCode(200)
                    .extract()
                    .response()
            clears++
            if (clears == 5) assertEquals(listOf(1, "MINIBOSS", 1, false), position(current))
            if (clears == 6) assertEquals(listOf(2, "PHASE", 1, false), position(current))
            if (clears == 60) assertEquals(listOf(10, "CHAPTER_BOSS", 1, false), position(current))
        }

        assertEquals(61, clears)
        assertEquals(listOf(10, "CHAPTER_BOSS", 1, true), position(current))
    }

    @Test
    fun `clearing the last phase of a stage moves to its miniboss and clearing that moves to the next stage`() {
        user()
        store(4, "PHASE", 5)

        report(body(4, "PHASE", 5, "CLEARED"))
            .then()
            .statusCode(200)
            .body("encounter", equalTo("MINIBOSS"))
            .body("stage", equalTo(4))
        report(body(4, "MINIBOSS", 1, "CLEARED"))
            .then()
            .statusCode(200)
            .body("stage", equalTo(5))
            .body("encounter", equalTo("PHASE"))
            .body("phase", equalTo(1))
    }

    @Test
    fun `failing a miniboss returns to phase 5 of the same stage and the answer carries the definition`() {
        user()
        store(3, "MINIBOSS", 1)

        report(body(3, "MINIBOSS", 1, "FAILED"))
            .then()
            .statusCode(200)
            .body("stage", equalTo(3))
            .body("encounter", equalTo("PHASE"))
            .body("phase", equalTo(5))
            .body("definition.stages", hasSize<Int>(10))
    }

    @Test
    fun `failing the chapter boss returns to phase 5 of stage 10`() {
        user()
        store(10, "CHAPTER_BOSS", 1)

        report(body(10, "CHAPTER_BOSS", 1, "FAILED"))
            .then()
            .statusCode(200)
            .body("stage", equalTo(10))
            .body("encounter", equalTo("PHASE"))
            .body("phase", equalTo(5))
            .body("completed", equalTo(false))
    }

    @Test
    fun `a report from a position that is not the stored one is 409 with the stored progress and changes nothing`() {
        user()
        store(2, "PHASE", 3)

        report(body(2, "PHASE", 2, "CLEARED"))
            .then()
            .statusCode(409)
            .body("code", equalTo("PROGRESS_CONFLICT"))
            .body("progress.stage", equalTo(2))
            .body("progress.encounter", equalTo("PHASE"))
            .body("progress.phase", equalTo(3))
            .body("progress.definition.stages", hasSize<Int>(10))

        val stored = jpaProgressRepository.findById("yan").get()
        assertEquals(listOf(2, "PHASE", 3), listOf(stored.stage, stored.encounter, stored.phase))
    }

    @Test
    fun `a report naming another chapter is 409`() {
        user()
        store(1, "PHASE", 1)

        report(body(1, "PHASE", 1, "CLEARED", chapter = 2)).then().statusCode(409).body("code", equalTo("PROGRESS_CONFLICT"))
    }

    @Test
    fun `FAILED while on a phase is 409 and changes nothing`() {
        user()
        store(2, "PHASE", 4)

        report(body(2, "PHASE", 4, "FAILED")).then().statusCode(409).body("progress.phase", equalTo(4))

        assertEquals(4, jpaProgressRepository.findById("yan").get().phase)
    }

    @Test
    fun `every report on a completed progress is 409 and the progress stays completed`() {
        user()
        store(10, "CHAPTER_BOSS", 1, completed = true)

        listOf("CLEARED", "FAILED").forEach { outcome ->
            report(body(10, "CHAPTER_BOSS", 1, outcome))
                .then()
                .statusCode(409)
                .body("code", equalTo("PROGRESS_CONFLICT"))
                .body("progress.completed", equalTo(true))
        }
        assertEquals(true, jpaProgressRepository.findById("yan").get().completed)
    }

    @Test
    fun `a malformed outcome body is 400 PROGRESS_INVALID_OUTCOME and changes nothing`() {
        user()
        store(1, "PHASE", 1)

        listOf(
            """{}""",
            """{"chapter":1,"stage":1,"encounter":"PHASE","phase":1}""",
            """{"chapter":1,"stage":1,"encounter":"PHASE","phase":1,"outcome":"WON"}""",
            """{"chapter":1,"stage":1,"encounter":"BOSS","phase":1,"outcome":"CLEARED"}""",
            """{"chapter":"1","stage":1,"encounter":"PHASE","phase":1,"outcome":"CLEARED"}""",
            """{"chapter":1,"stage":1,"encounter":"PHASE","phase":0,"outcome":"CLEARED"}""",
            """{"chapter":1,"stage":-1,"encounter":"PHASE","phase":1,"outcome":"CLEARED"}""",
        ).forEach { json ->
            report(json).then().statusCode(400).body("code", equalTo("PROGRESS_INVALID_OUTCOME"))
        }
        assertEquals(1, jpaProgressRepository.findById("yan").get().phase)
    }

    @Test
    fun `both routes are 401 without a token and with a bad token`() {
        given().get("/progress").then().statusCode(401)
        given()
            .contentType(ContentType.JSON)
            .body(body(1, "PHASE", 1, "CLEARED"))
            .post("/progress/outcome")
            .then()
            .statusCode(401)
        given()
            .header("Authorization", "Bearer not-a-token")
            .get("/progress")
            .then()
            .statusCode(401)
    }

    @Test
    fun `a player only reads and writes their own progress`() {
        user("yan")
        user("ana")
        getProgress("ana")

        report(body(1, "PHASE", 1, "CLEARED"), "yan").then().statusCode(200)

        getProgress("ana").then().statusCode(200).body("phase", equalTo(1))
        getProgress("yan").then().statusCode(200).body("phase", equalTo(2))
    }

    @Test
    fun `two simultaneous identical reports give exactly one 200 and one 409`() {
        user()
        getProgress()
        val pool = Executors.newFixedThreadPool(2)
        val start = CountDownLatch(1)

        val calls =
            (1..2).map {
                pool.submit<Int> {
                    start.await(5, TimeUnit.SECONDS)
                    report(body(1, "PHASE", 1, "CLEARED")).statusCode()
                }
            }
        start.countDown()
        val statuses = calls.map { it.get(15, TimeUnit.SECONDS) }.sorted()
        pool.shutdown()

        assertEquals(listOf(200, 409), statuses)
        assertEquals(2, jpaProgressRepository.findById("yan").get().phase)
    }

    @Test
    fun `deleting a user deletes that user's progress`() {
        user("yan")
        user("ana")
        getProgress("yan")
        getProgress("ana")

        asUser("yan").delete("/users/yan").then().statusCode(204)

        assertFalse(jpaProgressRepository.existsById("yan"))
        assertEquals(true, jpaProgressRepository.existsById("ana"))
    }

    /** The cards a registered player holds: one blank card of the starting hero. */
    private fun cards(
        name: String = "yan",
        start: Element = Element.FIRE,
    ) {
        val started = PlayerCards.start(name, start, HeroSeed.heroes())
        jpaPlayerCardsRepository.save(PlayerCardsEntity.from(started))
        started.copies.forEach { (key, count) -> jpaCardCopyRepository.save(CardCopyEntity.from(name, key, count)) }
    }

    @Test
    fun `POST outcome answers the dropped card when a miniboss win rolls one`() {
        user()
        cards()
        store(1, "MINIBOSS", 1)
        chance.value = 0.0

        report(body(1, "MINIBOSS", 1, "CLEARED"))
            .then()
            .statusCode(200)
            .body("drop.heroId", equalTo("kael"))
            .body("drop.heroName", equalTo("Kael Raizférrea"))
            .body("drop.stars", equalTo(0))

        assertEquals(2, jpaCardCopyRepository.findAllByUsername("yan").single { it.stars == 0 }.copies)
    }

    @Test
    fun `POST outcome has no drop when the roll misses and GET progress never has one`() {
        user()
        cards()
        store(1, "MINIBOSS", 1)

        report(body(1, "MINIBOSS", 1, "CLEARED")).then().statusCode(200).body("drop", nullValue())
        getProgress().then().statusCode(200).body("drop", nullValue())
    }

    @Test
    fun `a rejected report answers 409 and drops nothing even when the roll would hit`() {
        user()
        cards()
        store(1, "MINIBOSS", 1)
        chance.value = 0.0

        report(body(1, "PHASE", 1, "CLEARED")).then().statusCode(409)

        assertEquals(1, jpaCardCopyRepository.findAllByUsername("yan").single { it.stars == 0 }.copies)
    }

    @Test
    fun `the first chapter boss win drops the next chapter hero whatever the roll`() {
        user()
        cards()
        store(10, "CHAPTER_BOSS", 1)

        report(body(10, "CHAPTER_BOSS", 1, "CLEARED"))
            .then()
            .statusCode(200)
            .body("drop.heroId", equalTo("lyra"))
            .body("completed", equalTo(true))
    }
}
