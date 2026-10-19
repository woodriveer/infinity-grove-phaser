package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.DropTable

interface DropRuleRepositoryPort {
    /**
     * Every stored drop rule, ordered by id. The chapter seeder fills the table at startup, so an empty table is a broken
     * database: it fails with [IllegalStateException] instead of answering with no rules.
     */
    fun findAll(): DropTable

    fun existsById(id: Int): Boolean

    /** Stores [rule] under its id, replacing the values of a rule with the same id. */
    fun save(rule: DropRule)
}
