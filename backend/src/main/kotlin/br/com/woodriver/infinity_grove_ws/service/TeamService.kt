package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.LeaderChange
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.PlayerCardsMissingException
import br.com.woodriver.infinity_grove_ws.domain.SlotPurchase
import br.com.woodriver.infinity_grove_ws.domain.Team
import br.com.woodriver.infinity_grove_ws.domain.TeamView
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.HeroRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.PlayerCardsRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.TeamRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.BuyTeamSlotUseCase
import br.com.woodriver.infinity_grove_ws.usecase.SaveTeamUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/** Every change takes the `player_cards` row first (the player lock, ADR 0008), then the wallet for a purchase (lock order AD-009). */
@Service
@Transactional
class TeamService(
    private val playerCardsRepository: PlayerCardsRepositoryPort,
    private val teamRepository: TeamRepositoryPort,
    private val heroRepository: HeroRepositoryPort,
    private val userRepository: UserRepositoryPort,
    private val walletAccess: WalletAccess,
) : SaveTeamUseCase,
    BuyTeamSlotUseCase {
    override fun saveAllies(
        username: String,
        allies: List<String?>,
    ): LeaderChange {
        logger.info("Team save requested username={} allies={}", username, allies)
        val cards = lockPlayer(username)
        val saved = teamRepository.find(username).withAllies(allies, cards, heroRepository::existsById)
        teamRepository.save(username, saved)
        logger.info("Team saved username={} slots={} allies={}", username, saved.boughtSlots, saved.allies)
        return LeaderChange(cards.leaderId, TeamView.of(saved, cards.bosses))
    }

    override fun buySlot(
        username: String,
        fromSlots: Int,
    ): SlotPurchase {
        logger.info("Team slot purchase requested username={} fromSlots={}", username, fromSlots)
        val cards = lockPlayer(username)
        val bought = teamRepository.find(username).buy(username, fromSlots, cards.bosses)
        val price = Team.SLOT_PRICES[fromSlots]
        val wallet = walletAccess.lock(username).minus(price)
        teamRepository.save(username, bought)
        walletAccess.save(wallet)
        logger.info("Team slot bought username={} slots={} price={} copper={}", username, bought.boughtSlots, price, wallet.copper)
        return SlotPurchase(TeamView.of(bought, cards.bosses), wallet)
    }

    /** Returns the locked cards of the player; a user that does not exist or has no cards is an error. */
    private fun lockPlayer(username: String): PlayerCards {
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Team request rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
        return playerCardsRepository.findForUpdate(username) ?: run {
            logger.warn("Team request rejected, player has no cards username={}", username)
            throw PlayerCardsMissingException(username)
        }
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(TeamService::class.java)
    }
}
