package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.AutoClickRules
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/** Auto click settings bound from `app.auto-click.*`: the interval of each level (500 to 50 ms) and the crystals of each upgrade. */
@ConfigurationProperties("app.auto-click")
data class AutoClickProperties(
    val intervalsMs: List<Int> = listOf(500, 250, 150, 100, 50),
    val prices: List<Long> = listOf(10, 25, 50, 100),
)

@Configuration
@EnableConfigurationProperties(AutoClickProperties::class)
class AutoClickConfig {
    /** Values are validated when [AutoClickRules] is built, so startup fails on a bad setting. */
    @Bean
    fun autoClickRules(properties: AutoClickProperties) = AutoClickRules(properties.intervalsMs, properties.prices)
}
