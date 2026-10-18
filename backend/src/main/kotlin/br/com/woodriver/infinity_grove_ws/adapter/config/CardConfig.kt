package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.CardDropRates
import br.com.woodriver.infinity_grove_ws.port.ChanceRollerPort
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.concurrent.ThreadLocalRandom

/**
 * Card settings bound from `app.cards.*`: the miniboss of stage n drops a card at 2 % times n (2 % to 20 % over a chapter), a repeated
 * chapter boss win at 30 % (10 % above the last miniboss), at most 10 chapter boss wins a day.
 */
@ConfigurationProperties("app.cards")
data class CardProperties(
    val minibossRatePerStage: Double = 0.02,
    val chapterBossRate: Double = 0.30,
    val chapterBossDailyLimit: Int = 10,
    val farmMinIntervalMs: Long = 5000,
)

@Configuration
@EnableConfigurationProperties(CardProperties::class)
class CardConfig {
    /** Values are validated when [CardDropRates] is built, so startup fails on a bad setting. */
    @Bean
    fun cardDropRates(properties: CardProperties) =
        CardDropRates(
            properties.minibossRatePerStage,
            properties.chapterBossRate,
            properties.chapterBossDailyLimit,
            properties.farmMinIntervalMs,
        )

    @Bean
    fun chanceRoller(): ChanceRollerPort = RandomChanceRoller()
}

class RandomChanceRoller : ChanceRollerPort {
    override fun roll(): Double = ThreadLocalRandom.current().nextDouble()
}
