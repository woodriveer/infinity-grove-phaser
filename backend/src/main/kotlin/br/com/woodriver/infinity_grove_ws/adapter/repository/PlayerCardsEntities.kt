package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.BossRecord
import br.com.woodriver.infinity_grove_ws.domain.CopyKey
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.LocalDate

/** One row per player: the starting element, the leader and the chapter boss record (cleared chapters comma-separated). */
@Entity
@Table(name = "player_cards")
class PlayerCardsEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(name = "starting_element", nullable = false, length = 32)
    var startingElement: String,
    @Column(name = "leader_id", nullable = false)
    var leaderId: String,
    @Column(name = "cleared_chapters", nullable = false, length = 64)
    var clearedChapters: String,
    @Column(name = "wins_day", length = 10)
    var winsDay: String?,
    @Column(name = "wins_today", nullable = false)
    var winsToday: Int,
    @Column(name = "last_farm_win_at")
    var lastFarmWinAt: Long?,
) {
    fun toDomain(copies: List<CardCopyEntity>) =
        PlayerCards(
            username = username,
            startingElement = Element.valueOf(startingElement),
            leaderId = leaderId,
            copies = copies.associate { CopyKey(it.heroId, it.stars) to it.copies },
            bosses =
                BossRecord(
                    clearedChapters = if (clearedChapters.isEmpty()) emptySet() else clearedChapters.split(",").map(String::toInt).toSet(),
                    winsDay = winsDay?.let(LocalDate::parse),
                    winsToday = winsToday,
                    lastFarmWinAt = lastFarmWinAt,
                ),
        )

    companion object {
        fun from(cards: PlayerCards) =
            PlayerCardsEntity(
                username = cards.username,
                startingElement = cards.startingElement.name,
                leaderId = cards.leaderId,
                clearedChapters =
                    cards.bosses.clearedChapters
                        .sorted()
                        .joinToString(","),
                winsDay = cards.bosses.winsDay?.toString(),
                winsToday = cards.bosses.winsToday,
                lastFarmWinAt = cards.bosses.lastFarmWinAt,
            )
    }
}

/** One row per player, hero and stars: how many cards of that kind the bag holds. */
@Entity
@Table(name = "card_copies", indexes = [Index(name = "idx_card_copies_username", columnList = "username")])
class CardCopyEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var id: String,
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(name = "hero_id", nullable = false, updatable = false)
    var heroId: String,
    @Column(nullable = false, updatable = false)
    var stars: Int,
    @Column(nullable = false)
    var copies: Int,
) {
    companion object {
        fun idOf(
            username: String,
            heroId: String,
            stars: Int,
        ) = "$username/$heroId/$stars"

        fun from(
            username: String,
            key: CopyKey,
            copies: Int,
        ) = CardCopyEntity(idOf(username, key.heroId, key.stars), username, key.heroId, key.stars, copies)
    }
}
