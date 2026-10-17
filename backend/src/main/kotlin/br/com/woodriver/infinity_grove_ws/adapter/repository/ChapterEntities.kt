package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.StageDefinition
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table

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
) {
    fun toDomain(stages: List<StageEntity>): ChapterDefinition {
        val ordered = stages.sortedBy { it.number }.map { it.toDomain() }
        return ChapterDefinition(number, bossHealth, bossTimeLimitMs, ordered)
    }

    companion object {
        fun from(chapter: ChapterDefinition) = ChapterEntity(chapter.number, chapter.bossHealth, chapter.bossTimeLimitMs)
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
) {
    fun toDomain() = StageDefinition(number, phasesPerStage, monsterHealth, minibossHealth, minibossTimeLimitMs)

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
        )
    }
}
