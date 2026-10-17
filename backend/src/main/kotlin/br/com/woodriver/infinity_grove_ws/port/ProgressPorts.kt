package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.Progress

interface ProgressRepositoryPort {
    /** Returns the progress and locks it until the surrounding transaction ends, so concurrent reports run one after the other. */
    fun findForUpdate(username: String): Progress?

    /** Stores [progress] only when the player has none yet; a concurrent insert for the same player is not an error. */
    fun createIfAbsent(progress: Progress)

    fun save(progress: Progress): Progress

    fun deleteByUsername(username: String)
}

interface ChapterRepositoryPort {
    fun findByNumber(number: Int): ChapterDefinition?

    fun existsByNumber(number: Int): Boolean

    fun save(chapter: ChapterDefinition): ChapterDefinition
}
