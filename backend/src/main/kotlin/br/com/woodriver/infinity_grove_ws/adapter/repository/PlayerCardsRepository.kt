package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.port.PlayerCardsRepositoryPort
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

interface JpaPlayerCardsRepository : JpaRepository<PlayerCardsEntity, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PlayerCardsEntity p where p.username = :username")
    fun findForUpdate(
        @Param("username") username: String,
    ): PlayerCardsEntity?

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(
        value =
            "insert into player_cards (username, starting_element, leader_id, cleared_chapters, wins_day, wins_today, last_farm_win_at) " +
                "values (:username, :startingElement, :leaderId, :clearedChapters, :winsDay, :winsToday, :lastFarmWinAt) " +
                "on conflict (username) do nothing",
        nativeQuery = true,
    )
    fun insertIfAbsent(
        @Param("username") username: String,
        @Param("startingElement") startingElement: String,
        @Param("leaderId") leaderId: String,
        @Param("clearedChapters") clearedChapters: String,
        @Param("winsDay") winsDay: String?,
        @Param("winsToday") winsToday: Int,
        @Param("lastFarmWinAt") lastFarmWinAt: Long?,
    ): Int
}

interface JpaCardCopyRepository : JpaRepository<CardCopyEntity, String> {
    fun findAllByUsername(username: String): List<CardCopyEntity>

    fun deleteAllByUsername(username: String)
}

@Repository
class PlayerCardsRepository(
    private val jpaPlayerCardsRepository: JpaPlayerCardsRepository,
    private val jpaCardCopyRepository: JpaCardCopyRepository,
) : PlayerCardsRepositoryPort {
    @Transactional
    override fun findForUpdate(username: String): PlayerCards? =
        jpaPlayerCardsRepository.findForUpdate(username)?.toDomain(jpaCardCopyRepository.findAllByUsername(username))

    @Transactional
    override fun createIfAbsent(cards: PlayerCards) {
        val row = PlayerCardsEntity.from(cards)
        val inserted =
            jpaPlayerCardsRepository.insertIfAbsent(
                row.username,
                row.startingElement,
                row.leaderId,
                row.clearedChapters,
                row.winsDay,
                row.winsToday,
                row.lastFarmWinAt,
            )
        if (inserted > 0) syncCopies(cards)
    }

    @Transactional
    override fun save(cards: PlayerCards): PlayerCards {
        jpaPlayerCardsRepository.save(PlayerCardsEntity.from(cards))
        syncCopies(cards)
        return cards
    }

    @Transactional
    override fun deleteByUsername(username: String) {
        jpaCardCopyRepository.deleteAllByUsername(username)
        jpaPlayerCardsRepository.deleteById(username)
    }

    /** Makes the copy rows of the player match [cards]: rows are written for every held stack and removed for the rest. */
    private fun syncCopies(cards: PlayerCards) {
        val wanted = cards.copies.map { (key, count) -> CardCopyEntity.from(cards.username, key, count) }
        val wantedIds = wanted.map { it.id }.toSet()
        jpaCardCopyRepository.deleteAll(jpaCardCopyRepository.findAllByUsername(cards.username).filter { it.id !in wantedIds })
        jpaCardCopyRepository.saveAll(wanted)
    }
}
