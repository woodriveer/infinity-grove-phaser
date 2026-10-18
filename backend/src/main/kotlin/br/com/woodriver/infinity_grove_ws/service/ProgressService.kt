package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.CardDrop
import br.com.woodriver.infinity_grove_ws.domain.CardDropRates
import br.com.woodriver.infinity_grove_ws.domain.CardDropper
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.ChapterNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.ProgressView
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.ChanceRollerPort
import br.com.woodriver.infinity_grove_ws.port.ChapterRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.HeroRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.PlayerCardsRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.ProgressRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.GetProgressUseCase
import br.com.woodriver.infinity_grove_ws.usecase.OutcomeResult
import br.com.woodriver.infinity_grove_ws.usecase.ReportOutcomeUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneOffset

@Service
@Transactional
class ProgressService(
    private val progressRepository: ProgressRepositoryPort,
    private val chapterRepository: ChapterRepositoryPort,
    private val userRepository: UserRepositoryPort,
    private val playerCardsRepository: PlayerCardsRepositoryPort,
    private val heroRepository: HeroRepositoryPort,
    private val chanceRoller: ChanceRollerPort,
    private val dropRates: CardDropRates,
    private val clock: Clock,
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
        val drop = if (outcome == Outcome.CLEARED) awardCards(username, position) else null
        return OutcomeResult(next.view(chapter), drop)
    }

    /** Rolls the card of a won boss under the cards row lock, records a chapter boss win, and stores what changed. */
    private fun awardCards(
        username: String,
        position: ProgressPosition,
    ): CardDrop? {
        if (position.encounter == Encounter.PHASE) return null
        val cards =
            playerCardsRepository.findForUpdate(username) ?: run {
                logger.warn("No cards to award username={} encounter={}", username, position.encounter)
                return null
            }
        val chapterBoss = position.encounter == Encounter.CHAPTER_BOSS
        val hero =
            CardDropper.drop(
                position.encounter,
                position.chapter,
                cards.startingElement,
                firstChapterBossWin = chapterBoss && !cards.bosses.hasWon(position.chapter),
                rates = dropRates,
                heroes = heroRepository.findAll(),
                chance = chanceRoller::roll,
            )
        var updated = cards
        if (chapterBoss) {
            updated =
                updated.withBosses(cards.bosses.afterChapterBossWin(position.chapter, LocalDate.now(clock.withZone(ZoneOffset.UTC))))
        }
        if (hero != null) {
            updated = updated.add(hero.id)
            logger.info("Card dropped username={} hero={} source={}", username, hero.id, position.encounter)
        }
        if (updated != cards) playerCardsRepository.save(updated)
        return hero?.let { CardDrop(it.id, it.name) }
    }

    /** Returns the locked progress, creating it first when the player has none. */
    private fun load(username: String): Progress {
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Progress request rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
        return progressRepository.findForUpdate(username) ?: run {
            progressRepository.createIfAbsent(Progress.start(username))
            progressRepository.findForUpdate(username) ?: error("Progress for '$username' vanished after creation")
        }
    }

    private fun chapterOf(progress: Progress): ChapterDefinition =
        chapterRepository.findByNumber(progress.position.chapter) ?: run {
            logger.error("Chapter missing for progress username={} chapter={}", progress.username, progress.position.chapter)
            throw ChapterNotFoundException(progress.position.chapter)
        }

    private companion object {
        private val logger = LoggerFactory.getLogger(ProgressService::class.java)
    }
}
