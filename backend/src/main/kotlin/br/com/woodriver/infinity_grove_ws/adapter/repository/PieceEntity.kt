package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.Affix
import br.com.woodriver.infinity_grove_ws.domain.AffixType
import br.com.woodriver.infinity_grove_ws.domain.Piece
import br.com.woodriver.infinity_grove_ws.domain.Rarity
import br.com.woodriver.infinity_grove_ws.domain.Slot
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table

/** One row per piece of equipment; the affixes are `TYPE:base` pairs joined by commas, the same text style as the wallet queues. */
@Entity
@Table(name = "equipment_pieces", indexes = [Index(name = "idx_equipment_pieces_username", columnList = "username")])
class PieceEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var id: String,
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(nullable = false, updatable = false, length = 16)
    var slot: String,
    @Column(nullable = false, updatable = false, length = 16)
    var rarity: String,
    @Column(name = "base_click")
    var baseClick: Int?,
    @Column(nullable = false)
    var refine: Int,
    @Column(nullable = false, length = 256)
    var affixes: String,
    @Column(name = "hero_id")
    var heroId: String?,
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Long,
) {
    fun toDomain() =
        Piece(
            id = id,
            username = username,
            slot = Slot.valueOf(slot),
            rarity = Rarity.valueOf(rarity),
            baseClick = baseClick,
            refine = refine,
            affixes = if (affixes.isEmpty()) emptyList() else affixes.split(",").map(::parseAffix),
            heroId = heroId,
        )

    companion object {
        fun from(
            piece: Piece,
            createdAt: Long = System.currentTimeMillis(),
        ) = PieceEntity(
            id = piece.id,
            username = piece.username,
            slot = piece.slot.name,
            rarity = piece.rarity.name,
            baseClick = piece.baseClick,
            refine = piece.refine,
            affixes = piece.affixes.joinToString(",") { "${it.type.name}:${it.base}" },
            heroId = piece.heroId,
            createdAt = createdAt,
        )

        private fun parseAffix(text: String): Affix {
            val (type, base) = text.split(":")
            return Affix(AffixType.valueOf(type), base.toInt())
        }
    }
}
