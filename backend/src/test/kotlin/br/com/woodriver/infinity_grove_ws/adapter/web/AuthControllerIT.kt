package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.RefreshTokenEntity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.Response
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.not
import org.junit.jupiter.api.Test
import java.security.MessageDigest
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class AuthControllerIT : IntegrationTestBase() {
    private fun post(
        path: String,
        body: String,
    ) = given().contentType(ContentType.JSON).body(body).post(path)

    private fun signUp(username: String = "yan"): Response =
        post("/users", """{"username":"$username","password":"password123"}""")
            .then()
            .statusCode(201)
            .extract()
            .response()

    private fun refresh(token: String) = post("/auth/refresh", """{"refreshToken":"$token"}""")

    private fun logout(token: String) = post("/auth/logout", """{"refreshToken":"$token"}""")

    private fun sha256Hex(raw: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(raw.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }

    private fun assertInvalidRefreshToken(response: Response) {
        response
            .then()
            .statusCode(401)
            .body("code", equalTo("AUTH_INVALID_REFRESH_TOKEN"))
            .body("detail", not(equalTo("")))
    }

    @Test
    fun `refresh with a valid token returns new tokens and the old token then fails with 401`() {
        val first = signUp()
        val oldToken = first.path<String>("refreshToken")

        val second =
            refresh(oldToken)
                .then()
                .statusCode(200)
                .body("user.username", equalTo("yan"))
                .extract()
                .response()

        assertTrue(second.path<String>("accessToken").isNotBlank())
        assertNotEquals(oldToken, second.path<String>("refreshToken"))
        assertTrue(second.path<Long>("refreshTokenExpiresAt") > 0)
        assertInvalidRefreshToken(refresh(oldToken))
        refresh(second.path("refreshToken")).then().statusCode(200)
    }

    @Test
    fun `refresh with an unknown token returns 401`() {
        assertInvalidRefreshToken(refresh("does-not-exist"))
    }

    @Test
    fun `refresh with an expired token returns 401`() {
        signUp()
        val raw = "expired-raw-token"
        jpaRefreshTokenRepository.save(RefreshTokenEntity(sha256Hex(raw), "yan", System.currentTimeMillis() - 1_000, false))

        assertInvalidRefreshToken(refresh(raw))
    }

    @Test
    fun `refresh with a revoked token returns 401`() {
        val raw = signUp().path<String>("refreshToken")
        val row = jpaRefreshTokenRepository.findById(sha256Hex(raw)).get()
        row.revoked = true
        jpaRefreshTokenRepository.save(row)

        assertInvalidRefreshToken(refresh(raw))
    }

    @Test
    fun `refresh for a deleted user returns 401`() {
        val raw = signUp().path<String>("refreshToken")
        jpaUserRepository.deleteById("yan")

        assertInvalidRefreshToken(refresh(raw))
    }

    @Test
    fun `deleting a user through the API invalidates their refresh token`() {
        val raw = signUp().path<String>("refreshToken")

        given().delete("/users/yan").then().statusCode(204)

        assertInvalidRefreshToken(refresh(raw))
        assertEquals(0, jpaRefreshTokenRepository.count())
    }

    @Test
    fun `changing the password revokes existing refresh tokens`() {
        val raw = signUp().path<String>("refreshToken")

        given()
            .contentType(ContentType.JSON)
            .body("""{"password":"newpassword1"}""")
            .put("/users/yan/password")
            .then()
            .statusCode(200)

        assertInvalidRefreshToken(refresh(raw))
    }

    @Test
    fun `refresh with a blank refreshToken returns 400`() {
        post("/auth/refresh", """{"refreshToken":"   "}""").then().statusCode(400)
        post("/auth/refresh", """{"refreshToken":""}""").then().statusCode(400)
    }

    @Test
    fun `refresh with a missing or null refreshToken returns 400`() {
        post("/auth/refresh", "{}").then().statusCode(400)
        post("/auth/refresh", """{"refreshToken":null}""").then().statusCode(400)
        post("/auth/refresh", "").then().statusCode(400)
    }

    @Test
    fun `logout returns 204 and the token no longer refreshes`() {
        val raw = signUp().path<String>("refreshToken")

        logout(raw).then().statusCode(204)

        assertInvalidRefreshToken(refresh(raw))
    }

    @Test
    fun `logout with an unknown or already revoked token still returns 204`() {
        val raw = signUp().path<String>("refreshToken")

        logout("does-not-exist").then().statusCode(204)
        logout(raw).then().statusCode(204)
        logout(raw).then().statusCode(204)
    }

    @Test
    fun `logout with a blank or missing refreshToken returns 400`() {
        post("/auth/logout", """{"refreshToken":""}""").then().statusCode(400)
        post("/auth/logout", "{}").then().statusCode(400)
    }

    @Test
    fun `logout only revokes the given token`() {
        val first = signUp().path<String>("refreshToken")
        val second =
            post("/users/login", """{"username":"yan","password":"password123"}""")
                .path<String>("refreshToken")

        logout(first).then().statusCode(204)

        assertInvalidRefreshToken(refresh(first))
        refresh(second).then().statusCode(200)
    }
}
