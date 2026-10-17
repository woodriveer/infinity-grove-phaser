package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.InvalidOutcomeException
import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.ProgressView
import br.com.woodriver.infinity_grove_ws.domain.StageDefinition
import br.com.woodriver.infinity_grove_ws.usecase.GetProgressUseCase
import br.com.woodriver.infinity_grove_ws.usecase.ReportOutcomeUseCase
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

data class StageResponse(
    val number: Int,
    val phasesPerStage: Int,
    val monsterHealth: Int,
    val minibossHealth: Int,
    val minibossTimeLimitMs: Long,
) {
    companion object {
        fun from(stage: StageDefinition) =
            StageResponse(stage.number, stage.phasesPerStage, stage.monsterHealth, stage.minibossHealth, stage.minibossTimeLimitMs)
    }
}

data class ChapterResponse(
    val bossHealth: Int,
    val bossTimeLimitMs: Long,
    val stages: List<StageResponse>,
) {
    companion object {
        fun from(chapter: ChapterDefinition): ChapterResponse {
            val stages = chapter.stages.map(StageResponse::from)
            return ChapterResponse(chapter.bossHealth, chapter.bossTimeLimitMs, stages)
        }
    }
}

data class ProgressResponse(
    val chapter: Int,
    val stage: Int,
    val encounter: String,
    val phase: Int,
    val completed: Boolean,
    val definition: ChapterResponse,
) {
    companion object {
        fun from(view: ProgressView): ProgressResponse {
            val position = view.progress.position
            return ProgressResponse(
                chapter = position.chapter,
                stage = position.stage,
                encounter = position.encounter.name,
                phase = position.phase,
                completed = view.progress.completed,
                definition = ChapterResponse.from(view.chapter),
            )
        }
    }
}

@RestController
@RequestMapping("/progress")
class ProgressController(
    private val getProgress: GetProgressUseCase,
    private val reportOutcome: ReportOutcomeUseCase,
) {
    @GetMapping
    fun get(principal: Principal) = ProgressResponse.from(getProgress.get(principal.name))

    @PostMapping("/outcome")
    fun outcome(
        principal: Principal,
        @RequestBody body: Map<String, Any?>,
    ): ProgressResponse {
        val position = parsePosition(body)
        val outcome = parseOutcome(body)
        return ProgressResponse.from(reportOutcome.report(principal.name, position, outcome))
    }

    private fun parsePosition(body: Map<String, Any?>) =
        ProgressPosition(
            chapter = positive(body, "chapter"),
            stage = positive(body, "stage"),
            encounter = enumOf<Encounter>(body, "encounter"),
            phase = positive(body, "phase"),
        )

    private fun parseOutcome(body: Map<String, Any?>) = enumOf<Outcome>(body, "outcome")

    private fun positive(
        body: Map<String, Any?>,
        field: String,
    ): Int {
        val value = body[field] as? Int ?: throw InvalidOutcomeException("$field must be an integer")
        if (value < 1) throw InvalidOutcomeException("$field must be at least 1")
        return value
    }

    private inline fun <reified E : Enum<E>> enumOf(
        body: Map<String, Any?>,
        field: String,
    ): E {
        val text = body[field] as? String ?: throw InvalidOutcomeException("$field is required")
        return enumValues<E>().firstOrNull { it.name == text } ?: throw InvalidOutcomeException("$field '$text' is unknown")
    }
}
