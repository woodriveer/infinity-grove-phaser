package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.Team
import br.com.woodriver.infinity_grove_ws.port.TeamRepositoryPort
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

/** One row per player who bought an ally slot: the bought count and the hero of each ally slot. */
@Entity
@Table(name = "player_team")
class TeamEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(name = "bought_slots", nullable = false)
    var boughtSlots: Int,
    @Column(name = "ally_1")
    var ally1: String?,
    @Column(name = "ally_2")
    var ally2: String?,
    @Column(name = "ally_3")
    var ally3: String?,
    @Column(name = "ally_4")
    var ally4: String?,
) {
    fun toDomain() = Team(boughtSlots, listOf(ally1, ally2, ally3, ally4))

    companion object {
        fun from(
            username: String,
            team: Team,
        ) = TeamEntity(username, team.boughtSlots, team.allies[0], team.allies[1], team.allies[2], team.allies[3])
    }
}

interface JpaTeamRepository : JpaRepository<TeamEntity, String>

@Repository
class TeamRepository(
    private val jpaTeamRepository: JpaTeamRepository,
) : TeamRepositoryPort {
    @Transactional
    override fun find(username: String): Team = jpaTeamRepository.findById(username).map { it.toDomain() }.orElse(Team())

    @Transactional
    override fun save(
        username: String,
        team: Team,
    ) {
        jpaTeamRepository.save(TeamEntity.from(username, team))
    }
}
