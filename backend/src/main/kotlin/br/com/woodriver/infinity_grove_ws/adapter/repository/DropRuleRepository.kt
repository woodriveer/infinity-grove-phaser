package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.DropTable
import br.com.woodriver.infinity_grove_ws.port.DropRuleRepositoryPort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

interface JpaDropRuleRepository : JpaRepository<DropRuleEntity, Int> {
    fun findAllByOrderByIdAsc(): List<DropRuleEntity>
}

@Repository
class DropRuleRepository(
    private val jpaDropRuleRepository: JpaDropRuleRepository,
) : DropRuleRepositoryPort {
    @Transactional(readOnly = true)
    override fun findAll(): DropTable {
        val rules = jpaDropRuleRepository.findAllByOrderByIdAsc().map { it.toDomain() }
        check(rules.isNotEmpty()) { "No drop rules are stored; the chapter seeder fills drop_rules at startup" }
        return DropTable(rules)
    }

    @Transactional(readOnly = true)
    override fun existsById(id: Int) = jpaDropRuleRepository.existsById(id)

    @Transactional
    override fun save(rule: DropRule) {
        jpaDropRuleRepository.save(DropRuleEntity.from(rule))
    }
}
