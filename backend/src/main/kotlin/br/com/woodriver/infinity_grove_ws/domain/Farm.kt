package br.com.woodriver.infinity_grove_ws.domain

/** A boss the player may fight again: the miniboss of [stage], or the chapter boss (no stage). */
data class FarmBoss(
    val kind: Encounter,
    val stage: Int? = null,
) {
    init {
        when (kind) {
            Encounter.MINIBOSS -> require(stage != null && stage >= 1) { "A miniboss needs a stage of at least 1" }
            Encounter.CHAPTER_BOSS -> require(stage == null) { "The chapter boss has no stage" }
            Encounter.PHASE -> throw IllegalArgumentException("A phase monster cannot be fought again")
        }
    }

    fun label() = if (kind == Encounter.MINIBOSS) "MINIBOSS $stage" else kind.name

    companion object {
        /**
         * The bosses the player has beaten, in stage order: the miniboss of every stage below the current one, the miniboss of the
         * current stage once the chapter boss is next, every miniboss and the chapter boss once the campaign is completed.
         */
        fun beaten(
            progress: Progress,
            chapter: ChapterDefinition,
        ): List<FarmBoss> {
            val position = progress.position
            val minibosses =
                (1..chapter.stageCount).filter { stage ->
                    progress.completed ||
                        stage < position.stage ||
                        (stage == position.stage && position.encounter == Encounter.CHAPTER_BOSS)
                }
            val chapterBoss = if (progress.completed) listOf(FarmBoss(Encounter.CHAPTER_BOSS)) else emptyList()
            return minibosses.map { FarmBoss(Encounter.MINIBOSS, it) } + chapterBoss
        }
    }
}

/** The bosses to choose from and the chapter boss wins left today. */
data class FarmState(
    val bosses: List<FarmBoss>,
    val chapterBossWinsLeft: Int,
)

/** The card a farm win dropped, if any, and the chapter boss wins left today. */
data class FarmResult(
    val drop: CardDrop?,
    val chapterBossWinsLeft: Int,
)
