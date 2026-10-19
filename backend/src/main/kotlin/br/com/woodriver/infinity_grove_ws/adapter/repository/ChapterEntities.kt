package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.EnemyStats
import br.com.woodriver.infinity_grove_ws.domain.StageDefinition
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

/** One row per distinct enemy attribute set; stages and chapters point at it by id. */
@Entity
@Table(
    name = "enemies",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_enemies_attributes",
            columnNames = ["element", "physical_defense", "magical_defense", "crit_resistance"],
        ),
    ],
)
class EnemyEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
    @Column(nullable = false, length = 32)
    var element: String,
    @Column(nullable = false)
    var physicalDefense: Int,
    @Column(nullable = false)
    var magicalDefense: Int,
    @Column(nullable = false)
    var critResistance: Int,
) {
    /** An element name outside the five fails the load instead of dealing a wrong multiplier. */
    fun toDomain() = EnemyStats(Element.valueOf(element), physicalDefense, magicalDefense, critResistance)
}

/** Looks up an enemy the stage or chapter points at; a dangling id fails the load. */
private fun Map<Long, EnemyStats>.enemy(id: Long) = this[id] ?: throw IllegalStateException("Enemy $id does not exist")

@Entity
@Table(name = "chapters")
class ChapterEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var number: Int,
    @Column(nullable = false)
    var bossHealth: Int,
    @Column(nullable = false)
    var bossTimeLimitMs: Long,
    @Column(nullable = false)
    var bossEnemyId: Long,
    @Column(nullable = false)
    var bossDropRuleId: Int,
) {
    fun toDomain(
        stages: List<StageEntity>,
        enemies: Map<Long, EnemyStats>,
    ): ChapterDefinition {
        val ordered = stages.sortedBy { it.number }.map { it.toDomain(enemies) }
        return ChapterDefinition(number, bossHealth, bossTimeLimitMs, ordered, enemies.enemy(bossEnemyId), bossDropRuleId)
    }

    companion object {
        fun from(
            chapter: ChapterDefinition,
            bossEnemyId: Long,
        ) = ChapterEntity(
            number = chapter.number,
            bossHealth = chapter.bossHealth,
            bossTimeLimitMs = chapter.bossTimeLimitMs,
            bossEnemyId = bossEnemyId,
            bossDropRuleId = chapter.bossDropRuleId,
        )
    }
}

/** One row per stage of a chapter, keyed `chapter/number`; `(chapter, number)` is unique so progress can reference it. */
@Entity
@Table(
    name = "stages",
    indexes = [Index(name = "idx_stages_chapter", columnList = "chapter")],
    uniqueConstraints = [UniqueConstraint(name = "uk_stages_chapter_number", columnNames = ["chapter", "number"])],
)
class StageEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var id: String,
    @Column(nullable = false, updatable = false)
    var chapter: Int,
    @Column(nullable = false, updatable = false)
    var number: Int,
    @Column(nullable = false)
    var phasesPerStage: Int,
    @Column(nullable = false)
    var monsterHealth: Int,
    @Column(nullable = false)
    var minibossHealth: Int,
    @Column(nullable = false)
    var minibossTimeLimitMs: Long,
    @Column(nullable = false)
    var monsterEnemyId: Long,
    @Column(nullable = false)
    var minibossEnemyId: Long,
    @Column(nullable = false)
    var monsterDropRuleId: Int,
    @Column(nullable = false)
    var minibossDropRuleId: Int,
) {
    fun toDomain(enemies: Map<Long, EnemyStats>) =
        StageDefinition(
            number = number,
            phasesPerStage = phasesPerStage,
            monsterHealth = monsterHealth,
            minibossHealth = minibossHealth,
            minibossTimeLimitMs = minibossTimeLimitMs,
            monster = enemies.enemy(monsterEnemyId),
            miniboss = enemies.enemy(minibossEnemyId),
            monsterDropRuleId = monsterDropRuleId,
            minibossDropRuleId = minibossDropRuleId,
        )

    companion object {
        fun idOf(
            chapter: Int,
            number: Int,
        ) = "$chapter/$number"

        fun from(
            chapter: Int,
            stage: StageDefinition,
            monsterEnemyId: Long,
            minibossEnemyId: Long,
        ) = StageEntity(
            id = idOf(chapter, stage.number),
            chapter = chapter,
            number = stage.number,
            phasesPerStage = stage.phasesPerStage,
            monsterHealth = stage.monsterHealth,
            minibossHealth = stage.minibossHealth,
            minibossTimeLimitMs = stage.minibossTimeLimitMs,
            monsterEnemyId = monsterEnemyId,
            minibossEnemyId = minibossEnemyId,
            monsterDropRuleId = stage.monsterDropRuleId,
            minibossDropRuleId = stage.minibossDropRuleId,
        )
    }
}
