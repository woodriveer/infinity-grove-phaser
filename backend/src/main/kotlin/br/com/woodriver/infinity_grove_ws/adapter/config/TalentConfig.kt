package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.TalentRules
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/** Talent settings bound from `app.talents.*`: the upgrade from level `n` costs `round(300 x 1.6^n)` copper unless tuned. */
@ConfigurationProperties("app.talents")
data class TalentProperties(
    val baseCost: Long = 300,
    val growth: Double = 1.6,
)

@Configuration
@EnableConfigurationProperties(TalentProperties::class)
class TalentConfig {
    /** Values are validated when [TalentRules] is built, so startup fails on a bad setting. */
    @Bean
    fun talentRules(properties: TalentProperties) = TalentRules(baseCost = properties.baseCost, growth = properties.growth)
}
