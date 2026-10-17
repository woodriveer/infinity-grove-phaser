package br.com.woodriver.infinity_grove_ws

import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaRefreshTokenRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaUserRepository
import io.restassured.RestAssured
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.testcontainers.postgresql.PostgreSQLContainer

@TestConfiguration(proxyBeanMethods = false)
class PostgresTestConfiguration {
    @Bean
    @ServiceConnection
    fun postgres(): PostgreSQLContainer = PostgreSQLContainer("postgres:17")
}

const val TEST_JWT_SECRET = "integration-test-secret-0123456789-abcdef"

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = ["app.security.jwt-secret=$TEST_JWT_SECRET"],
)
@Import(PostgresTestConfiguration::class)
abstract class IntegrationTestBase {
    @LocalServerPort
    private var port: Int = 0

    @Autowired
    protected lateinit var jpaUserRepository: JpaUserRepository

    @Autowired
    protected lateinit var jpaRefreshTokenRepository: JpaRefreshTokenRepository

    @BeforeEach
    fun setUpRestAssured() {
        RestAssured.port = port
        RestAssured.basePath = ""
        jpaRefreshTokenRepository.deleteAll()
        jpaUserRepository.deleteAll()
    }
}
