package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.CardDrop
import br.com.woodriver.infinity_grove_ws.domain.CardDropRates
import br.com.woodriver.infinity_grove_ws.domain.CardDropper
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.port.ChanceRollerPort
import br.com.woodriver.infinity_grove_ws.port.HeroRepositoryPort
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneOffset

/** What a won boss gives the player's cards: the rolled card, if any, and the chapter boss win it counts. Shared by the campaign and the farm. */
@Component
class CardRewards(
    private val heroRepository: HeroRepositoryPort,
    private val chanceRoller: ChanceRollerPort,
    private val dropRates: CardDropRates,
    private val clock: Clock,
) {
    /** The current date in UTC, the day the chapter boss wins are counted on. */
    fun today(): LocalDate = LocalDate.now(clock.withZone(ZoneOffset.UTC))

    fun now(): Long = clock.millis()

    fun rates() = dropRates

    /** Rolls the card of a won [encounter] of [chapter] and returns the cards with it added and the chapter boss win recorded. */
    fun award(
        cards: PlayerCards,
        encounter: Encounter,
        chapter: Int,
    ): Pair<PlayerCards, CardDrop?> {
        val chapterBoss = encounter == Encounter.CHAPTER_BOSS
        val hero =
            CardDropper.drop(
                encounter,
                chapter,
                cards.startingElement,
                firstChapterBossWin = chapterBoss && !cards.bosses.hasWon(chapter),
                rates = dropRates,
                heroes = heroRepository.findAll(),
                chance = chanceRoller::roll,
            )
        var updated = cards
        if (chapterBoss) updated = updated.withBosses(cards.bosses.afterChapterBossWin(chapter, today()))
        if (hero != null) {
            updated = updated.add(hero.id)
            logger.info("Card dropped username={} hero={} source={}", cards.username, hero.id, encounter)
        }
        return updated to hero?.let { CardDrop(it.id, it.name) }
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(CardRewards::class.java)
    }
}
