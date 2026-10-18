package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class EquipmentConfigTest {
    private val config = EquipmentConfig()

    @Test
    fun `defaults are 25 percent, a sure chapter boss drop, 100 pieces, 500 to refine and 5000 to reroll`() {
        assertEquals(EquipmentRules(0.25, 1.0, 100, 500, 5000), config.equipmentRules(EquipmentProperties()))
    }

    @Test
    fun `configured values are used`() {
        val rules =
            config.equipmentRules(
                EquipmentProperties(minibossRate = 0.5, chapterBossRate = 0.75, bagCapacity = 10, refineBaseCost = 100, rerollCost = 900),
            )

        assertEquals(EquipmentRules(0.5, 0.75, 10, 100, 900), rules)
    }

    @Test
    fun `a rate outside 0 to 1, a bag below one or a negative cost fails startup`() {
        assertFailsWith<IllegalArgumentException> { config.equipmentRules(EquipmentProperties(minibossRate = 1.5)) }
        assertFailsWith<IllegalArgumentException> { config.equipmentRules(EquipmentProperties(chapterBossRate = -0.1)) }
        assertFailsWith<IllegalArgumentException> { config.equipmentRules(EquipmentProperties(bagCapacity = 0)) }
        assertFailsWith<IllegalArgumentException> { config.equipmentRules(EquipmentProperties(refineBaseCost = -1)) }
        assertFailsWith<IllegalArgumentException> { config.equipmentRules(EquipmentProperties(rerollCost = -1)) }
    }
}
