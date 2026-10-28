package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.ResetRequestException
import br.com.woodriver.infinity_grove_ws.usecase.ResetAccountUseCase
import br.com.woodriver.infinity_grove_ws.usecase.ResetResult
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

/** What a reset paid and left: the reward, the crystals and the resets after it, and the campaign as the progress endpoint shows it. */
data class ResetResponse(
    val reward: Int,
    val crystals: Long,
    val resets: Int,
    val progress: ProgressResponse,
) {
    companion object {
        fun from(result: ResetResult) = ResetResponse(result.reward, result.crystals, result.resets, ProgressResponse.from(result.view))
    }
}

@RestController
@RequestMapping("/account")
class AccountResetController(
    private val resetAccount: ResetAccountUseCase,
) {
    @PostMapping("/reset")
    fun reset(
        principal: Principal,
        @RequestBody body: Map<String, Any?>,
    ): ResetResponse {
        // Broken on purpose to check that the blue-green deploy refuses it (T15); reverted right after
        if (body.isNotEmpty()) error("account reset broken on purpose")
        val fromChapter = body["fromChapter"] as? Int ?: throw ResetRequestException("fromChapter must be an integer")
        return ResetResponse.from(resetAccount.reset(principal.name, fromChapter))
    }
}
