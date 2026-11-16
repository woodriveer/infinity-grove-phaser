package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.port.DatabaseHealthPort
import org.slf4j.LoggerFactory
import org.springframework.dao.DataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/** `select 1` through the application pool; any data access failure means the database is not reachable. */
@Component
class JdbcDatabaseHealth(
    private val jdbc: JdbcTemplate,
) : DatabaseHealthPort {
    override fun reachable(): Boolean =
        try {
            jdbc.queryForObject("select 1", Int::class.java) == 1
        } catch (e: DataAccessException) {
            logger.warn("Database health check failed: {}", e.message)
            false
        }

    companion object {
        private val logger = LoggerFactory.getLogger(JdbcDatabaseHealth::class.java)
    }
}
