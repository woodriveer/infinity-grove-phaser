package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.LegacyChapter
import br.com.woodriver.infinity_grove_ws.domain.ResetRequestException
import br.com.woodriver.infinity_grove_ws.usecase.AfterReset
import br.com.woodriver.infinity_grove_ws.usecase.GetLegacyUseCase
import br.com.woodriver.infinity_grove_ws.usecase.LegacyView
import br.com.woodriver.infinity_grove_ws.usecase.ResetAccountUseCase
import br.com.woodriver.infinity_grove_ws.usecase.ResetResult
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

/** One chapter of the legacy and its percent. */
data class LegacyChapterResponse(
    val chapter: Int,
    val percent: Int,
) {
    companion object {
        fun from(legacy: LegacyChapter) = LegacyChapterResponse(legacy.chapter, legacy.percent)
    }
}

/** What the next reset would leave: the chapter it counts, that chapter's percent after it and the best legacy after it. */
data class AfterResetResponse(
    val chapter: Int,
    val percent: Int,
    val best: LegacyChapterResponse?,
) {
    companion object {
        fun from(afterReset: AfterReset) =
            AfterResetResponse(afterReset.chapter, afterReset.percent, afterReset.best?.let(LegacyChapterResponse::from))
    }
}

/** The legacy of the account resets: every stored chapter ascending, the best one and the preview of the next reset (null while it is closed). */
data class LegacyResponse(
    val chapters: List<LegacyChapterResponse>,
    val best: LegacyChapterResponse?,
    val afterReset: AfterResetResponse?,
) {
    companion object {
        fun from(view: LegacyView) =
            LegacyResponse(
                view.legacy.chapters().map(LegacyChapterResponse::from),
                view.legacy.best()?.let(LegacyChapterResponse::from),
                view.afterReset?.let(AfterResetResponse::from),
            )
    }
}

/** What a reset paid and left: the reward, the crystals and the resets after it, the campaign as the progress endpoint shows it and the legacy. */
data class ResetResponse(
    val reward: Int,
    val crystals: Long,
    val resets: Int,
    val progress: ProgressResponse,
    val legacy: LegacyResponse,
) {
    companion object {
        fun from(result: ResetResult) =
            ResetResponse(
                result.reward,
                result.crystals,
                result.resets,
                ProgressResponse.from(result.view),
                LegacyResponse.from(LegacyView.of(result.legacy, result.view.progress)),
            )
    }
}

@RestController
@RequestMapping("/account")
class AccountResetController(
    private val resetAccount: ResetAccountUseCase,
    private val getLegacy: GetLegacyUseCase,
) {
    @PostMapping("/reset")
    fun reset(
        principal: Principal,
        @RequestBody body: Map<String, Any?>,
    ): ResetResponse {
        val fromChapter = body["fromChapter"] as? Int ?: throw ResetRequestException("fromChapter must be an integer")
        return ResetResponse.from(resetAccount.reset(principal.name, fromChapter))
    }

    @GetMapping("/legacy")
    fun legacy(principal: Principal): LegacyResponse = LegacyResponse.from(getLegacy.legacy(principal.name))
}
