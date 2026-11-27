package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.EnemyStats
import br.com.woodriver.infinity_grove_ws.domain.MonsterAffix
import br.com.woodriver.infinity_grove_ws.domain.MonsterAffixType
import br.com.woodriver.infinity_grove_ws.domain.StageAdd
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
            name = "uk_enemies_defense",
            columnNames = ["element", "defense", "crit_resistance"],
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
    var defense: Int,
    @Column(nullable = false)
    var critResistance: Int,
) {
    /** An element name outside the five fails the load instead of dealing a wrong multiplier. */
    fun toDomain() = EnemyStats(Element.valueOf(element), defense, critResistance)
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
    var bossHitPoints: Long,
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
        adds: Map<String, List<StageAdd>> = emptyMap(),
        stageAffixes: Map<String, MonsterAffix> = emptyMap(),
        bossAffix: MonsterAffix? = null,
    ): ChapterDefinition {
        val ordered = stages.sortedBy { it.number }.map { it.toDomain(enemies, adds[it.id] ?: emptyList(), stageAffixes[it.id]) }
        return ChapterDefinition(number, bossHitPoints, bossTimeLimitMs, ordered, enemies.enemy(bossEnemyId), bossDropRuleId, bossAffix)
    }

    companion object {
        fun from(
            chapter: ChapterDefinition,
            bossEnemyId: Long,
        ) = ChapterEntity(
            number = chapter.number,
            bossHitPoints = chapter.bossHealth,
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
    var monsterHitPoints: Long,
    @Column(nullable = false)
    var minibossHitPoints: Long,
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
    fun toDomain(
        enemies: Map<Long, EnemyStats>,
        adds: List<StageAdd> = emptyList(),
        minibossAffix: MonsterAffix? = null,
    ) = StageDefinition(
        number = number,
        phasesPerStage = phasesPerStage,
        monsterHealth = monsterHitPoints,
        minibossHealth = minibossHitPoints,
        minibossTimeLimitMs = minibossTimeLimitMs,
        monster = enemies.enemy(monsterEnemyId),
        miniboss = enemies.enemy(minibossEnemyId),
        monsterDropRuleId = monsterDropRuleId,
        minibossDropRuleId = minibossDropRuleId,
        adds = adds,
        minibossAffix = minibossAffix,
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
            monsterHitPoints = stage.monsterHealth,
            minibossHitPoints = stage.minibossHealth,
            minibossTimeLimitMs = stage.minibossTimeLimitMs,
            monsterEnemyId = monsterEnemyId,
            minibossEnemyId = minibossEnemyId,
            monsterDropRuleId = stage.monsterDropRuleId,
            minibossDropRuleId = stage.minibossDropRuleId,
        )
    }
}

/** One add of a stage (spec miniboss-adds), keyed `chapter/stage/slot`; `(stage_id, slot)` is unique. */
@Entity
@Table(
    name = "stage_adds",
    uniqueConstraints = [UniqueConstraint(name = "uk_stage_adds_stage_slot", columnNames = ["stage_id", "slot"])],
)
class StageAddEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var id: String,
    @Column(name = "stage_id", nullable = false, updatable = false)
    var stageId: String,
    @Column(nullable = false, updatable = false)
    var slot: Int,
    @Column(nullable = false)
    var hitPoints: Long,
    @Column(nullable = false)
    var defenseBuff: Int,
) {
    fun toDomain() = StageAdd(hitPoints, defenseBuff)

    companion object {
        fun idOf(
            chapter: Int,
            stage: Int,
            slot: Int,
        ) = "$chapter/$stage/$slot"

        fun from(
            chapter: Int,
            stage: Int,
            slot: Int,
            add: StageAdd,
        ) = StageAddEntity(idOf(chapter, stage, slot), StageEntity.idOf(chapter, stage), slot, add.health, add.defenseBuff)
    }
}

/** The affix of a stage's miniboss (spec early-game-rebalance), keyed by the stage id. */
@Entity
@Table(name = "stage_affixes")
class StageAffixEntity(
    @Id
    @Column(name = "stage_id", nullable = false, updatable = false)
    var stageId: String,
    @Column(nullable = false, length = 32)
    var affix: String,
    @Column(nullable = false)
    var amount: Long,
    @Column(name = "period_ms")
    var periodMs: Long?,
) {
    fun toDomain() = MonsterAffix(MonsterAffixType.valueOf(affix), amount, periodMs)

    companion object {
        fun from(
            stageId: String,
            affix: MonsterAffix,
        ) = StageAffixEntity(stageId, affix.type.name, affix.amount, affix.periodMs)
    }
}

/** The affix of a chapter boss, keyed by the chapter number. */
@Entity
@Table(name = "chapter_affixes")
class ChapterAffixEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var chapter: Int,
    @Column(nullable = false, length = 32)
    var affix: String,
    @Column(nullable = false)
    var amount: Long,
    @Column(name = "period_ms")
    var periodMs: Long?,
) {
    fun toDomain() = MonsterAffix(MonsterAffixType.valueOf(affix), amount, periodMs)

    companion object {
        fun from(
            chapter: Int,
            affix: MonsterAffix,
        ) = ChapterAffixEntity(chapter, affix.type.name, affix.amount, affix.periodMs)
    }
}
