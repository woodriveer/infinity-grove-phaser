package br.com.woodriver.infinity_grove_ws.domain

/** A skill of a hero as one player sees it: unlocked when the hero has at least as many stars as the skill slot; [level] 0 to 3. */
data class SkillView(
    val skill: Skill,
    val unlocked: Boolean,
    val level: Int,
) {
    companion object {
        /**
         * 0 while locked; otherwise 1 + (stars - slot) / 3 (integer division): each star from 4 to 9 raises one skill in slot order
         * (4 slot 1, 5 slot 2, 6 slot 3, 7 slot 1, 8 slot 2, 9 slot 3), so a 9-star hero has every skill at level 3
         * (spec hero-ascension, Skill Levels).
         */
        fun levelOf(
            stars: Int,
            slot: Int,
        ): Int = if (stars < slot) 0 else 1 + (stars - slot) / 3
    }
}

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
                skills = hero.skills.map { SkillView(it, unlocked = stars >= it.slot, level = SkillView.levelOf(stars, it.slot)) },
            )
        }
    }
}

/** Every hero of the catalog as one player sees them, and the id of their leader. */
data class HeroesView(
    val leaderId: String,
    val heroes: List<HeroView>,
)
