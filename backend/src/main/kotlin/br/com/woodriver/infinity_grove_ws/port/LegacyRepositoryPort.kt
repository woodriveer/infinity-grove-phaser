package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.ResetLegacy

interface LegacyRepositoryPort {
    /** The legacy of the player, empty when they have no row. */
    fun find(username: String): ResetLegacy

    /** Writes every chapter of [legacy] (insert or update); a chapter is never removed. */
    fun save(legacy: ResetLegacy)
}
