package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.InfinityGroveWsApplication
import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.TEST_JWT_SECRET
import org.flywaydb.core.Flyway
import org.hibernate.tool.schema.spi.SchemaManagementException
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.SpringApplication
import org.springframework.boot.jdbc.autoconfigure.JdbcConnectionDetails
import org.springframework.core.env.Environment
import org.springframework.jdbc.core.JdbcTemplate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

/** Hibernate only validates the Flyway schema: the shipped mode is `validate`, and an entity column the schema lacks stops startup. */
class SchemaValidationIT : IntegrationTestBase() {
    @Autowired
    private lateinit var environment: Environment

    @Autowired
    private lateinit var connection: JdbcConnectionDetails

    @Autowired
    private lateinit var jdbc: JdbcTemplate

    @Test
    fun `hibernate runs in validate mode`() {
        assertEquals("validate", environment.getProperty("spring.jpa.hibernate.ddl-auto"))
    }

    @Test
    fun `startup fails when the schema lacks a column an entity maps`() {
        val schema = "mismatch"
        try {
            Flyway
                .configure()
                .dataSource(connection.jdbcUrl, connection.username, connection.password)
                .schemas(schema)
                .load()
                .migrate()
            jdbc.execute("alter table $schema.wallets drop column copper")

            val failure =
                assertFailsWith<Exception> {
                    SpringApplication(InfinityGroveWsApplication::class.java)
                        .run(
                            "--spring.main.web-application-type=none",
                            "--spring.datasource.url=${connection.jdbcUrl}",
                            "--spring.datasource.username=${connection.username}",
                            "--spring.datasource.password=${connection.password}",
                            "--spring.flyway.enabled=false",
                            "--spring.jpa.properties.hibernate.default_schema=$schema",
                            "--app.security.jwt-secret=$TEST_JWT_SECRET",
                        ).close()
                }

            assertTrue(
                generateSequence(failure as Throwable) { it.cause }.any { it is SchemaManagementException },
                "expected a schema validation failure, got $failure",
            )
        } finally {
            jdbc.execute("drop schema if exists $schema cascade")
        }
    }
}
