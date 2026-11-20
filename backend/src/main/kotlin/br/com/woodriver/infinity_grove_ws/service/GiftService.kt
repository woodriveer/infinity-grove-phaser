package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.GiftClaim
import br.com.woodriver.infinity_grove_ws.domain.GiftDay
import br.com.woodriver.infinity_grove_ws.domain.GiftGrant
import br.com.woodriver.infinity_grove_ws.domain.PieceRoller
import br.com.woodriver.infinity_grove_ws.domain.PlayerCardsMissingException
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.ChanceRollerPort
import br.com.woodriver.infinity_grove_ws.port.EquipmentRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.GiftCalendarPort
import br.com.woodriver.infinity_grove_ws.port.GiftRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.IdGeneratorPort
import br.com.woodriver.infinity_grove_ws.port.PlayerCardsRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.ClaimGiftUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

/**
 * Grants the Cajado da Consciência Negra once per account on November 20 (America/Sao_Paulo). It takes the player lock like every
 * equipment change, so it serialises with drops, sales and refines; the unique key of `player_gifts` is the second guard. The staff is
 * stored even when the bag is full (spec black-awareness-staff D6).
 */
@Service
@Transactional
class GiftService(
    private val giftRepository: GiftRepositoryPort,
    private val calendar: GiftCalendarPort,
    private val equipmentRepository: EquipmentRepositoryPort,
    private val playerCardsRepository: PlayerCardsRepositoryPort,
    private val userRepository: UserRepositoryPort,
    private val chanceRoller: ChanceRollerPort,
    private val ids: IdGeneratorPort,
    private val clock: Clock,
) : ClaimGiftUseCase {
    override fun claim(username: String): GiftClaim {
        logger.info("Gift claim requested username={}", username)
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Gift claim rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
        if (!GiftDay.isGiftDay(calendar.today())) return GiftClaim(null)
        playerCardsRepository.findForUpdate(username) ?: run {
            logger.warn("Gift claim rejected, player has no cards username={}", username)
            throw PlayerCardsMissingException(username)
        }
        if (giftRepository.exists(username, GiftDay.STAFF_GIFT_ID)) {
            logger.info("Gift already granted username={}", username)
            return GiftClaim(null)
        }
        val piece = PieceRoller.blackAwarenessStaff(username, ids.next(), chanceRoller::roll)
        equipmentRepository.save(piece)
        giftRepository.save(GiftGrant(username, GiftDay.STAFF_GIFT_ID, piece.id, clock.millis()))
        logger.info("Gift granted username={} gift={} piece={}", username, GiftDay.STAFF_GIFT_ID, piece.id)
        return GiftClaim(piece)
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(GiftService::class.java)
    }
}
