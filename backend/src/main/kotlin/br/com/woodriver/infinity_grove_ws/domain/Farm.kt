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
        /** The 400 detail of a farm chapter that is not an integer of at least 1. */
        const val CHAPTER_MESSAGE = "chapter must be an integer of at least 1"

        /**
         * The bosses of [chapter] the player has beaten, in stage order. A chapter above the current one: none. A chapter below the current one,
         * or any chapter of a completed campaign: every miniboss, then the chapter boss. The current chapter: the miniboss of every stage below
         * the current one, and the miniboss of the current stage once the chapter boss is next.
         */
        fun beaten(
            progress: Progress,
            chapter: ChapterDefinition,
        ): List<FarmBoss> {
            val position = progress.position
            if (chapter.number > position.chapter) return emptyList()
            val passed = progress.completed || chapter.number < position.chapter
            val minibosses =
                (1..chapter.stageCount).filter { stage ->
                    passed ||
                        stage < position.stage ||
                        (stage == position.stage && position.encounter == Encounter.CHAPTER_BOSS)
                }
            val chapterBoss = if (passed) listOf(FarmBoss(Encounter.CHAPTER_BOSS)) else emptyList()
            return minibosses.map { FarmBoss(Encounter.MINIBOSS, it) } + chapterBoss
        }

        /** The chapters the player may farm: 1 to the current chapter of [progress]. */
        fun reachedChapters(progress: Progress): List<Int> = (1..progress.position.chapter).toList()
    }
}

/** The bosses of [chapter] to choose from, the chapter boss wins left today, the chapters the player may farm and the chapter's numbers. */
data class FarmState(
    val bosses: List<FarmBoss>,
    val chapterBossWinsLeft: Int,
    val chapter: Int,
    val chapters: List<Int>,
    val definition: ChapterDefinition,
)

/** The card and the piece of equipment a farm win dropped, if any, and the chapter boss wins left today. */
data class FarmResult(
    val drop: CardDrop?,
    val chapterBossWinsLeft: Int,
    val equipmentDrop: EquipmentDrop? = null,
)
