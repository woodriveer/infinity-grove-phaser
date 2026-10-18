package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.CardDropRates
import br.com.woodriver.infinity_grove_ws.port.ChanceRollerPort
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.concurrent.ThreadLocalRandom

/** Card settings bound from `app.cards.*`: a miniboss drops a card 1 %, the chapter boss 10 %, at most 10 chapter boss wins a day. */
@ConfigurationProperties("app.cards")
data class CardProperties(
    val minibossRate: Double = 0.01,
    val chapterBossRate: Double = 0.10,
    val chapterBossDailyLimit: Int = 10,
    val farmMinIntervalMs: Long = 5000,
)

@Configuration
@EnableConfigurationProperties(CardProperties::class)
class CardConfig {
    /** Values are validated when [CardDropRates] is built, so startup fails on a bad setting. */
    @Bean
    fun cardDropRates(properties: CardProperties) =
        CardDropRates(properties.minibossRate, properties.chapterBossRate, properties.chapterBossDailyLimit, properties.farmMinIntervalMs)

    @Bean
    fun chanceRoller(): ChanceRollerPort = RandomChanceRoller()
}

class RandomChanceRoller : ChanceRollerPort {
    override fun roll(): Double = ThreadLocalRandom.current().nextDouble()
}
