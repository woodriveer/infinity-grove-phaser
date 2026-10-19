package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.DropRule
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

/** One row per drop rule; the id is chosen by the seed or the operator, never generated. */
@Entity
@Table(name = "drop_rules")
class DropRuleEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var id: Int,
    @Column(nullable = false)
    var minCopper: Int,
    @Column(nullable = false)
    var maxCopper: Int,
    @Column(nullable = false)
    var killIntervalMs: Long,
) {
    fun toDomain() = DropRule(id, minCopper, maxCopper, killIntervalMs)

    companion object {
        fun from(rule: DropRule) = DropRuleEntity(rule.id, rule.minCopper, rule.maxCopper, rule.killIntervalMs)
    }
}
