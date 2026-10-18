package br.com.woodriver.infinity_grove_ws.domain

/** One of the three skills of a hero. Skill [slot] n unlocks when the hero has n stars. [image] is the art file name. */
data class Skill(
    val slot: Int,
    val name: String,
    val type: String,
    val effect: String,
    val cooldownSeconds: Int,
    val image: String,
) {
    init {
        require(slot in 1..Hero.SKILL_COUNT) { "Skill slot $slot must be between 1 and ${Hero.SKILL_COUNT}" }
        require(name.isNotBlank()) { "Skill name must not be blank" }
        require(cooldownSeconds >= 1) { "Skill '$name' cooldown $cooldownSeconds must be at least 1" }
    }
}

/** A hero of the catalog. [portrait] is the art file name; [skills] hold exactly one skill per slot, in slot order. */
data class Hero(
    val id: String,
    val name: String,
    val heroClass: String,
    val element: Element,
    val leaderBonus: String,
    val portrait: String,
    val skills: List<Skill>,
) {
    init {
        require(id.isNotBlank()) { "Hero id must not be blank" }
        require(name.isNotBlank()) { "Hero '$id' name must not be blank" }
        require(skills.map { it.slot } == (1..SKILL_COUNT).toList()) {
            "Hero '$id' must have one skill per slot 1..$SKILL_COUNT in order, got ${skills.map { it.slot }}"
        }
    }

    companion object {
        const val SKILL_COUNT = 3
    }
}
