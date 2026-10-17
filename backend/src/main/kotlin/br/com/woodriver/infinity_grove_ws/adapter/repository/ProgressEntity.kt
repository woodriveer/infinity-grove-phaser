package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

/** One row per player: where they stand in the campaign. */
@Entity
@Table(name = "progress")
class ProgressEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(nullable = false)
    var chapter: Int,
    @Column(nullable = false)
    var stage: Int,
    @Column(nullable = false, length = 32)
    var encounter: String,
    @Column(nullable = false)
    var phase: Int,
    @Column(nullable = false)
    var completed: Boolean,
) {
    fun toDomain() = Progress(username, ProgressPosition(chapter, stage, Encounter.valueOf(encounter), phase), completed)

    companion object {
        fun from(progress: Progress) =
            ProgressEntity(
                username = progress.username,
                chapter = progress.position.chapter,
                stage = progress.position.stage,
                encounter = progress.position.encounter.name,
                phase = progress.position.phase,
                completed = progress.completed,
            )
    }
}
