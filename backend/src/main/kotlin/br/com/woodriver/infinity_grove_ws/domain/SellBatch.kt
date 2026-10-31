package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory

/** The ids of one batch sale: 1 to [MAX_SIZE] distinct piece ids, in the order the player sent them. */
data class SellBatch(
    val pieceIds: List<String>,
) {
    init {
        if (pieceIds.isEmpty()) reject("A sale needs at least one piece")
        if (pieceIds.size > MAX_SIZE) reject("A sale holds at most $MAX_SIZE pieces, got ${pieceIds.size}")
        if (pieceIds.toSet().size != pieceIds.size) reject("A sale must not list a piece twice")
    }

    private fun reject(reason: String): Nothing {
        logger.warn("Sell batch rejected size={} reason={}", pieceIds.size, reason)
        throw InvalidSellBatchException(reason)
    }

    companion object {
        const val MAX_SIZE = 100
        private val logger = LoggerFactory.getLogger(SellBatch::class.java)
    }
}
