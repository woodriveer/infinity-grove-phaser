package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import com.zaxxer.hikari.HikariDataSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.jdbc.autoconfigure.JdbcConnectionDetails
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.context.TestPropertySource
import org.testcontainers.postgresql.PostgreSQLContainer
import javax.sql.DataSource
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * SUPA-10: test properties outrank environment variables, so if @ServiceConnection wins over this Supabase URL it also wins over a
 * SPRING_DATASOURCE_URL in the shell or the CI runner. The host ends in .invalid, so a broken isolation fails on DNS and never reaches Supabase.
 */
@TestPropertySource(
    properties = [
        "spring.datasource.url=jdbc:postgresql://aws-0-test.pooler.supabase.invalid:5432/postgres?sslmode=require",
        "spring.datasource.username=postgres.123456789012",
        "spring.datasource.password=Fake0Password1ForTests",
    ],
)
class TestDatabaseIsolationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var dataSource: DataSource

    @Autowired
    private lateinit var connection: JdbcConnectionDetails

    @Autowired
    private lateinit var postgres: PostgreSQLContainer

    @Autowired
    private lateinit var jdbc: JdbcTemplate

    @Test
    fun `the tests connect to the Testcontainers Postgres even when the datasource names Supabase`() {
        val url = dataSource.unwrap(HikariDataSource::class.java).jdbcUrl
        assertEquals(connection.jdbcUrl, url)
        assertTrue(url.contains(":${postgres.getMappedPort(5432)}/"))
    }

    @Test
    fun `the test database url never names Supabase`() {
        assertFalse(dataSource.unwrap(HikariDataSource::class.java).jdbcUrl.contains("supabase"))
    }

    @Test
    fun `the test database answers a query`() {
        assertEquals(1, jdbc.queryForObject("select 1", Int::class.java))
    }
}
