package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.Wallet
import br.com.woodriver.infinity_grove_ws.port.WalletRepositoryPort
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

interface JpaWalletRepository : JpaRepository<WalletEntity, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from WalletEntity w where w.username = :username")
    fun findForUpdate(
        @Param("username") username: String,
    ): WalletEntity?

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(
        value = "insert into wallets (username, copper) values (:username, :copper) on conflict (username) do nothing",
        nativeQuery = true,
    )
    fun insertIfAbsent(
        @Param("username") username: String,
        @Param("copper") copper: Long,
    ): Int
}

interface JpaWalletDropQueueRepository : JpaRepository<WalletDropQueueEntity, String> {
    fun findAllByUsername(username: String): List<WalletDropQueueEntity>

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(
        value =
            "insert into wallet_drop_queues (id, username, drop_rule_id, drops, allowance, allowance_updated_at) " +
                "values (:id, :username, :dropRuleId, :drops, :allowance, :allowanceUpdatedAt) on conflict (id) do nothing",
        nativeQuery = true,
    )
    fun insertIfAbsent(
        @Param("id") id: String,
        @Param("username") username: String,
        @Param("dropRuleId") dropRuleId: Int,
        @Param("drops") drops: String,
        @Param("allowance") allowance: Int,
        @Param("allowanceUpdatedAt") allowanceUpdatedAt: Long,
    ): Int

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from WalletDropQueueEntity q where q.username = :username")
    fun deleteAllByUsername(
        @Param("username") username: String,
    ): Int
}

@Repository
class WalletRepository(
    private val jpaWalletRepository: JpaWalletRepository,
    private val jpaWalletDropQueueRepository: JpaWalletDropQueueRepository,
) : WalletRepositoryPort {
    @Transactional
    override fun findForUpdate(username: String): Wallet? {
        val wallet = jpaWalletRepository.findForUpdate(username) ?: return null
        return wallet.toDomain(jpaWalletDropQueueRepository.findAllByUsername(username))
    }

    @Transactional
    override fun createIfAbsent(wallet: Wallet) {
        jpaWalletRepository.insertIfAbsent(wallet.username, wallet.copper)
        wallet.queues.values.forEach {
            val row = WalletDropQueueEntity.from(wallet.username, it)
            jpaWalletDropQueueRepository.insertIfAbsent(
                row.id,
                row.username,
                row.dropRuleId,
                row.drops,
                row.allowance,
                row.allowanceUpdatedAt,
            )
        }
    }

    @Transactional
    override fun save(wallet: Wallet): Wallet {
        jpaWalletRepository.save(WalletEntity.from(wallet))
        jpaWalletDropQueueRepository.saveAll(wallet.queues.values.map { WalletDropQueueEntity.from(wallet.username, it) })
        return wallet
    }

    @Transactional
    override fun deleteByUsername(username: String) {
        jpaWalletDropQueueRepository.deleteAllByUsername(username)
        jpaWalletRepository.deleteById(username)
    }
}
