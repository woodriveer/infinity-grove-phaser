package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.TalentRules
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/** Talent settings bound from `app.talents.*`: a level costs 1 point; a first clear pays 0 points (phase), 2 (miniboss) or 5 (chapter boss). */
@ConfigurationProperties("app.talents")
data class TalentProperties(
    val costPerLevel: Int = 1,
    val pointsPerPhase: Int = 0,
    val pointsPerMiniboss: Int = 2,
    val pointsPerChapterBoss: Int = 5,
)

@Configuration
@EnableConfigurationProperties(TalentProperties::class)
class TalentConfig {
    /** Values are validated when [TalentRules] is built, so startup fails on a bad setting. */
    @Bean
    fun talentRules(properties: TalentProperties) =
        TalentRules(
            costPerLevel = properties.costPerLevel,
            pointsPerPhase = properties.pointsPerPhase,
            pointsPerMiniboss = properties.pointsPerMiniboss,
            pointsPerChapterBoss = properties.pointsPerChapterBoss,
        )
}
