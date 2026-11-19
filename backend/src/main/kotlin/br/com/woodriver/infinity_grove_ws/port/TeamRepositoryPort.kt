package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.Team

interface TeamRepositoryPort {
    /** The team of [username]; a player with no row bought no slot and has no ally: `Team()`. */
    fun find(username: String): Team

    /** Stores the whole team of [username] in its one row. */
    fun save(
        username: String,
        team: Team,
    )
}
