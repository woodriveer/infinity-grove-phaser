package br.com.woodriver.infinity_grove_ws

import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaChapterRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaProgressRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaRefreshTokenRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaStageRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaUserRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaWalletLevelRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaWalletRepository
import br.com.woodriver.infinity_grove_ws.adapter.security.JwtAccessTokenIssuer
import io.restassured.RestAssured
import io.restassured.specification.RequestSpecification
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

    @Autowired
    protected lateinit var jpaWalletRepository: JpaWalletRepository

    @Autowired
    protected lateinit var jpaWalletLevelRepository: JpaWalletLevelRepository

    @Autowired
    protected lateinit var jpaProgressRepository: JpaProgressRepository

    @Autowired
    protected lateinit var jpaChapterRepository: JpaChapterRepository

    @Autowired
    protected lateinit var jpaStageRepository: JpaStageRepository

    @Autowired
    private lateinit var accessTokenIssuer: JwtAccessTokenIssuer

    /** A valid `Bearer` header value for [username]; the user does not need to exist, the access token is stateless. */
    protected fun bearerToken(username: String = "test-caller") =
        "Bearer " + accessTokenIssuer.issue(username, System.currentTimeMillis()).value

    /** A request specification that carries a valid access token. */
    protected fun authenticated(): RequestSpecification = RestAssured.given().header("Authorization", bearerToken())

    @BeforeEach
    fun setUpRestAssured() {
        RestAssured.port = port
        RestAssured.basePath = ""
        jpaRefreshTokenRepository.deleteAll()
        jpaProgressRepository.deleteAll()
        jpaWalletLevelRepository.deleteAll()
        jpaWalletRepository.deleteAll()
        jpaUserRepository.deleteAll()
    }
}
