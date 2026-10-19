package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.DropQueue
import br.com.woodriver.infinity_grove_ws.domain.Wallet
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table

@Entity
@Table(name = "wallets")
class WalletEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(nullable = false)
    var copper: Long,
) {
    fun toDomain(queues: List<WalletDropQueueEntity>) = Wallet(username, copper, queues.associate { it.dropRuleId to it.toDomain() })

    companion object {
        fun from(wallet: Wallet) = WalletEntity(wallet.username, wallet.copper)
    }
}

/** One row per player and drop rule: the drop queue (comma-separated) and the allowance bucket. */
@Entity
@Table(name = "wallet_drop_queues", indexes = [Index(name = "idx_wallet_drop_queues_username", columnList = "username")])
class WalletDropQueueEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var id: String,
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(name = "drop_rule_id", nullable = false, updatable = false)
    var dropRuleId: Int,
    @Column(nullable = false, length = 512)
    var drops: String,
    @Column(nullable = false)
    var allowance: Int,
    @Column(name = "allowance_updated_at", nullable = false)
    var allowanceUpdatedAt: Long,
) {
    fun toDomain() =
        DropQueue(dropRuleId, if (drops.isEmpty()) emptyList() else drops.split(",").map(String::toInt), allowance, allowanceUpdatedAt)

    companion object {
        fun idOf(
            username: String,
            ruleId: Int,
        ) = "$username/$ruleId"

        fun from(
            username: String,
            drops: DropQueue,
        ) = WalletDropQueueEntity(
            id = idOf(username, drops.ruleId),
            username = username,
            dropRuleId = drops.ruleId,
            drops = drops.queue.joinToString(","),
            allowance = drops.allowance,
            allowanceUpdatedAt = drops.allowanceUpdatedAt,
        )
    }
}
