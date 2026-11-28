package br.com.woodriver.infinity_grove_ws.domain

/**
 * The click power of spec rankings: the leader's `Dano de clique` plus the team's `Dano da equipe por clique`, from the stored pieces,
 * stars, talents and team. Mirrors `leaderAttacker` and `allyDamagePerClick` of the game; `click-power-cases.json` pins both.
 */
object ClickPower {
    /** Click damage percent of the leader's stars, 0 to 9 (game `STAR_BONUS[stars].clickDamagePct`). */
    val STAR_CLICK_PCT: List<Int> = listOf(0, 10, 20, 40, 70, 100, 130, 160, 190, 220)

    /** Multiplier of an ally's stars, 0 to 9 (game `ALLY_STAR_MULTIPLIER`). */
    val ALLY_STAR_MULTIPLIER: List<Int> = listOf(2, 4, 6, 8, 10, 12, 14, 16, 18, 20)

    const val TEAM_FIRST_CHAPTER = 5
    const val TEAM_BOOSTER = "seraphine"
    const val TEAM_BOOST = 1.25

    /** A hero as the power reads it: its stars and the pieces it wears. */
    data class Member(
        val heroId: String,
        val stars: Int,
        val pieces: List<Piece>,
    )

    /** `leaderClick + teamClick` of spec § Click power. [talentLevels] is talent id -> level (all grades). */
    fun of(
        leader: Member,
        allies: List<Member>,
        talentLevels: Map<String, Int>,
        teamActive: Boolean,
    ): Double {
        val leaderClick =
            (1 + weapon(leader) + talentValue(talentLevels, "CLICK_FLAT_DAMAGE")) *
                (1 + (clickPct(leader) + STAR_CLICK_PCT.getOrElse(leader.stars) { 0 } + talentValue(talentLevels, "CLICK_DAMAGE")) / 100.0)
        val factor = if (teamActive && allies.any { it.heroId == TEAM_BOOSTER }) TEAM_BOOST else 1.0
        val teamClick =
            allies.sumOf { ally ->
                (1 + weapon(ally)) * (1 + clickPct(ally) / 100.0) * ALLY_STAR_MULTIPLIER.getOrElse(ally.stars) { ALLY_STAR_MULTIPLIER[0] } *
                    factor
            }
        return leaderClick + teamClick
    }

    /** The heroes of ally slots 1 to `boughtSlots`, in slot order. */
    fun allies(team: Team): List<String> = team.allies.take(team.boughtSlots).filterNotNull()

    /** The team fights from chapter 5 and in a completed campaign (game `teamActive`). */
    fun teamActive(progress: Progress): Boolean = progress.completed || progress.position.chapter >= TEAM_FIRST_CHAPTER

    /** The sum of `valueAt(level)` over the grades of [baseId]; ids the catalog does not know add nothing. */
    fun talentValue(
        talentLevels: Map<String, Int>,
        baseId: String,
    ): Int =
        talentLevels.entries.sumOf { (id, level) ->
            TalentCatalog.all.firstOrNull { it.id == id && it.baseId == baseId }?.valueAt(level) ?: 0
        }

    private fun weapon(member: Member): Double = member.pieces.firstOrNull { it.slot == Slot.WEAPON }?.clickDamage() ?: 0.0

    private fun clickPct(member: Member): Int =
        member.pieces.sumOf { piece -> piece.affixes.filter { it.type == AffixType.CLICK_DAMAGE_PCT }.sumOf { piece.value(it) } }
}
