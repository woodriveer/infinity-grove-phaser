package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import br.com.woodriver.infinity_grove_ws.port.IdGeneratorPort
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.UUID

/**
 * Equipment settings bound from `app.equipment.*`: a miniboss win drops a piece at 25 %, the chapter boss at 100 %, the bag holds 100
 * pieces, a refine from +0 costs 500 copper (times the rarity) and rerolling an affix 5000. The affix ranges and rarities are in the domain.
 */
@ConfigurationProperties("app.equipment")
data class EquipmentProperties(
    val minibossRate: Double = 0.25,
    val chapterBossRate: Double = 1.0,
    val bagCapacity: Int = 100,
    val refineBaseCost: Long = 500,
    val rerollCost: Long = 5000,
)

@Configuration
@EnableConfigurationProperties(EquipmentProperties::class)
class EquipmentConfig {
    /** Values are validated when [EquipmentRules] is built, so startup fails on a bad setting. */
    @Bean
    fun equipmentRules(properties: EquipmentProperties) =
        EquipmentRules(
            minibossRate = properties.minibossRate,
            chapterBossRate = properties.chapterBossRate,
            bagCapacity = properties.bagCapacity,
            refineBaseCost = properties.refineBaseCost,
            rerollCost = properties.rerollCost,
        )

    @Bean
    fun idGenerator(): IdGeneratorPort = UuidIdGenerator()
}

class UuidIdGenerator : IdGeneratorPort {
    override fun next(): String = UUID.randomUUID().toString()
}
