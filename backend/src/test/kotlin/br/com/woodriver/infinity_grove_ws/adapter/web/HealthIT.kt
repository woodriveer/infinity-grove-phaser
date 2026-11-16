package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.JdbcDatabaseHealth
import io.restassured.RestAssured.given
import org.hamcrest.Matchers.containsString
import org.hamcrest.Matchers.equalTo
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.context.TestPropertySource
import kotlin.test.Test
import kotlin.test.assertTrue

@TestPropertySource(properties = ["app.commit=0123456789abcdef0123456789abcdef01234567"])
class HealthIT : IntegrationTestBase() {
    @Autowired
    private lateinit var health: JdbcDatabaseHealth

    @Test
    fun `GET health without a token answers 200 UP and the commit`() {
        given()
            .get("/health")
            .then()
            .statusCode(200)
            .contentType(containsString("application/json"))
            .body("status", equalTo("UP"))
            .body("commit", equalTo("0123456789abcdef0123456789abcdef01234567"))
    }

    @Test
    fun `the database adapter reaches the test database`() {
        assertTrue(health.reachable())
    }
}
