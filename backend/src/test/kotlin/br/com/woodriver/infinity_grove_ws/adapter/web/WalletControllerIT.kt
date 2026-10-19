package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.UserEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.WalletDropQueueEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.WalletEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.Response
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.containsInAnyOrder
import org.hamcrest.Matchers.equalTo
import org.junit.jupiter.api.Test
import org.springframework.dao.DataIntegrityViolationException
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class WalletControllerIT : IntegrationTestBase() {
    private fun user(name: String = "yan") = jpaUserRepository.save(UserEntity(name, "hash", 1L, 1L))

    private fun asUser(name: String = "yan"): RequestSpecification = given().header("Authorization", bearerToken(name))

    private fun getWallet(name: String = "yan"): Response = asUser(name).get("/wallet")

    private fun sync(
        body: String,
        name: String = "yan",
    ): Response = asUser(name).contentType(ContentType.JSON).body(body).post("/wallet/sync")

    private fun drops(response: Response): List<Int> = response.path("drops.1")

    private val seedRuleIds = (1..15).map(Int::toString)

    /** The seed range of drop rule [id]: chapter c owns 3c-2 (c..5c), 3c-1 (5c..15c) and 3c (20c..50c). */
    private fun seedRange(id: Int): IntRange {
        val chapter = (id + 2) / 3
        return when (id - 3 * (chapter - 1)) {
            1 -> chapter..5 * chapter
            2 -> 5 * chapter..15 * chapter
            else -> 20 * chapter..50 * chapter
        }
    }

    @Test
    fun `GET wallet creates a zero wallet with one queue of 20 drops per seeded drop rule inside its range`() {
        user()

        val response = getWallet()

        response
            .then()
            .statusCode(200)
            .body("wallet.gold", equalTo(0))
            .body("wallet.silver", equalTo(0))
            .body("wallet.copper", equalTo(0))
            .body("drops.keySet()", containsInAnyOrder(*seedRuleIds.toTypedArray()))
        (1..15).forEach { id ->
            val queue: List<Int> = response.path("drops.$id")
            assertEquals(20, queue.size, "rule $id")
            assertTrue(queue.all { it in seedRange(id) }, "rule $id queue $queue is inside ${seedRange(id)}")
        }
    }

    @Test
    fun `GET wallet lists only the rules of drop_rules, and a queue of a rule the table lacks cannot be stored`() {
        user()
        getWallet()

        assertFailsWith<DataIntegrityViolationException> {
            jpaWalletDropQueueRepository.save(WalletDropQueueEntity("yan/99", "yan", 99, "1,2,3", 20, 0))
        }

        getWallet().then().statusCode(200).body("drops.keySet()", containsInAnyOrder(*seedRuleIds.toTypedArray()))
        sync("""{"kills":{"1":1}}""")
            .then()
            .statusCode(200)
            .body("drops.keySet()", containsInAnyOrder(*seedRuleIds.toTypedArray()))
    }

    @Test
    fun `POST sync credits kills of the miniboss rule 2 from its 5 to 15 copper queue`() {
        user()
        val before: List<Int> = getWallet().path("drops.2")

        val response = sync("""{"kills":{"2":2}}""")

        response
            .then()
            .statusCode(200)
            .body("accepted.2", equalTo(2))
            .body("wallet.copper", equalTo(before.take(2).sum()))
        assertTrue(before.take(2).all { it in 5..15 }, "credited values ${before.take(2)} are inside 5..15")
        assertEquals(before.drop(2), response.path<List<Int>>("drops.2").take(18))
    }

    @Test
    fun `GET wallet twice returns the same drops in the same order`() {
        user()

        assertEquals(drops(getWallet()), drops(getWallet()))
    }

    @Test
    fun `GET wallet derives gold silver and copper from the stored total`() {
        user()
        getWallet()
        jpaWalletRepository.save(WalletEntity("yan", 12_345_678))

        getWallet()
            .then()
            .statusCode(200)
            .body("wallet.gold", equalTo(1234))
            .body("wallet.silver", equalTo(56))
            .body("wallet.copper", equalTo(78))
    }

    @Test
    fun `wallet routes return 401 AUTH_UNAUTHENTICATED without a token`() {
        given()
            .get("/wallet")
            .then()
            .statusCode(401)
            .body("code", equalTo("AUTH_UNAUTHENTICATED"))
        given()
            .contentType(ContentType.JSON)
            .body("""{"kills":{"1":1}}""")
            .post("/wallet/sync")
            .then()
            .statusCode(401)
            .body("code", equalTo("AUTH_UNAUTHENTICATED"))
    }

    @Test
    fun `wallet routes return 404 USER_NOT_FOUND and create no wallet when the token's user is gone`() {
        getWallet("ghost").then().statusCode(404).body("code", equalTo("USER_NOT_FOUND"))
        sync("""{"kills":{"1":1}}""", "ghost").then().statusCode(404).body("code", equalTo("USER_NOT_FOUND"))

        assertEquals(0, jpaWalletRepository.count())
    }

    @Test
    fun `POST sync credits the first queued values and moves the queue up`() {
        user()
        val before = drops(getWallet())

        val response = sync("""{"kills":{"1":3}}""")

        response
            .then()
            .statusCode(200)
            .body("accepted.1", equalTo(3))
            .body("wallet.copper", equalTo(before.take(3).sum()))
        val after = drops(response)
        assertEquals(20, after.size)
        assertEquals(before.drop(3), after.take(17))
    }

    @Test
    fun `POST sync result is what a later GET returns`() {
        user()
        getWallet()
        val synced = sync("""{"kills":{"1":4}}""")

        val read = getWallet()

        assertEquals(drops(synced), drops(read))
        assertEquals(synced.path<Int>("wallet.copper"), read.path<Int>("wallet.copper"))
    }

    @Test
    fun `POST sync discards kills above the allowance`() {
        user()

        sync("""{"kills":{"1":500}}""").then().statusCode(200).body("accepted.1", equalTo(20))
    }

    @Test
    fun `POST sync with zero kills or no levels changes nothing`() {
        user()
        val before = getWallet()

        sync("""{"kills":{"1":0}}""")
            .then()
            .statusCode(200)
            .body("accepted.1", equalTo(0))
            .body("wallet.copper", equalTo(0))
        sync("""{"kills":{}}""").then().statusCode(200).body("accepted.size()", equalTo(0))

        assertEquals(drops(before), drops(getWallet()))
    }

    @Test
    fun `POST sync returns 400 WALLET_INVALID_KILLS and changes nothing for a malformed kills value`() {
        user()
        val before = drops(getWallet())
        val bodies =
            listOf(
                """{}""",
                """{"kills":null}""",
                """{"kills":5}""",
                """{"kills":[1]}""",
                """{"kills":{"1":-1}}""",
                """{"kills":{"1":1.5}}""",
                """{"kills":{"1":"3"}}""",
                """{"kills":{"1":null}}""",
            )

        bodies.forEach { body ->
            sync(body).then().statusCode(400).body("code", equalTo("WALLET_INVALID_KILLS"))
        }

        val after = getWallet()
        after.then().body("wallet.copper", equalTo(0))
        assertEquals(before, drops(after))
    }

    @Test
    fun `POST sync returns 400 WALLET_UNKNOWN_DROP_RULE and credits nothing, not even the valid rule`() {
        user()
        val before = drops(getWallet())

        sync("""{"kills":{"1":3,"99":1}}""").then().statusCode(400).body("code", equalTo("WALLET_UNKNOWN_DROP_RULE"))
        sync("""{"kills":{"abc":1}}""").then().statusCode(400).body("code", equalTo("WALLET_UNKNOWN_DROP_RULE"))

        val after = getWallet()
        after.then().body("wallet.copper", equalTo(0))
        assertEquals(before, drops(after))
    }

    @Test
    fun `a token only reads and changes the wallet of its own subject`() {
        user("yan")
        user("ana")
        getWallet("ana")

        sync("""{"kills":{"1":5}}""", "yan").then().statusCode(200)

        getWallet("ana").then().body("wallet.copper", equalTo(0))
        assertEquals(2, jpaWalletRepository.count())
    }
}
