package br.com.woodriver.infinity_grove_ws

import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaCardCopyRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaChapterRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaPieceRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaPlayerCardsRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaProgressRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaRefreshTokenRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaStageRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaUserRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaWalletLevelRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.JpaWalletRepository
import br.com.woodriver.infinity_grove_ws.adapter.security.JwtAccessTokenIssuer
import br.com.woodriver.infinity_grove_ws.port.ChanceRollerPort
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
import org.springframework.context.annotation.Primary
import org.testcontainers.postgresql.PostgreSQLContainer

@TestConfiguration(proxyBeanMethods = false)
class PostgresTestConfiguration {
    @Bean
    @ServiceConnection
    fun postgres(): PostgreSQLContainer = PostgreSQLContainer("postgres:17")
}

/** The chance every card roll reads in integration tests; 0.5 drops nothing, a test sets 0.0 to force a drop. */
class ControllableChanceRoller : ChanceRollerPort {
    @Volatile
    var value: Double = NO_DROP

    override fun roll() = value

    companion object {
        const val NO_DROP = 0.5
    }
}

@TestConfiguration(proxyBeanMethods = false)
class ChanceTestConfiguration {
    @Bean
    @Primary
    fun controllableChanceRoller() = ControllableChanceRoller()
}

const val TEST_JWT_SECRET = "integration-test-secret-0123456789-abcdef"

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = [
        "app.security.jwt-secret=$TEST_JWT_SECRET",
        // the tests roll against the original chances; the shipped yaml makes every boss win drop a card
        "app.cards.miniboss-rate-per-stage=0.02",
        "app.cards.chapter-boss-rate=0.30",
    ],
)
@Import(PostgresTestConfiguration::class, ChanceTestConfiguration::class)
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
    protected lateinit var jpaPlayerCardsRepository: JpaPlayerCardsRepository

    @Autowired
    protected lateinit var jpaCardCopyRepository: JpaCardCopyRepository

    @Autowired
    protected lateinit var jpaPieceRepository: JpaPieceRepository

    @Autowired
    protected lateinit var chance: ControllableChanceRoller

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
        chance.value = ControllableChanceRoller.NO_DROP
        jpaRefreshTokenRepository.deleteAll()
        jpaProgressRepository.deleteAll()
        jpaPieceRepository.deleteAll()
        jpaCardCopyRepository.deleteAll()
        jpaPlayerCardsRepository.deleteAll()
        jpaWalletLevelRepository.deleteAll()
        jpaWalletRepository.deleteAll()
        jpaUserRepository.deleteAll()
    }
}
