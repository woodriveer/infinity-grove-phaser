package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.LevelDrops
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
    fun toDomain(levels: List<WalletLevelEntity>) = Wallet(username, copper, levels.associate { it.level to it.toDomain() })

    companion object {
        fun from(wallet: Wallet) = WalletEntity(wallet.username, wallet.copper)
    }
}

/** One row per player and monster level: the drop queue (comma-separated) and the allowance bucket. */
@Entity
@Table(name = "wallet_levels", indexes = [Index(name = "idx_wallet_levels_username", columnList = "username")])
class WalletLevelEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var id: String,
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(nullable = false, updatable = false)
    var level: Int,
    @Column(nullable = false, length = 512)
    var drops: String,
    @Column(nullable = false)
    var allowance: Int,
    @Column(name = "allowance_updated_at", nullable = false)
    var allowanceUpdatedAt: Long,
) {
    fun toDomain() =
        LevelDrops(level, if (drops.isEmpty()) emptyList() else drops.split(",").map(String::toInt), allowance, allowanceUpdatedAt)

    companion object {
        fun idOf(
            username: String,
            level: Int,
        ) = "$username/$level"

        fun from(
            username: String,
            drops: LevelDrops,
        ) = WalletLevelEntity(
            id = idOf(username, drops.level),
            username = username,
            level = drops.level,
            drops = drops.queue.joinToString(","),
            allowance = drops.allowance,
            allowanceUpdatedAt = drops.allowanceUpdatedAt,
        )
    }
}
