package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.AutoClickRequestException
import br.com.woodriver.infinity_grove_ws.domain.AutoClickRules
import br.com.woodriver.infinity_grove_ws.domain.PlayerAutoClick
import br.com.woodriver.infinity_grove_ws.usecase.GetAutoClickUseCase
import br.com.woodriver.infinity_grove_ws.usecase.UpgradeAutoClickUseCase
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

/** The upgrade after the current level: the level it reaches, its click interval and its price in crystals. */
data class AutoClickStepResponse(
    val level: Int,
    val intervalMs: Int,
    val price: Long,
)

/**
 * The auto click as the game shows it: the level, the top level, the click interval now, the crystals, the next upgrade (null at the top)
 * and how many times the player reset the account (from 1 the auto click works in chapter 1).
 */
data class AutoClickResponse(
    val level: Int,
    val maxLevel: Int,
    val intervalMs: Int,
    val crystals: Long,
    val next: AutoClickStepResponse?,
    val resets: Int,
) {
    companion object {
        fun from(
            autoClick: PlayerAutoClick,
            rules: AutoClickRules,
        ) = AutoClickResponse(
            level = autoClick.level,
            maxLevel = rules.maxLevel,
            intervalMs = autoClick.intervalMs(rules),
            crystals = autoClick.crystals,
            next = autoClick.next(rules)?.let { AutoClickStepResponse(it.level, it.intervalMs, it.price) },
            resets = autoClick.resets,
        )
    }
}

@RestController
@RequestMapping("/auto-click")
class AutoClickController(
    private val getAutoClick: GetAutoClickUseCase,
    private val upgradeAutoClick: UpgradeAutoClickUseCase,
    private val rules: AutoClickRules,
) {
    @GetMapping
    fun get(principal: Principal) = AutoClickResponse.from(getAutoClick.get(principal.name), rules)

    @PostMapping("/upgrade")
    fun upgrade(
        principal: Principal,
        @RequestBody body: Map<String, Any?>,
    ): AutoClickResponse {
        val fromLevel = body["fromLevel"] as? Int ?: throw AutoClickRequestException("fromLevel must be an integer")
        return AutoClickResponse.from(upgradeAutoClick.upgrade(principal.name, fromLevel), rules)
    }
}
