package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.Coins
import br.com.woodriver.infinity_grove_ws.domain.InvalidKillsException
import br.com.woodriver.infinity_grove_ws.domain.UnknownDropRuleException
import br.com.woodriver.infinity_grove_ws.domain.Wallet
import br.com.woodriver.infinity_grove_ws.usecase.GetDropTableUseCase
import br.com.woodriver.infinity_grove_ws.usecase.GetWalletUseCase
import br.com.woodriver.infinity_grove_ws.usecase.SyncKillsUseCase
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.math.BigInteger
import java.security.Principal

data class CoinsResponse(
    val gold: Long,
    val silver: Int,
    val copper: Int,
) {
    companion object {
        fun from(coins: Coins) = CoinsResponse(coins.gold, coins.silver, coins.copper)
    }
}

/** `drops` is keyed by drop rule id as a string, e.g. `{ "1": [3, 1, 5, ...] }`. */
data class WalletResponse(
    val wallet: CoinsResponse,
    val drops: Map<String, List<Int>>,
)

data class SyncResponse(
    val wallet: CoinsResponse,
    val accepted: Map<String, Int>,
    val drops: Map<String, List<Int>>,
)

@RestController
@RequestMapping("/wallet")
class WalletController(
    private val getWallet: GetWalletUseCase,
    private val syncKills: SyncKillsUseCase,
    private val getDropTable: GetDropTableUseCase,
) {
    @GetMapping
    fun get(principal: Principal): WalletResponse {
        val wallet = getWallet.get(principal.name)
        return WalletResponse(CoinsResponse.from(wallet.coins()), dropsOf(wallet))
    }

    @PostMapping("/sync")
    fun sync(
        principal: Principal,
        @RequestBody body: Map<String, Any?>,
    ): SyncResponse {
        val result = syncKills.sync(principal.name, parseKills(body))
        return SyncResponse(
            wallet = CoinsResponse.from(result.wallet.coins()),
            accepted = result.accepted.mapKeys { it.key.toString() },
            drops = dropsOf(result.wallet),
        )
    }

    private fun dropsOf(wallet: Wallet) = wallet.dropsFor(getDropTable.dropTable()).mapKeys { it.key.toString() }

    private fun parseKills(body: Map<String, Any?>): Map<Int, Int> {
        val kills = body["kills"] as? Map<*, *> ?: throw InvalidKillsException("kills must be an object of counts keyed by level")
        return kills.entries.associate { (key, count) ->
            val ruleId = key.toString().toIntOrNull() ?: throw UnknownDropRuleException(key.toString())
            ruleId to parseCount(key.toString(), count)
        }
    }

    private fun parseCount(
        level: String,
        count: Any?,
    ): Int {
        val value =
            when (count) {
                is Int -> count.toLong().toBigInteger()
                is Long -> count.toBigInteger()
                is BigInteger -> count
                else -> throw InvalidKillsException("the count of level $level must be an integer")
            }
        if (value.signum() < 0) throw InvalidKillsException("the count of level $level must not be negative")
        return value.min(Int.MAX_VALUE.toBigInteger()).toInt()
    }
}
