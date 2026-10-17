package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.DropTable
import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.concurrent.ThreadLocalRandom

/** One `app.wallet.drop-table` entry. Values are validated when the [DropRule] is built, so startup fails on a bad entry. */
data class DropRuleProperties(
    val level: Int,
    val minCopper: Int,
    val maxCopper: Int,
    val killIntervalMs: Long,
)

/** Wallet settings bound from `app.wallet.*`. Level 1 drops 1 to 5 copper and allows one kill per 1500 ms by default. */
@ConfigurationProperties("app.wallet")
data class WalletProperties(
    val dropTable: List<DropRuleProperties> = listOf(DropRuleProperties(level = 1, minCopper = 1, maxCopper = 5, killIntervalMs = 1500)),
)

@Configuration
@EnableConfigurationProperties(WalletProperties::class)
class WalletConfig {
    @Bean
    fun dropTable(properties: WalletProperties) =
        DropTable(properties.dropTable.map { DropRule(it.level, it.minCopper, it.maxCopper, it.killIntervalMs) })

    @Bean
    fun dropRoller(): DropRollerPort = RandomDropRoller()
}

class RandomDropRoller : DropRollerPort {
    override fun roll(
        min: Int,
        max: Int,
    ): Int = ThreadLocalRandom.current().nextInt(min, max + 1)
}
