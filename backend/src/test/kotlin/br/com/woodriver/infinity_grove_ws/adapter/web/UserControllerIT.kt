package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.not
import org.hamcrest.Matchers.nullValue
import org.junit.jupiter.api.Test
import java.security.MessageDigest
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class UserControllerIT : IntegrationTestBase() {
    private fun json(vararg fields: Pair<String, String>) =
        fields.joinToString(prefix = "{", postfix = "}") { "\"${it.first}\":\"${it.second}\"" }

    private fun request(body: String) = given().contentType(ContentType.JSON).body(body)

    private fun createUser(
        username: String = "yan",
        password: String = "password123",
        startingElement: String? = "FIRE",
    ) = request(
        json(
            *listOfNotNull("username" to username, "password" to password, startingElement?.let { "startingElement" to it }).toTypedArray(),
        ),
    ).post("/users")

    @Test
    fun `POST users creates user, hides password and stores a hash`() {
        createUser()
            .then()
            .statusCode(201)
            .body("user.username", equalTo("yan"))
            .body("user.password", nullValue())
            .body("password", nullValue())

        val stored = jpaUserRepository.findById("yan").get()
        assertNotEquals("password123", stored.password)
        assertTrue(stored.password.startsWith("\$2"), "expected a BCrypt hash")
    }

    @Test
    fun `POST users with water stores one blank Orina card as leader`() {
        createUser(startingElement = "WATER").then().statusCode(201)

        val cards = jpaPlayerCardsRepository.findById("yan").get()
        assertEquals("WATER", cards.startingElement)
        assertEquals("orina", cards.leaderId)
        val copies = jpaCardCopyRepository.findAllByUsername("yan")
        assertEquals(1, copies.size)
        assertEquals("orina", copies.single().heroId)
        assertEquals(0, copies.single().stars)
        assertEquals(1, copies.single().copies)
    }

    @Test
    fun `POST users with fire or nature gives Kael or Lyra`() {
        createUser("yan", startingElement = "FIRE").then().statusCode(201)
        createUser("ana", startingElement = "NATURE").then().statusCode(201)

        assertEquals("kael", jpaPlayerCardsRepository.findById("yan").get().leaderId)
        assertEquals("lyra", jpaPlayerCardsRepository.findById("ana").get().leaderId)
    }

    @Test
    fun `POST users returns 400 INVALID_STARTING_ELEMENT and creates no user for a missing or unknown element`() {
        listOf(null, "LIGHT", "DARKNESS", "plasma").forEach { element ->
            createUser(startingElement = element)
                .then()
                .statusCode(400)
                .body("code", equalTo("INVALID_STARTING_ELEMENT"))
        }

        assertEquals(0, jpaUserRepository.count())
        assertEquals(0, jpaPlayerCardsRepository.count())
        assertEquals(0, jpaCardCopyRepository.count())
    }

    @Test
    fun `POST users returns 409 when username already exists`() {
        createUser()

        createUser()
            .then()
            .statusCode(409)
            .body("code", equalTo("USER_ALREADY_EXISTS"))
    }

    @Test
    fun `POST users returns 400 for a short password`() {
        createUser(password = "short").then().statusCode(400)
    }

    @Test
    fun `GET users lists and gets users`() {
        createUser("yan")
        createUser("ana")

        authenticated()
            .get("/users")
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(2))
        authenticated()
            .get("/users/ana")
            .then()
            .statusCode(200)
            .body("username", equalTo("ana"))
    }

    @Test
    fun `GET user returns 404 with USER_NOT_FOUND when missing`() {
        authenticated()
            .get("/users/ghost")
            .then()
            .statusCode(404)
            .body("code", equalTo("USER_NOT_FOUND"))
    }

    @Test
    fun `PUT password replaces the stored hash`() {
        createUser()
        val before = jpaUserRepository.findById("yan").get().password

        request(json("password" to "newpassword1"))
            .header("Authorization", bearerToken())
            .put("/users/yan/password")
            .then()
            .statusCode(200)

        assertNotEquals(before, jpaUserRepository.findById("yan").get().password)
        request(json("username" to "yan", "password" to "newpassword1"))
            .post("/users/login")
            .then()
            .statusCode(200)
    }

    @Test
    fun `PUT password returns 404 when user is missing`() {
        request(json("password" to "newpassword1"))
            .header("Authorization", bearerToken())
            .put("/users/ghost/password")
            .then()
            .statusCode(404)
    }

    @Test
    fun `DELETE removes the user`() {
        createUser()

        authenticated().delete("/users/yan").then().statusCode(204)

        assertTrue(jpaUserRepository.findById("yan").isEmpty)
        authenticated().delete("/users/yan").then().statusCode(404)
    }

    @Test
    fun `POST login succeeds and updates lastLoginAt`() {
        createUser()
        val before = jpaUserRepository.findById("yan").get().lastLoginAt

        request(json("username" to "yan", "password" to "password123"))
            .post("/users/login")
            .then()
            .statusCode(200)
            .body("user.username", equalTo("yan"))
            .body("user.password", nullValue())
            .body("password", nullValue())

        assertTrue(jpaUserRepository.findById("yan").get().lastLoginAt >= before)
    }

    @Test
    fun `POST login returns 401 LOGIN_INVALID_PASSWORD for a wrong password`() {
        createUser()

        request(json("username" to "yan", "password" to "wrong-password"))
            .post("/users/login")
            .then()
            .statusCode(401)
            .body("code", equalTo("LOGIN_INVALID_PASSWORD"))
    }

    @Test
    fun `POST login returns 404 LOGIN_USER_NOT_FOUND for an unknown user`() {
        request(json("username" to "ghost", "password" to "password123"))
            .post("/users/login")
            .then()
            .statusCode(404)
            .body("code", equalTo("LOGIN_USER_NOT_FOUND"))
            .body("detail", not(equalTo("")))
        assertEquals(0, jpaUserRepository.count())
    }

    private val day = 24L * 60 * 60 * 1000
    private val tolerance = 2 * 60 * 1000L

    private fun assertSessionShape(
        response: io.restassured.response.Response,
        before: Long,
        after: Long,
    ) {
        assertTrue(response.path<String>("accessToken").isNotBlank())
        assertTrue(response.path<String>("refreshToken").isNotBlank())
        val accessExp = response.path<Number>("accessTokenExpiresAt").toLong()
        val refreshExp = response.path<Number>("refreshTokenExpiresAt").toLong()
        assertTrue(accessExp in (before + day - 1_000)..(after + day), "accessTokenExpiresAt=$accessExp")
        assertTrue(refreshExp in (before + 30 * day - tolerance)..(after + 30 * day + tolerance), "refreshTokenExpiresAt=$refreshExp")
    }

    private fun sha256Hex(raw: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(raw.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }

    private fun loginRequest(
        username: String,
        password: String,
    ) = request(json("username" to username, "password" to password)).post("/users/login")

    @Test
    fun `POST users returns both tokens with about 24h and 30 day expiries`() {
        val before = System.currentTimeMillis()

        val response =
            createUser()
                .then()
                .statusCode(201)
                .extract()
                .response()

        assertSessionShape(response, before, System.currentTimeMillis())
    }

    @Test
    fun `POST login returns both tokens with about 24h and 30 day expiries`() {
        createUser()
        val before = System.currentTimeMillis()

        val response =
            request(json("username" to "yan", "password" to "password123"))
                .post("/users/login")
                .then()
                .statusCode(200)
                .extract()
                .response()

        assertSessionShape(response, before, System.currentTimeMillis())
    }

    @Test
    fun `the refresh token is stored as a hash that differs from the returned token`() {
        val response =
            createUser()
                .then()
                .statusCode(201)
                .extract()
                .response()
        val raw = response.path<String>("refreshToken")

        val stored = jpaRefreshTokenRepository.findAll().single()

        assertNotEquals(raw, stored.tokenHash)
        assertEquals(sha256Hex(raw), stored.tokenHash)
        assertEquals("yan", stored.username)
        assertEquals(response.path<Number>("refreshTokenExpiresAt").toLong(), stored.expiresAt)
    }

    @Test
    fun `each login issues a new refresh token`() {
        createUser()
        val first = loginRequest("yan", "password123").path<String>("refreshToken")
        val second = loginRequest("yan", "password123").path<String>("refreshToken")

        assertNotEquals(first, second)
        assertEquals(3, jpaRefreshTokenRepository.count())
    }

    @Test
    fun `failed login and failed sign-up issue no tokens`() {
        createUser()
        jpaRefreshTokenRepository.deleteAll()

        loginRequest("yan", "wrong-password").then().statusCode(401)
        loginRequest("ghost", "password123").then().statusCode(404)
        createUser().then().statusCode(409)
        createUser(username = "bob", password = "short").then().statusCode(400)

        assertEquals(0, jpaRefreshTokenRepository.count())
    }
}
