package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.UserEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.Response
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.lessThanOrEqualTo
import org.junit.jupiter.api.Test
import java.util.concurrent.Callable
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.test.assertEquals

class WalletFlowIT : IntegrationTestBase() {
    private fun sync(
        body: String,
        token: String = bearerToken("yan"),
    ): Response =
        given()
            .header("Authorization", token)
            .contentType(ContentType.JSON)
            .body(body)
            .post("/wallet/sync")

    private fun getWallet(token: String = bearerToken("yan")): Response = given().header("Authorization", token).get("/wallet")

    @Test
    fun `parallel syncs credit each queued value at most once`() {
        jpaUserRepository.save(UserEntity("yan", "hash", 1L, 1L))
        val before = getWallet().path<List<Int>>("drops.1")
        val start = CountDownLatch(1)
        val pool = Executors.newFixedThreadPool(6)

        val calls =
            List(6) {
                pool.submit(
                    Callable {
                        start.await(5, TimeUnit.SECONDS)
                        sync("""{"kills":{"1":20}}""").path<Int>("accepted.1")
                    },
                )
            }
        start.countDown()
        val accepted = calls.map { it.get(20, TimeUnit.SECONDS) }
        pool.shutdown()

        assertEquals(20, accepted.sum())
        getWallet().then().body("wallet.copper", equalTo(before.sum()))
    }

    @Test
    fun `an immediate second batch is accepted only up to what the allowance regained`() {
        jpaUserRepository.save(UserEntity("yan", "hash", 1L, 1L))
        getWallet()

        sync("""{"kills":{"1":500}}""").then().statusCode(200).body("accepted.1", equalTo(20))
        sync("""{"kills":{"1":500}}""").then().statusCode(200).body("accepted.1", lessThanOrEqualTo(1))
    }

    @Test
    fun `a user that existed before the wallet feature gets a wallet on the first GET`() {
        jpaUserRepository.save(UserEntity("yan", "hash", 1L, 1L))
        assertEquals(0, jpaWalletRepository.count())

        getWallet().then().statusCode(200).body("wallet.copper", equalTo(0))

        assertEquals(1, jpaWalletRepository.count())
        assertEquals(1, jpaWalletLevelRepository.count())
    }

    @Test
    fun `deleting a user deletes their wallet and level rows`() {
        val created =
            given()
                .contentType(ContentType.JSON)
                .body("""{"username":"yan","password":"password123","startingElement":"FIRE"}""")
                .post("/users")
                .then()
                .statusCode(201)
                .extract()
                .path<String>("accessToken")
        val token = "Bearer $created"
        getWallet(token).then().statusCode(200)
        assertEquals(1, jpaWalletRepository.count())

        given()
            .header("Authorization", token)
            .delete("/users/yan")
            .then()
            .statusCode(204)

        assertEquals(0, jpaWalletRepository.count())
        assertEquals(0, jpaWalletLevelRepository.count())
    }
}
