package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.TEST_JWT_SECRET
import br.com.woodriver.infinity_grove_ws.adapter.security.JwtAccessTokenIssuer
import br.com.woodriver.infinity_grove_ws.adapter.security.SecurityProperties
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import io.restassured.response.Response
import io.restassured.specification.RequestSpecification
import org.hamcrest.Matchers.containsString
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.not
import org.hamcrest.Matchers.notNullValue
import org.junit.jupiter.api.Test
import java.time.Duration

class SecurityIT : IntegrationTestBase() {
    private val protectedRoutes: List<Pair<String, String>> =
        listOf(
            "GET" to "/users",
            "GET" to "/users/yan",
            "PUT" to "/users/yan/password",
            "DELETE" to "/users/yan",
        )

    private fun call(
        spec: RequestSpecification,
        method: String,
        path: String,
    ): Response = spec.contentType(ContentType.JSON).body("""{"password":"newpassword1"}""").request(method, path)

    private fun assertUnauthenticated(response: Response) {
        response
            .then()
            .statusCode(401)
            .contentType(containsString("application/problem+json"))
            .body("status", equalTo(401))
            .body("detail", notNullValue())
            .body("detail", not(equalTo("")))
            .body("code", equalTo("AUTH_UNAUTHENTICATED"))
    }

    private fun signUp(username: String = "yan") =
        given()
            .contentType(ContentType.JSON)
            .body("""{"username":"$username","password":"password123"}""")
            .post("/users")

    private val otherKeyIssuer =
        JwtAccessTokenIssuer(SecurityProperties(jwtSecret = "a-completely-different-secret-key-0123456789"))

    private val sameKeyIssuer = JwtAccessTokenIssuer(SecurityProperties(jwtSecret = TEST_JWT_SECRET))

    private fun bearer(token: String) = "Bearer $token"

    @Test
    fun `protected routes return 401 AUTH_UNAUTHENTICATED without an Authorization header`() {
        protectedRoutes.forEach { (method, path) ->
            assertUnauthenticated(call(given(), method, path))
        }
    }

    @Test
    fun `protected routes return 401 for a malformed token`() {
        protectedRoutes.forEach { (method, path) ->
            assertUnauthenticated(call(given().header("Authorization", bearer("not.a.jwt")), method, path))
            assertUnauthenticated(call(given().header("Authorization", bearer("garbage")), method, path))
        }
    }

    @Test
    fun `protected routes return 401 for a non-Bearer scheme`() {
        protectedRoutes.forEach { (method, path) ->
            assertUnauthenticated(call(given().header("Authorization", "Basic eWFuOnBhc3N3b3Jk"), method, path))
        }
    }

    @Test
    fun `protected routes return 401 for a token signed by another key`() {
        val foreign = otherKeyIssuer.issue("yan", System.currentTimeMillis()).value

        protectedRoutes.forEach { (method, path) ->
            assertUnauthenticated(call(given().header("Authorization", bearer(foreign)), method, path))
        }
    }

    @Test
    fun `protected routes return 401 for an expired token`() {
        val expired = sameKeyIssuer.issue("yan", System.currentTimeMillis() - Duration.ofDays(3).toMillis()).value

        protectedRoutes.forEach { (method, path) ->
            assertUnauthenticated(call(given().header("Authorization", bearer(expired)), method, path))
        }
    }

    @Test
    fun `protected routes work with a valid token`() {
        signUp("yan").then().statusCode(201)

        call(authenticated(), "GET", "/users").then().statusCode(200)
        call(authenticated(), "GET", "/users/yan").then().statusCode(200).body("username", equalTo("yan"))
        call(authenticated(), "PUT", "/users/yan/password").then().statusCode(200)
        call(authenticated(), "DELETE", "/users/yan").then().statusCode(204)
    }

    @Test
    fun `a token from sign-up authenticates the next request`() {
        val token = signUp().path<String>("accessToken")

        given()
            .header("Authorization", bearer(token))
            .get("/users/yan")
            .then()
            .statusCode(200)
            .body("username", equalTo("yan"))
    }

    @Test
    fun `the four public routes work without a token`() {
        val created =
            signUp()
                .then()
                .statusCode(201)
                .extract()
                .response()
        given()
            .contentType(ContentType.JSON)
            .body("""{"username":"yan","password":"password123"}""")
            .post("/users/login")
            .then()
            .statusCode(200)
        val refreshed =
            given()
                .contentType(ContentType.JSON)
                .body("""{"refreshToken":"${created.path<String>("refreshToken")}"}""")
                .post("/auth/refresh")
                .then()
                .statusCode(200)
                .extract()
                .response()
        given()
            .contentType(ContentType.JSON)
            .body("""{"refreshToken":"${refreshed.path<String>("refreshToken")}"}""")
            .post("/auth/logout")
            .then()
            .statusCode(204)
    }

    @Test
    fun `public routes keep their error statuses when called without a token`() {
        signUp().then().statusCode(201)

        signUp().then().statusCode(409).body("code", equalTo("USER_ALREADY_EXISTS"))
        given()
            .contentType(ContentType.JSON)
            .body("""{"username":"yan","password":"wrong-password"}""")
            .post("/users/login")
            .then()
            .statusCode(401)
            .body("code", equalTo("LOGIN_INVALID_PASSWORD"))
        given()
            .contentType(ContentType.JSON)
            .body("""{"refreshToken":"nope"}""")
            .post("/auth/refresh")
            .then()
            .statusCode(401)
            .body("code", equalTo("AUTH_INVALID_REFRESH_TOKEN"))
        given()
            .contentType(ContentType.JSON)
            .body("{}")
            .post("/auth/refresh")
            .then()
            .statusCode(400)
        given()
            .contentType(ContentType.JSON)
            .body("{}")
            .post("/users")
            .then()
            .statusCode(400)
    }

    @Test
    fun `a public path with another method is protected`() {
        assertUnauthenticated(given().contentType(ContentType.JSON).body("{}").put("/users"))
        assertUnauthenticated(given().get("/auth/refresh"))
    }

    @Test
    fun `error responses still use the ProblemDetail handlers for authenticated requests`() {
        authenticated()
            .get("/users/ghost")
            .then()
            .statusCode(404)
            .body("code", equalTo("USER_NOT_FOUND"))
        call(authenticated(), "PUT", "/users/ghost/password").then().statusCode(404)
        authenticated()
            .contentType(ContentType.JSON)
            .body("""{"username":"bob","password":"short"}""")
            .post("/users")
            .then()
            .statusCode(400)
    }

    @Test
    fun `unauthenticated access to an unknown route is 401, not 403`() {
        assertUnauthenticated(given().get("/does-not-exist"))
    }
}
