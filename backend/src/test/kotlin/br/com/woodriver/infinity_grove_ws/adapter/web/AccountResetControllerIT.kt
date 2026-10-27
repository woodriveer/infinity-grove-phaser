package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.AutoClickRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.CrystalRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.EquipmentRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.ProgressEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.ResetRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.TalentRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.WalletEntity
import br.com.woodriver.infinity_grove_ws.domain.Affix
import br.com.woodriver.infinity_grove_ws.domain.AffixType
import br.com.woodriver.infinity_grove_ws.domain.Piece
import br.com.woodriver.infinity_grove_ws.domain.Rarity
import br.com.woodriver.infinity_grove_ws.domain.Slot
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.ValidatableResponse
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.equalTo
import org.springframework.beans.factory.annotation.Autowired
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals

class AccountResetControllerIT : IntegrationTestBase() {
    @Autowired
    private lateinit var autoClickRepository: AutoClickRepository

    @Autowired
    private lateinit var crystalRepository: CrystalRepository

    @Autowired
    private lateinit var resetRepository: ResetRepository

    @Autowired
    private lateinit var talentRepository: TalentRepository

    @Autowired
    private lateinit var equipmentRepository: EquipmentRepository

    private lateinit var token: String

    private fun asUser(): RequestSpecification = given().header("Authorization", token)

    @BeforeTest
    fun registerPlayer() {
        token =
            "Bearer " +
            given()
                .contentType(ContentType.JSON)
                .body("""{"username":"yan","password":"password123","startingElement":"FIRE"}""")
                .post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path<String>("accessToken")
    }

    private fun atChapter(
        chapter: Int,
        completed: Boolean = false,
    ) = jpaProgressRepository.save(ProgressEntity("yan", chapter, 2, "MINIBOSS", 1, completed))

    private fun reset(fromChapter: Any?): ValidatableResponse =
        asUser()
            .contentType(ContentType.JSON)
            .body(mapOf("fromChapter" to fromChapter))
            .post("/account/reset")
            .then()

    private fun progress() = jpaProgressRepository.findById("yan").get()

    /** Chapter 3, 4 crystals, auto click level 1, 2 levels of one talent paid by 2 points, 900 copper and one piece of equipment. */
    private fun seededPlayer() {
        atChapter(3)
        crystalRepository.save("yan", 4)
        autoClickRepository.save("yan", 1)
        talentRepository.award("yan", "test:2", 2)
        talentRepository.save("yan", "CLICK_DAMAGE", 2)
        jpaWalletRepository.save(WalletEntity("yan", 900))
        equipmentRepository.save(Piece("p1", "yan", Slot.RING, Rarity.COMMON, null, 0, listOf(Affix(AffixType.CLICK_DAMAGE_PCT, 7))))
    }

    @Test
    fun `a reset from chapter 3 pays 3 crystals and answers the campaign back at chapter 1 stage 1`() {
        seededPlayer()

        reset(3)
            .statusCode(200)
            .body("reward", equalTo(3))
            .body("crystals", equalTo(7))
            .body("resets", equalTo(1))
            .body("progress.chapter", equalTo(1))
            .body("progress.stage", equalTo(1))
            .body("progress.encounter", equalTo("PHASE"))
            .body("progress.phase", equalTo(1))
            .body("progress.completed", equalTo(false))

        asUser()
            .get("/progress")
            .then()
            .statusCode(200)
            .body("chapter", equalTo(1))
            .body("stage", equalTo(1))
    }

    @Test
    fun `a reset wipes every talent level and talent point`() {
        seededPlayer()

        reset(3).statusCode(200)

        asUser()
            .get("/talents")
            .then()
            .statusCode(200)
            .body("talents.level.sum()", equalTo(0))
            .body("points.earned", equalTo(0))
            .body("points.available", equalTo(0))
    }

    @Test
    fun `a reset keeps the coins, the equipment, the cards and the auto click level`() {
        seededPlayer()
        val heroes =
            asUser()
                .get("/heroes")
                .then()
                .statusCode(200)
                .extract()
                .asString()

        reset(3).statusCode(200)

        asUser()
            .get("/wallet")
            .then()
            .statusCode(200)
            // 900 copper are shown as 9 silver and 0 copper
            .body("wallet.gold", equalTo(0))
            .body("wallet.silver", equalTo(9))
            .body("wallet.copper", equalTo(0))
        asUser()
            .get("/equipment")
            .then()
            .statusCode(200)
            .body("pieces.id", equalTo(listOf("p1")))
        assertEquals(
            heroes,
            asUser()
                .get("/heroes")
                .then()
                .statusCode(200)
                .extract()
                .asString(),
        )
        asUser()
            .get("/auto-click")
            .then()
            .statusCode(200)
            .body("level", equalTo(1))
            .body("crystals", equalTo(7))
    }

    @Test
    fun `a completed campaign pays 5`() {
        atChapter(5, completed = true)

        reset(5).statusCode(200).body("reward", equalTo(5)).body("crystals", equalTo(5))
    }

    @Test
    fun `a reset in chapter 1 is 409 RESET_LOCKED and changes nothing`() {
        atChapter(1)
        crystalRepository.save("yan", 4)

        reset(1).statusCode(409).body("code", equalTo("RESET_LOCKED"))

        assertEquals(4L, crystalRepository.balance("yan"))
        assertEquals(0, resetRepository.count("yan"))
    }

    @Test
    fun `a reset from another chapter is 409 RESET_CHAPTER_MISMATCH with the stored progress and changes nothing`() {
        seededPlayer()

        reset(4)
            .statusCode(409)
            .body("code", equalTo("RESET_CHAPTER_MISMATCH"))
            .body("progress.chapter", equalTo(3))
            .body("progress.stage", equalTo(2))
            .body("progress.encounter", equalTo("MINIBOSS"))

        assertEquals(3, progress().chapter)
        assertEquals(4L, crystalRepository.balance("yan"))
        assertEquals(0, resetRepository.count("yan"))
        assertEquals(mapOf("CLICK_DAMAGE" to 2), talentRepository.findAll("yan"))
        assertEquals(2, talentRepository.earnedPoints("yan"))
    }

    @Test
    fun `a reset without an integer fromChapter is 400 INVALID_RESET_REQUEST`() {
        atChapter(3)

        reset(null).statusCode(400).body("code", equalTo("INVALID_RESET_REQUEST"))
        reset("3").statusCode(400).body("code", equalTo("INVALID_RESET_REQUEST"))

        assertEquals(3, progress().chapter)
    }

    @Test
    fun `a reset without a token is 401`() {
        given()
            .contentType(ContentType.JSON)
            .body(mapOf("fromChapter" to 3))
            .post("/account/reset")
            .then()
            .statusCode(401)
            .body("code", equalTo("AUTH_UNAUTHENTICATED"))
    }

    @Test
    fun `two racing resets from the same chapter apply exactly one`() {
        atChapter(3)
        val pool = Executors.newFixedThreadPool(2)

        val answers =
            try {
                List(2) { Callable { reset(3).extract().response() } }
                    .map(pool::submit)
                    .map { it.get() }
            } finally {
                pool.shutdown()
            }

        assertEquals(listOf(200, 409), answers.map { it.statusCode }.sorted())
        assertEquals("RESET_CHAPTER_MISMATCH", answers.single { it.statusCode == 409 }.path<String>("code"))
        assertEquals(3L, crystalRepository.balance("yan"))
        assertEquals(1, resetRepository.count("yan"))
    }

    @Test
    fun `the auto click answers the resets and opens in chapter 1 after a reset`() {
        atChapter(2)
        asUser()
            .get("/auto-click")
            .then()
            .statusCode(200)
            .body("resets", equalTo(0))
        crystalRepository.save("yan", 8)

        reset(2).statusCode(200).body("crystals", equalTo(10))

        asUser()
            .get("/auto-click")
            .then()
            .statusCode(200)
            .body("resets", equalTo(1))
        asUser()
            .contentType(ContentType.JSON)
            .body(mapOf("fromLevel" to 0))
            .post("/auto-click/upgrade")
            .then()
            .statusCode(200)
            .body("level", equalTo(1))
            .body("intervalMs", equalTo(250))
    }
}
