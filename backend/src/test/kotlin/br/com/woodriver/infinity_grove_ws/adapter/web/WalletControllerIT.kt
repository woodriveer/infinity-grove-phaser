package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.UserEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.WalletEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.WalletLevelEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.Response
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.contains
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.everyItem
import org.hamcrest.Matchers.greaterThanOrEqualTo
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.lessThanOrEqualTo
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class WalletControllerIT : IntegrationTestBase() {
    private fun user(name: String = "yan") = jpaUserRepository.save(UserEntity(name, "hash", 1L, 1L))

    private fun asUser(name: String = "yan"): RequestSpecification = given().header("Authorization", bearerToken(name))

    private fun getWallet(name: String = "yan"): Response = asUser(name).get("/wallet")

    private fun sync(
        body: String,
        name: String = "yan",
    ): Response = asUser(name).contentType(ContentType.JSON).body(body).post("/wallet/sync")

    private fun drops(response: Response): List<Int> = response.path("drops.1")

    @Test
    fun `GET wallet creates a zero wallet with 20 drops of 1 to 5 copper for level 1 only`() {
        user()

        getWallet()
            .then()
            .statusCode(200)
            .body("wallet.gold", equalTo(0))
            .body("wallet.silver", equalTo(0))
            .body("wallet.copper", equalTo(0))
            .body("drops.keySet()", contains("1"))
            .body("drops.1", hasSize<Int>(20))
            .body("drops.1", everyItem(greaterThanOrEqualTo(1)))
            .body("drops.1", everyItem(lessThanOrEqualTo(5)))
    }

    @Test
    fun `GET wallet lists only the levels of the drop table, not stored levels the table lacks`() {
        user()
        getWallet()
        jpaWalletLevelRepository.save(WalletLevelEntity("yan/9", "yan", 9, "1,2,3", 20, 0))

        getWallet().then().statusCode(200).body("drops.keySet()", contains("1"))
        sync("""{"kills":{"1":1}}""").then().statusCode(200).body("drops.keySet()", contains("1"))
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

        sync("""{"kills":{"1":3,"9":1}}""").then().statusCode(400).body("code", equalTo("WALLET_UNKNOWN_DROP_RULE"))
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
