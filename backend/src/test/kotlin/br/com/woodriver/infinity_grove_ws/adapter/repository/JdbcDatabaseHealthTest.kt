package br.com.woodriver.infinity_grove_ws.adapter.repository

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.datasource.DriverManagerDataSource
import kotlin.test.Test
import kotlin.test.assertFalse

class JdbcDatabaseHealthTest {
    @Test
    fun `a database that cannot be reached is not healthy`() {
        val unreachable = DriverManagerDataSource("jdbc:postgresql://127.0.0.1:1/none", "x", "Fake0Password1ForTests")

        assertFalse(JdbcDatabaseHealth(JdbcTemplate(unreachable)).reachable())
    }
}
