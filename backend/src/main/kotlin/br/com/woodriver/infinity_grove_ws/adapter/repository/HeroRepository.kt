package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.Hero
import br.com.woodriver.infinity_grove_ws.port.HeroRepositoryPort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

interface JpaHeroRepository : JpaRepository<HeroEntity, String> {
    fun findAllByOrderBySortOrderAsc(): List<HeroEntity>
}

interface JpaHeroSkillRepository : JpaRepository<HeroSkillEntity, String> {
    fun findAllByHeroId(heroId: String): List<HeroSkillEntity>
}

@Repository
class HeroRepository(
    private val jpaHeroRepository: JpaHeroRepository,
    private val jpaHeroSkillRepository: JpaHeroSkillRepository,
) : HeroRepositoryPort {
    @Transactional(readOnly = true)
    override fun findAll(): List<Hero> {
        val skills = jpaHeroSkillRepository.findAll().groupBy { it.heroId }
        return jpaHeroRepository.findAllByOrderBySortOrderAsc().map { it.toDomain(skills[it.id].orEmpty()) }
    }

    @Transactional(readOnly = true)
    override fun findById(id: String): Hero? {
        val hero = jpaHeroRepository.findById(id).orElse(null) ?: return null
        return hero.toDomain(jpaHeroSkillRepository.findAllByHeroId(id))
    }

    @Transactional(readOnly = true)
    override fun existsById(id: String) = jpaHeroRepository.existsById(id)

    @Transactional
    override fun save(
        hero: Hero,
        order: Int,
    ) {
        jpaHeroRepository.save(HeroEntity.from(hero, order))
        jpaHeroSkillRepository.saveAll(hero.skills.map { HeroSkillEntity.from(hero.id, it) })
    }
}
