package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.Hero
import br.com.woodriver.infinity_grove_ws.domain.HeroNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.HeroView
import br.com.woodriver.infinity_grove_ws.domain.HeroesView
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.PlayerCardsMissingException
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.HeroRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.PlayerCardsRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.FuseCardsUseCase
import br.com.woodriver.infinity_grove_ws.usecase.ListHeroesUseCase
import br.com.woodriver.infinity_grove_ws.usecase.SetLeaderUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class HeroService(
    private val heroRepository: HeroRepositoryPort,
    private val playerCardsRepository: PlayerCardsRepositoryPort,
    private val userRepository: UserRepositoryPort,
) : ListHeroesUseCase,
    FuseCardsUseCase,
    SetLeaderUseCase {
    override fun list(username: String): HeroesView {
        logger.info("Listing heroes username={}", username)
        val cards = load(username)
        return HeroesView(cards.leaderId, heroRepository.findAll().map { HeroView.of(it, cards) })
    }

    override fun fuse(
        username: String,
        heroId: String,
        stars: Int,
    ): HeroView {
        logger.info("Fusion requested username={} hero={} stars={}", username, heroId, stars)
        val hero = requireHero(heroId)
        val fused = load(username).fuse(heroId, stars)
        playerCardsRepository.save(fused)
        return HeroView.of(hero, fused)
    }

    override fun setLeader(
        username: String,
        heroId: String,
    ): String {
        logger.info("Setting leader username={} hero={}", username, heroId)
        requireHero(heroId)
        val changed = load(username).withLeader(heroId)
        playerCardsRepository.save(changed)
        return changed.leaderId
    }

    private fun requireHero(heroId: String): Hero =
        heroRepository.findById(heroId) ?: run {
            logger.warn("Hero request rejected, hero not found hero={}", heroId)
            throw HeroNotFoundException(heroId)
        }

    /** Returns the locked cards of the player; a user that does not exist or has no cards is an error. */
    private fun load(username: String): PlayerCards {
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Hero request rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
        return playerCardsRepository.findForUpdate(username) ?: run {
            logger.warn("Hero request rejected, player has no cards username={}", username)
            throw PlayerCardsMissingException(username)
        }
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(HeroService::class.java)
    }
}
