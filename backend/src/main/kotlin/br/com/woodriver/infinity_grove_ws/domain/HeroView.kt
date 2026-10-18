package br.com.woodriver.infinity_grove_ws.domain

/** A skill of a hero as one player sees it: unlocked when the hero has at least as many stars as the skill slot. */
data class SkillView(
    val skill: Skill,
    val unlocked: Boolean,
)

/** A catalog hero as one player sees it: its chapter in the player's order, what they hold of it and which skills it unlocks. */
data class HeroView(
    val hero: Hero,
    val chapter: Int,
    val owned: Boolean,
    val stars: Int,
    val copies: Map<Int, Int>,
    val skills: List<SkillView>,
) {
    companion object {
        fun of(
            hero: Hero,
            cards: PlayerCards,
        ): HeroView {
            val stars = cards.starsOf(hero.id)
            return HeroView(
                hero = hero,
                chapter = ChapterOrder.chapterOf(cards.startingElement, hero.element),
                owned = cards.owned(hero.id),
                stars = stars,
                copies = (0..PlayerCards.MAX_STARS).associateWith { cards.copiesOf(hero.id, it) },
                skills = hero.skills.map { SkillView(it, unlocked = stars >= it.slot) },
            )
        }
    }
}

/** Every hero of the catalog as one player sees them, and the id of their leader. */
data class HeroesView(
    val leaderId: String,
    val heroes: List<HeroView>,
)
