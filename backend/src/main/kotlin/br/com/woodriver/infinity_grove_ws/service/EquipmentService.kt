package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import br.com.woodriver.infinity_grove_ws.domain.HeroNotOwnedException
import br.com.woodriver.infinity_grove_ws.domain.MaxRefineException
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.PlayerCardsMissingException
import br.com.woodriver.infinity_grove_ws.domain.PlayerEquipment
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.ChanceRollerPort
import br.com.woodriver.infinity_grove_ws.port.EquipmentRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.PlayerCardsRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.EquipPieceUseCase
import br.com.woodriver.infinity_grove_ws.usecase.EquipmentChange
import br.com.woodriver.infinity_grove_ws.usecase.ListEquipmentUseCase
import br.com.woodriver.infinity_grove_ws.usecase.RefinePieceUseCase
import br.com.woodriver.infinity_grove_ws.usecase.RerollAffixUseCase
import br.com.woodriver.infinity_grove_ws.usecase.SellPieceUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/** Every change takes the `player_cards` row first (the player lock, see ADR 0008), then anything else it touches. */
@Service
@Transactional
class EquipmentService(
    private val equipmentRepository: EquipmentRepositoryPort,
    private val playerCardsRepository: PlayerCardsRepositoryPort,
    private val userRepository: UserRepositoryPort,
    private val walletAccess: WalletAccess,
    private val chanceRoller: ChanceRollerPort,
    private val rules: EquipmentRules,
) : ListEquipmentUseCase,
    EquipPieceUseCase,
    RefinePieceUseCase,
    RerollAffixUseCase,
    SellPieceUseCase {
    override fun list(username: String): PlayerEquipment {
        logger.info("Listing equipment username={}", username)
        requireUser(username)
        return load(username)
    }

    override fun equip(
        username: String,
        pieceId: String,
        heroId: String,
    ): PlayerEquipment {
        logger.info("Equip requested username={} piece={} hero={}", username, pieceId, heroId)
        val cards = lockPlayer(username)
        val before = load(username)
        before.find(pieceId)
        if (!cards.owned(heroId)) {
            logger.warn("Equip rejected, hero not owned username={} hero={}", username, heroId)
            throw HeroNotOwnedException(heroId)
        }
        return store(before, before.equip(pieceId, heroId))
    }

    override fun unequip(
        username: String,
        pieceId: String,
    ): PlayerEquipment {
        logger.info("Unequip requested username={} piece={}", username, pieceId)
        lockPlayer(username)
        val before = load(username)
        return store(before, before.unequip(pieceId))
    }

    override fun refine(
        username: String,
        pieceId: String,
    ): EquipmentChange {
        logger.info("Refine requested username={} piece={}", username, pieceId)
        lockPlayer(username)
        val before = load(username)
        val piece = before.find(pieceId)
        val cost = piece.refineCost(rules) ?: throw MaxRefineException()
        val wallet = walletAccess.lock(username).minus(cost)
        val after = before.replace(piece.refined())
        walletAccess.save(wallet)
        logger.info("Refined username={} piece={} level={} copper={}", username, pieceId, piece.refine + 1, cost)
        return EquipmentChange(store(before, after), wallet)
    }

    override fun reroll(
        username: String,
        pieceId: String,
        affixIndex: Int,
    ): EquipmentChange {
        logger.info("Reroll requested username={} piece={} affix={}", username, pieceId, affixIndex)
        lockPlayer(username)
        val before = load(username)
        val piece = before.find(pieceId)
        val rerolled = piece.rerolled(affixIndex, chanceRoller::roll)
        val cost = piece.rerollCost(rules) ?: error("A piece that can be rerolled has a reroll cost")
        val wallet = walletAccess.lock(username).minus(cost)
        walletAccess.save(wallet)
        logger.info("Rerolled username={} piece={} affix={} copper={}", username, pieceId, affixIndex, cost)
        return EquipmentChange(store(before, before.replace(rerolled)), wallet)
    }

    override fun sell(
        username: String,
        pieceId: String,
    ): EquipmentChange {
        logger.info("Sell requested username={} piece={}", username, pieceId)
        lockPlayer(username)
        val before = load(username)
        val piece = before.find(pieceId)
        val wallet = walletAccess.lock(username).plus(piece.sellPrice())
        walletAccess.save(wallet)
        logger.info("Sold username={} piece={} copper={}", username, pieceId, piece.sellPrice())
        return EquipmentChange(store(before, before.remove(pieceId)), wallet)
    }

    /** Writes the pieces [after] changed or removed compared to [before]. */
    private fun store(
        before: PlayerEquipment,
        after: PlayerEquipment,
    ): PlayerEquipment {
        after.pieces.filter { it !in before.pieces }.forEach(equipmentRepository::save)
        val kept = after.pieces.map { it.id }.toSet()
        before.pieces.filter { it.id !in kept }.forEach { equipmentRepository.delete(it.id) }
        return after
    }

    private fun load(username: String) = PlayerEquipment(username, equipmentRepository.findAll(username), rules.bagCapacity)

    private fun requireUser(username: String) {
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Equipment request rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
    }

    /** The player lock: the cards row, held until the transaction ends. */
    private fun lockPlayer(username: String): PlayerCards {
        requireUser(username)
        return playerCardsRepository.findForUpdate(username) ?: run {
            logger.warn("Equipment request rejected, player has no cards username={}", username)
            throw PlayerCardsMissingException(username)
        }
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(EquipmentService::class.java)
    }
}
