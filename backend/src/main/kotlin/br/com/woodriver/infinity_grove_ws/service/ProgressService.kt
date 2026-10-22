package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.CardDrop
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.ChapterNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.EquipmentDrop
import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.ProgressView
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.ChapterRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.PlayerCardsRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.ProgressRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.GetProgressUseCase
import br.com.woodriver.infinity_grove_ws.usecase.OutcomeResult
import br.com.woodriver.infinity_grove_ws.usecase.ReportOutcomeUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class ProgressService(
    private val progressRepository: ProgressRepositoryPort,
    private val chapterRepository: ChapterRepositoryPort,
    private val userRepository: UserRepositoryPort,
    private val playerCardsRepository: PlayerCardsRepositoryPort,
    private val rewards: CardRewards,
    private val equipmentRewards: EquipmentRewards,
) : GetProgressUseCase,
    ReportOutcomeUseCase {
    override fun get(username: String): ProgressView {
        logger.info("Getting progress username={}", username)
        val progress = load(username)
        return progress.view(chapterOf(progress))
    }

    override fun report(
        username: String,
        position: ProgressPosition,
        outcome: Outcome,
    ): OutcomeResult {
        logger.info("Reporting outcome username={} outcome={}", username, outcome)
        val progress = load(username)
        val chapter = chapterOf(progress)
        val next = progress.report(position, outcome, chapter)
        progressRepository.save(next)
        val (drop, equipmentDrop) = if (outcome == Outcome.CLEARED) awardBoss(username, position) else NO_REWARDS
        return OutcomeResult(next.view(chapterOf(next)), drop, equipmentDrop)
    }

    /**
     * Rolls the card and the equipment of a won boss under the cards row lock (the player lock), records a chapter boss win, and stores
     * what changed. A player with no cards row gets neither.
     */
    private fun awardBoss(
        username: String,
        position: ProgressPosition,
    ): Pair<CardDrop?, EquipmentDrop?> {
        if (position.encounter == Encounter.PHASE) return NO_REWARDS
        val cards =
            playerCardsRepository.findForUpdate(username) ?: run {
                logger.warn("No cards to award username={} encounter={}", username, position.encounter)
                return NO_REWARDS
            }
        val (updated, drop) = rewards.award(cards, position.encounter, position.chapter, position.stage)
        if (updated != cards) playerCardsRepository.save(updated)
        return drop to equipmentRewards.award(username, position.encounter, position.chapter)
    }

    /** Returns the locked progress, creating it first when the player has none. */
    private fun load(username: String): Progress {
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Progress request rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
        val stored =
            progressRepository.findForUpdate(username) ?: run {
                progressRepository.createIfAbsent(Progress.start(username))
                progressRepository.findForUpdate(username) ?: error("Progress for '$username' vanished after creation")
            }
        val open = stored.withNextChapterOpen()
        if (open != stored) {
            logger.info("Opening the next chapter username={} chapter={}", username, open.position.chapter)
            progressRepository.save(open)
        }
        return open
    }

    private fun chapterOf(progress: Progress): ChapterDefinition =
        chapterRepository.findByNumber(progress.position.chapter) ?: run {
            logger.error("Chapter missing for progress username={} chapter={}", progress.username, progress.position.chapter)
            throw ChapterNotFoundException(progress.position.chapter)
        }

    private companion object {
        private val NO_REWARDS: Pair<CardDrop?, EquipmentDrop?> = null to null
        private val logger = LoggerFactory.getLogger(ProgressService::class.java)
    }
}
