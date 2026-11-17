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
    private val equipmentRewards: EquipmentRewards,
) : GetFarmUseCase,
    ReportFarmUseCase {
    override fun state(
        username: String,
        chapter: Int?,
    ): FarmState {
        require(chapter == null || chapter >= 1) { FarmBoss.CHAPTER_MESSAGE }
        logger.info("Getting farm state username={} chapter={}", username, chapter)
        val progress = loadProgress(username)
        val cards = loadCards(username)
        val current = progress.position.chapter
        val listed = minOf(chapter ?: current, current)
        val definition = chapterOf(listed)
        return FarmState(FarmBoss.beaten(progress, definition), winsLeft(cards), listed, FarmBoss.reachedChapters(progress), definition)
    }

    override fun report(
        username: String,
        boss: FarmBoss,
        outcome: Outcome,
        chapter: Int?,
    ): FarmResult {
        require(chapter == null || chapter >= 1) { FarmBoss.CHAPTER_MESSAGE }
        logger.info("Reporting farm outcome username={} boss={} chapter={} outcome={}", username, boss.label(), chapter, outcome)
        val progress = loadProgress(username)
        val fought = chapter ?: progress.position.chapter
        if (fought > progress.position.chapter || boss !in FarmBoss.beaten(progress, chapterOf(fought))) {
            logger.warn("Farm report rejected, boss not beaten username={} boss={} chapter={}", username, boss.label(), fought)
            throw BossNotAvailableException(boss.label())
        }
        val cards = loadCards(username)
        if (outcome == Outcome.FAILED) return FarmResult(null, winsLeft(cards))

        val rates = rewards.rates()
        if (boss.kind == Encounter.CHAPTER_BOSS) cards.bosses.requireWinsLeft(rewards.today(), rates.chapterBossDailyLimit)
        val spaced = cards.withBosses(cards.bosses.afterFarmWin(rewards.now(), rates.farmMinIntervalMs))
        // A farmed miniboss rolls the chance of its own stage; the chapter boss has no stage
        val (updated, drop) = rewards.award(spaced, boss.kind, fought, boss.stage ?: 0, fromFarm = true)
        playerCardsRepository.save(updated)
        return FarmResult(drop, winsLeft(updated), equipmentRewards.award(username, boss.kind, fought))
    }

    private fun winsLeft(cards: PlayerCards) = cards.bosses.winsLeft(rewards.today(), rewards.rates().chapterBossDailyLimit)

    /** Returns the locked progress with the next chapter open, as [ProgressService] does; a player who never reported starts the campaign. */
    private fun loadProgress(username: String): Progress {
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Farm request rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
        return progressRepository.findForUpdate(username)?.withNextChapterOpen() ?: Progress.start(username)
    }

    private fun loadCards(username: String): PlayerCards =
        playerCardsRepository.findForUpdate(username) ?: run {
            logger.warn("Farm request rejected, player has no cards username={}", username)
            throw PlayerCardsMissingException(username)
        }

    private fun chapterOf(number: Int): ChapterDefinition = chapterRepository.findByNumber(number) ?: throw ChapterNotFoundException(number)

    private companion object {
        private val logger = LoggerFactory.getLogger(FarmService::class.java)
    }
}
