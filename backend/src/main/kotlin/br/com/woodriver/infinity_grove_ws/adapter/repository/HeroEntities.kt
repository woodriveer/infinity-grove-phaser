package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.Hero
import br.com.woodriver.infinity_grove_ws.domain.Skill
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table

/** One row per hero of the catalog; [sortOrder] is its position in the catalog. */
@Entity
@Table(name = "heroes")
class HeroEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var id: String,
    @Column(nullable = false)
    var name: String,
    @Column(name = "hero_class", nullable = false)
    var heroClass: String,
    @Column(nullable = false, length = 32)
    var element: String,
    @Column(name = "leader_bonus", nullable = false, length = 512)
    var leaderBonus: String,
    @Column(nullable = false)
    var portrait: String,
    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int,
) {
    fun toDomain(skills: List<HeroSkillEntity>) =
        Hero(id, name, heroClass, Element.valueOf(element), leaderBonus, portrait, skills.sortedBy { it.slot }.map { it.toDomain() })

    companion object {
        fun from(
            hero: Hero,
            order: Int,
        ) = HeroEntity(hero.id, hero.name, hero.heroClass, hero.element.name, hero.leaderBonus, hero.portrait, order)
    }
}

/** One row per skill of a hero: its slot (1 to 3), texts, cooldown and art name. */
@Entity
@Table(name = "hero_skills", indexes = [Index(name = "idx_hero_skills_hero_id", columnList = "hero_id")])
class HeroSkillEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var id: String,
    @Column(name = "hero_id", nullable = false, updatable = false)
    var heroId: String,
    @Column(nullable = false, updatable = false)
    var slot: Int,
    @Column(nullable = false)
    var name: String,
    @Column(name = "skill_type", nullable = false)
    var type: String,
    @Column(nullable = false, length = 1024)
    var effect: String,
    @Column(name = "cooldown_seconds", nullable = false)
    var cooldownSeconds: Int,
    @Column(nullable = false)
    var image: String,
) {
    fun toDomain() = Skill(slot, name, type, effect, cooldownSeconds, image)

    companion object {
        fun idOf(
            heroId: String,
            slot: Int,
        ) = "$heroId/$slot"

        fun from(
            heroId: String,
            skill: Skill,
        ) = HeroSkillEntity(
            idOf(heroId, skill.slot),
            heroId,
            skill.slot,
            skill.name,
            skill.type,
            skill.effect,
            skill.cooldownSeconds,
            skill.image,
        )
    }
}
