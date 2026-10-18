package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.BossNotAvailableException
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.ChapterNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.FarmBoss
import br.com.woodriver.infinity_grove_ws.domain.FarmResult
import br.com.woodriver.infinity_grove_ws.domain.FarmState
import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.domain.PlayerCardsMissingException
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.ChapterRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.PlayerCardsRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.ProgressRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.GetFarmUseCase
import br.com.woodriver.infinity_grove_ws.usecase.ReportFarmUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class FarmService(
    private val progressRepository: ProgressRepositoryPort,
    private val chapterRepository: ChapterRepositoryPort,
    private val userRepository: UserRepositoryPort,
    private val playerCardsRepository: PlayerCardsRepositoryPort,
    private val rewards: CardRewards,
) : GetFarmUseCase,
    ReportFarmUseCase {
    override fun state(username: String): FarmState {
        logger.info("Getting farm state username={}", username)
        val progress = loadProgress(username)
        val cards = loadCards(username)
        return FarmState(FarmBoss.beaten(progress, chapterOf(progress)), winsLeft(cards))
    }

    override fun report(
        username: String,
        boss: FarmBoss,
        outcome: Outcome,
    ): FarmResult {
        logger.info("Reporting farm outcome username={} boss={} outcome={}", username, boss.label(), outcome)
        val progress = loadProgress(username)
        if (boss !in FarmBoss.beaten(progress, chapterOf(progress))) {
            logger.warn("Farm report rejected, boss not beaten username={} boss={}", username, boss.label())
            throw BossNotAvailableException(boss.label())
        }
        val cards = loadCards(username)
        if (outcome == Outcome.FAILED) return FarmResult(null, winsLeft(cards))

        val rates = rewards.rates()
        if (boss.kind == Encounter.CHAPTER_BOSS) cards.bosses.requireWinsLeft(rewards.today(), rates.chapterBossDailyLimit)
        val spaced = cards.withBosses(cards.bosses.afterFarmWin(rewards.now(), rates.farmMinIntervalMs))
        val (updated, drop) = rewards.award(spaced, boss.kind, progress.position.chapter)
        playerCardsRepository.save(updated)
        return FarmResult(drop, winsLeft(updated))
    }

    private fun winsLeft(cards: PlayerCards) = cards.bosses.winsLeft(rewards.today(), rewards.rates().chapterBossDailyLimit)

    /** Returns the locked progress; a player who never reported anything is at the start of the campaign. */
    private fun loadProgress(username: String): Progress {
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Farm request rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
        return progressRepository.findForUpdate(username) ?: Progress.start(username)
    }

    private fun loadCards(username: String): PlayerCards =
        playerCardsRepository.findForUpdate(username) ?: run {
            logger.warn("Farm request rejected, player has no cards username={}", username)
            throw PlayerCardsMissingException(username)
        }

    private fun chapterOf(progress: Progress): ChapterDefinition =
        chapterRepository.findByNumber(progress.position.chapter) ?: throw ChapterNotFoundException(progress.position.chapter)

    private companion object {
        private val logger = LoggerFactory.getLogger(FarmService::class.java)
    }
}
