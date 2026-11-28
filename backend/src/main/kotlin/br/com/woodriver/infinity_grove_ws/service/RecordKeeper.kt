package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.ChapterOrder
import br.com.woodriver.infinity_grove_ws.domain.ClickPower
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.RecordRules
import br.com.woodriver.infinity_grove_ws.domain.RunClock
import br.com.woodriver.infinity_grove_ws.port.ChapterRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.EquipmentRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.PlayerCardsRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.RankingRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.ResetRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.TalentRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.TeamRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.RecordKeeping
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.time.Clock

/**
 * Turns the game events into the ranking clocks and records (spec rankings, Record Rules). It runs inside the transaction of the service
 * that raised the event, after that service saved its own state, so a failure here rolls the whole request back.
 */
@Component
class RecordKeeper(
    private val rankings: RankingRepositoryPort,
    private val users: UserRepositoryPort,
    private val resets: ResetRepositoryPort,
    private val chapters: ChapterRepositoryPort,
    private val playerCards: PlayerCardsRepositoryPort,
    private val equipment: EquipmentRepositoryPort,
    private val teams: TeamRepositoryPort,
    private val talents: TalentRepositoryPort,
    private val clock: Clock,
) : RecordKeeping {
    override fun onProgressLoaded(
        username: String,
        progress: Progress,
    ) {
        val current = rankings.clock(username)
        saveIfMoved(current, current.afterLoad(progress, clock.millis()))
    }

    override fun onOutcome(
        username: String,
        reported: ProgressPosition,
        outcome: Outcome,
        next: Progress,
    ) {
        val now = clock.millis()
        val bossEvent =
            reported.encounter == Encounter.CHAPTER_BOSS ||
                (outcome == Outcome.CLEARED && !next.completed && next.position.encounter == Encounter.CHAPTER_BOSS)
        if (bossEvent) {
            val current = rankings.clock(username)
            if (outcome == Outcome.CLEARED && reported.encounter == Encounter.CHAPTER_BOSS) {
                current.bossTime(now)?.let { recordBoss(username, reported.chapter, it, now) }
                if (next.completed) recordStory(username, current, now)
            }
            saveIfMoved(current, current.afterOutcome(reported, outcome, next, now))
        }
        if (outcome == Outcome.CLEARED && reported.encounter != Encounter.PHASE) recordClickPower(username, next)
    }

    override fun onFarmWin(
        username: String,
        campaign: Progress,
    ) {
        val current = rankings.clock(username)
        saveIfMoved(current, current.afterFarmWin(campaign, clock.millis()))
        recordClickPower(username, campaign)
    }

    override fun onReset(username: String) {
        rankings.saveClock(rankings.clock(username).afterReset(clock.millis()))
    }

    /** Computes the click power of [username] from the stored state at [progress], keeps it when bigger, and returns it; null with no cards row. */
    fun recordClickPower(
        username: String,
        progress: Progress,
    ): Double? {
        val cards = playerCards.findForUpdate(username) ?: return null
        val pieces = equipment.findAll(username)
        val member = { id: String -> ClickPower.Member(id, cards.starsOf(id), pieces.filter { it.heroId == id }) }
        val power =
            ClickPower.of(
                member(cards.leaderId),
                ClickPower.allies(teams.find(username)).map(member),
                talents.findAll(username),
                ClickPower.teamActive(progress),
            )
        val stored = rankings.improveClickPower(username, power, clock.millis())
        logger.info("Click power username={} power={} stored={}", username, power, stored)
        return power
    }

    private fun saveIfMoved(
        before: RunClock,
        after: RunClock,
    ) {
        if (after != before) rankings.saveClock(after)
    }

    private fun recordBoss(
        username: String,
        chapter: Int,
        ms: Long,
        now: Long,
    ) {
        if (!RecordRules.bossTimePlausible(ms)) {
            logger.warn("Boss time refused as implausible username={} chapter={} ms={}", username, chapter, ms)
            return
        }
        val stored = rankings.improveBossTime(username, chapter, ms, now)
        logger.info("Boss time username={} chapter={} ms={} stored={}", username, chapter, ms, stored)
    }

    private fun recordStory(
        username: String,
        current: RunClock,
        now: Long,
    ) {
        val user = users.findByUsername(username) ?: return
        val start = RecordRules.runStart(current, resets.count(username), user.createdAt)
        if (start == null) {
            logger.info("Story time not recorded, run start unknown username={}", username)
            return
        }
        val ms = now - start
        val floorMs = RecordRules.storyFloorMs((1..ChapterOrder.MAX_CHAPTER).mapNotNull { chapters.findByNumber(it) })
        if (!RecordRules.storyTimePlausible(ms, floorMs)) {
            logger.warn("Story time refused as implausible username={} ms={} floorMs={}", username, ms, floorMs)
            return
        }
        val stored = rankings.improveStoryTime(username, ms, now)
        logger.info("Story time username={} ms={} stored={}", username, ms, stored)
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(RecordKeeper::class.java)
    }
}
