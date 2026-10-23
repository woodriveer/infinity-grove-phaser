package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.CardCopyEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.PlayerCardsEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.ProgressEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.TalentRepository
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
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataIntegrityViolationException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse

class ProgressControllerIT : IntegrationTestBase() {
    @Autowired
    private lateinit var talentRepository: TalentRepository

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
            .body("definition.bossHealth", equalTo(2000))
            .body("definition.bossTimeLimitMs", equalTo(60_000))
            .body("definition.stages", hasSize<Int>(10))
            .body("definition.stages[0].number", equalTo(1))
            .body("definition.stages[0].phasesPerStage", equalTo(5))
            .body("definition.stages[0].monsterHealth", equalTo(40))
            .body("definition.stages[0].minibossHealth", equalTo(200))
            .body("definition.stages[0].minibossTimeLimitMs", equalTo(30_000))
            .body("definition.stages[9].number", equalTo(10))
            .body("definition.stages[9].monsterHealth", equalTo(76))
            .body("definition.stages[9].minibossHealth", equalTo(380))
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
    fun `GET progress names the drop rule of every stage monster, every miniboss and the chapter boss`() {
        user()

        getProgress()
            .then()
            .statusCode(200)
            .body("definition.bossDropRuleId", equalTo(3))
            .body("definition.stages.monsterDropRuleId", equalTo(List(10) { 1 }))
            .body("definition.stages.minibossDropRuleId", equalTo(List(10) { 2 }))
    }

    @Test
    fun `an element that is not one of the five cannot be stored, so GET progress keeps answering the stored element`() {
        user()
        val enemy = jpaEnemyRepository.findById(jpaStageRepository.findById("1/1").get().monsterEnemyId).get()

        assertFailsWith<DataIntegrityViolationException> { jpaEnemyRepository.save(enemy.apply { element = "PLASMA" }) }

        getProgress().then().statusCode(200).body("definition.stages[0].monster.element", equalTo("FIRE"))
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
    fun `clearing every encounter walks 10 stages of 5 phases, 10 minibosses and the chapter boss into chapter 2`() {
        user()
        var current = getProgress()
        var clears = 0

        while (current.path<Int>("chapter") == 1) {
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
        assertEquals(2, current.path<Int>("chapter"))
        assertEquals(listOf(1, "PHASE", 1, false), position(current))
        assertEquals(8000, current.path<Int>("definition.bossHealth"))
    }

    @Test
    fun `a progress stored as completed in chapter 1 opens chapter 2 on GET`() {
        user()
        store(10, "CHAPTER_BOSS", 1, completed = true)

        getProgress()
            .then()
            .statusCode(200)
            .body("chapter", equalTo(2))
            .body("stage", equalTo(1))
            .body("encounter", equalTo("PHASE"))
            .body("completed", equalTo(false))
        assertEquals(2, jpaProgressRepository.findById("yan").get().chapter)
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
    fun `every report on the completed last chapter is 409 and the progress stays completed`() {
        user()
        jpaProgressRepository.save(ProgressEntity("yan", 5, 10, "CHAPTER_BOSS", 1, true))

        listOf("CLEARED", "FAILED").forEach { outcome ->
            report(body(10, "CHAPTER_BOSS", 1, outcome, chapter = 5))
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
            .body("chapter", equalTo(2))
            .body("completed", equalTo(false))
    }

    @Test
    fun `POST outcome answers the talent points of a first clear and nothing for a replay`() {
        user()
        cards()
        store(1, "MINIBOSS", 1)

        report(body(1, "MINIBOSS", 1, "CLEARED")).then().statusCode(200).body("talentPoints", equalTo(2))
        store(1, "MINIBOSS", 1)
        report(body(1, "MINIBOSS", 1, "CLEARED")).then().statusCode(200).body("talentPoints", equalTo(0))

        assertEquals(2, talentRepository.earnedPoints("yan"))
        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("points.earned", equalTo(2))
            .body("points.available", equalTo(2))
    }

    @Test
    fun `POST outcome pays nothing for a phase`() {
        user()
        cards()
        store(1, "PHASE", 5)

        report(body(1, "PHASE", 5, "CLEARED")).then().statusCode(200).body("talentPoints", equalTo(0))

        assertEquals(0, talentRepository.earnedPoints("yan"))
    }

    @Test
    fun `POST outcome pays 2 points for a miniboss and 5 for the chapter boss`() {
        user()
        cards()
        store(1, "MINIBOSS", 1)
        report(body(1, "MINIBOSS", 1, "CLEARED")).then().statusCode(200).body("talentPoints", equalTo(2))

        store(10, "CHAPTER_BOSS", 1)
        report(body(10, "CHAPTER_BOSS", 1, "CLEARED")).then().statusCode(200).body("talentPoints", equalTo(5))

        assertEquals(7, talentRepository.earnedPoints("yan"))
    }

    @Test
    fun `a failed or rejected report pays nothing and GET progress has no talent points`() {
        user()
        cards()
        store(1, "MINIBOSS", 1)

        report(body(1, "MINIBOSS", 1, "FAILED")).then().statusCode(200).body("talentPoints", equalTo(0))
        report(body(3, "PHASE", 1, "CLEARED")).then().statusCode(409)
        getProgress().then().statusCode(200).body("talentPoints", nullValue())

        assertEquals(0, talentRepository.earnedPoints("yan"))
    }
}
