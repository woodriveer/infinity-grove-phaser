package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.EnemyStats
import br.com.woodriver.infinity_grove_ws.domain.StageDefinition
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table

// the column defaults let `ddl-auto: update` add the columns to rows that predate the enemy attributes
private const val ELEMENT_COLUMN = "varchar(255) not null default 'FIRE'"
private const val NUMBER_COLUMN = "integer not null default 0"

/** Reads the stored columns; an element name outside the five fails the load instead of dealing a wrong multiplier. */
private fun statsOf(
    element: String,
    physicalDefense: Int,
    magicalDefense: Int,
    critResistance: Int,
) = EnemyStats(Element.valueOf(element), physicalDefense, magicalDefense, critResistance)

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
    @Column(nullable = false, columnDefinition = ELEMENT_COLUMN)
    var bossElement: String = EnemyStats.DEFAULT.element.name,
    @Column(nullable = false, columnDefinition = NUMBER_COLUMN)
    var bossPhysicalDefense: Int = 0,
    @Column(nullable = false, columnDefinition = NUMBER_COLUMN)
    var bossMagicalDefense: Int = 0,
    @Column(nullable = false, columnDefinition = NUMBER_COLUMN)
    var bossCritResistance: Int = 0,
) {
    fun toDomain(stages: List<StageEntity>): ChapterDefinition {
        val ordered = stages.sortedBy { it.number }.map { it.toDomain() }
        val boss = statsOf(bossElement, bossPhysicalDefense, bossMagicalDefense, bossCritResistance)
        return ChapterDefinition(number, bossHealth, bossTimeLimitMs, ordered, boss)
    }

    companion object {
        fun from(chapter: ChapterDefinition) =
            ChapterEntity(
                number = chapter.number,
                bossHealth = chapter.bossHealth,
                bossTimeLimitMs = chapter.bossTimeLimitMs,
                bossElement = chapter.boss.element.name,
                bossPhysicalDefense = chapter.boss.physicalDefense,
                bossMagicalDefense = chapter.boss.magicalDefense,
                bossCritResistance = chapter.boss.critResistance,
            )
    }
}

/** One row per stage of a chapter, keyed `chapter/number`. */
@Entity
@Table(name = "stages", indexes = [Index(name = "idx_stages_chapter", columnList = "chapter")])
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
    @Column(nullable = false, columnDefinition = ELEMENT_COLUMN)
    var monsterElement: String = EnemyStats.DEFAULT.element.name,
    @Column(nullable = false, columnDefinition = NUMBER_COLUMN)
    var monsterPhysicalDefense: Int = 0,
    @Column(nullable = false, columnDefinition = NUMBER_COLUMN)
    var monsterMagicalDefense: Int = 0,
    @Column(nullable = false, columnDefinition = NUMBER_COLUMN)
    var monsterCritResistance: Int = 0,
    @Column(nullable = false, columnDefinition = ELEMENT_COLUMN)
    var minibossElement: String = EnemyStats.DEFAULT.element.name,
    @Column(nullable = false, columnDefinition = NUMBER_COLUMN)
    var minibossPhysicalDefense: Int = 0,
    @Column(nullable = false, columnDefinition = NUMBER_COLUMN)
    var minibossMagicalDefense: Int = 0,
    @Column(nullable = false, columnDefinition = NUMBER_COLUMN)
    var minibossCritResistance: Int = 0,
) {
    fun toDomain() =
        StageDefinition(
            number = number,
            phasesPerStage = phasesPerStage,
            monsterHealth = monsterHealth,
            minibossHealth = minibossHealth,
            minibossTimeLimitMs = minibossTimeLimitMs,
            monster = EnemyStats(Element.valueOf(monsterElement), monsterPhysicalDefense, monsterMagicalDefense, monsterCritResistance),
            miniboss =
                EnemyStats(
                    Element.valueOf(minibossElement),
                    minibossPhysicalDefense,
                    minibossMagicalDefense,
                    minibossCritResistance,
                ),
        )

    companion object {
        fun idOf(
            chapter: Int,
            number: Int,
        ) = "$chapter/$number"

        fun from(
            chapter: Int,
            stage: StageDefinition,
        ) = StageEntity(
            id = idOf(chapter, stage.number),
            chapter = chapter,
            number = stage.number,
            phasesPerStage = stage.phasesPerStage,
            monsterHealth = stage.monsterHealth,
            minibossHealth = stage.minibossHealth,
            minibossTimeLimitMs = stage.minibossTimeLimitMs,
            monsterElement = stage.monster.element.name,
            monsterPhysicalDefense = stage.monster.physicalDefense,
            monsterMagicalDefense = stage.monster.magicalDefense,
            monsterCritResistance = stage.monster.critResistance,
            minibossElement = stage.miniboss.element.name,
            minibossPhysicalDefense = stage.miniboss.physicalDefense,
            minibossMagicalDefense = stage.miniboss.magicalDefense,
            minibossCritResistance = stage.miniboss.critResistance,
        )
    }
}
