package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.HeroView
import br.com.woodriver.infinity_grove_ws.domain.HeroesView

interface ListHeroesUseCase {
    /** Returns the whole catalog as the player sees it: chapters, copies, stars and unlocked skills, and the leader. */
    fun list(username: String): HeroesView
}

interface FuseCardsUseCase {
    /** Turns 3 cards of [heroId] with [stars] stars (0 to 2) into one card of the next stars. */
    fun fuse(
        username: String,
        heroId: String,
        stars: Int,
    ): HeroView
}

interface SetLeaderUseCase {
    /** Makes [heroId], which the player must own, the leader and returns its id. */
    fun setLeader(
        username: String,
        heroId: String,
    ): String
}
