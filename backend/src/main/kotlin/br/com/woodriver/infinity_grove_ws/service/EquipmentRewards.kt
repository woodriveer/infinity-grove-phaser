package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.EquipmentDrop
import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import br.com.woodriver.infinity_grove_ws.domain.PieceRoller
import br.com.woodriver.infinity_grove_ws.domain.PlayerEquipment
import br.com.woodriver.infinity_grove_ws.port.ChanceRollerPort
import br.com.woodriver.infinity_grove_ws.port.EquipmentRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.IdGeneratorPort
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

/**
 * What a won boss gives the player in equipment: a rolled piece for the bag, or its sell price when the bag is full. Shared by the campaign
 * and the farm. The caller holds the player lock (the `player_cards` row), so two drops never overfill the bag.
 */
@Component
class EquipmentRewards(
    private val equipmentRepository: EquipmentRepositoryPort,
    private val walletAccess: WalletAccess,
    private val chanceRoller: ChanceRollerPort,
    private val ids: IdGeneratorPort,
    private val rules: EquipmentRules,
) {
    fun award(
        username: String,
        encounter: Encounter,
        chapter: Int,
    ): EquipmentDrop? {
        val piece = PieceRoller.roll(encounter, rules, username, ids.next(), chanceRoller::roll, chapter) ?: return null
        val bag = PlayerEquipment(username, equipmentRepository.findAll(username), rules.bagCapacity)
        if (bag.isFull) {
            val price = piece.sellPrice()
            walletAccess.save(walletAccess.lock(username).plus(price))
            logger.info(
                "Equipment dropped into a full bag, sold username={} rarity={} slot={} copper={}",
                username,
                piece.rarity,
                piece.slot,
                price,
            )
            return EquipmentDrop(piece, sold = true)
        }
        equipmentRepository.save(piece)
        logger.info("Equipment dropped username={} piece={} rarity={} slot={}", username, piece.id, piece.rarity, piece.slot)
        return EquipmentDrop(piece, sold = false)
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(EquipmentRewards::class.java)
    }
}
