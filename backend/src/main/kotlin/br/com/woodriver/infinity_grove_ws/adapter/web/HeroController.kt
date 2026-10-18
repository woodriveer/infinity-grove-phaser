package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.HeroView
import br.com.woodriver.infinity_grove_ws.domain.HeroesView
import br.com.woodriver.infinity_grove_ws.domain.InvalidFusionException
import br.com.woodriver.infinity_grove_ws.domain.SkillView
import br.com.woodriver.infinity_grove_ws.usecase.FuseCardsUseCase
import br.com.woodriver.infinity_grove_ws.usecase.ListHeroesUseCase
import br.com.woodriver.infinity_grove_ws.usecase.SetLeaderUseCase
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

data class SkillResponse(
    val slot: Int,
    val name: String,
    val type: String,
    val effect: String,
    val cooldownSeconds: Int,
    val image: String,
    val unlocked: Boolean,
) {
    companion object {
        fun from(view: SkillView) =
            SkillResponse(
                slot = view.skill.slot,
                name = view.skill.name,
                type = view.skill.type,
                effect = view.skill.effect,
                cooldownSeconds = view.skill.cooldownSeconds,
                image = view.skill.image,
                unlocked = view.unlocked,
            )
    }
}

data class HeroResponse(
    val id: String,
    val name: String,
    val heroClass: String,
    val element: String,
    val leaderBonus: String,
    val portrait: String,
    val chapter: Int,
    val owned: Boolean,
    val stars: Int,
    val copies: Map<String, Int>,
    val skills: List<SkillResponse>,
) {
    companion object {
        fun from(view: HeroView) =
            HeroResponse(
                id = view.hero.id,
                name = view.hero.name,
                heroClass = view.hero.heroClass,
                element = view.hero.element.name,
                leaderBonus = view.hero.leaderBonus,
                portrait = view.hero.portrait,
                chapter = view.chapter,
                owned = view.owned,
                stars = view.stars,
                copies = view.copies.mapKeys { it.key.toString() },
                skills = view.skills.map(SkillResponse::from),
            )
    }
}

data class HeroesResponse(
    val leaderId: String,
    val heroes: List<HeroResponse>,
) {
    companion object {
        fun from(view: HeroesView) = HeroesResponse(view.leaderId, view.heroes.map(HeroResponse::from))
    }
}

data class LeaderResponse(
    val leaderId: String,
)

@RestController
class HeroController(
    private val listHeroes: ListHeroesUseCase,
    private val fuseCards: FuseCardsUseCase,
    private val setLeader: SetLeaderUseCase,
) {
    @GetMapping("/heroes")
    fun list(principal: Principal) = HeroesResponse.from(listHeroes.list(principal.name))

    @PostMapping("/heroes/{id}/fuse")
    fun fuse(
        principal: Principal,
        @PathVariable id: String,
        @RequestBody body: Map<String, Any?>,
    ): HeroResponse {
        val stars = body["stars"] as? Int ?: throw InvalidFusionException("stars must be an integer")
        return HeroResponse.from(fuseCards.fuse(principal.name, id, stars))
    }

    @PutMapping("/leader")
    fun leader(
        principal: Principal,
        @RequestBody body: Map<String, Any?>,
    ): LeaderResponse {
        val heroId = body["heroId"] as? String
        require(!heroId.isNullOrBlank()) { "heroId must not be blank" }
        return LeaderResponse(setLeader.setLeader(principal.name, heroId))
    }
}
