package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import com.zaxxer.hikari.HikariDataSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.env.Environment
import javax.sql.DataSource
import kotlin.test.Test
import kotlin.test.assertEquals

/** SUPA-01: the serving Cloud Run instance and the new revision's share the Supabase Session pooler, so each holds at most 5 connections. */
class DatabasePoolConfigIT : IntegrationTestBase() {
    @Autowired
    private lateinit var dataSource: DataSource

    @Autowired
    private lateinit var environment: Environment

    @Test
    fun `the connection pool holds at most 5 connections`() {
        assertEquals(5, dataSource.unwrap(HikariDataSource::class.java).maximumPoolSize)
    }

    @Test
    fun `the connection pool keeps 1 idle connection`() {
        assertEquals(1, dataSource.unwrap(HikariDataSource::class.java).minimumIdle)
    }

    @Test
    fun `the shipped yaml sets the pool size to 5`() {
        assertEquals("5", environment.getProperty("spring.datasource.hikari.maximum-pool-size"))
    }

    @Test
    fun `the shipped yaml sets the idle minimum to 1`() {
        assertEquals("1", environment.getProperty("spring.datasource.hikari.minimum-idle"))
    }
}
