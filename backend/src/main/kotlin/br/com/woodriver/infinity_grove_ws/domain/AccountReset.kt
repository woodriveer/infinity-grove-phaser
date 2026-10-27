package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory

/**
 * The account reset (spec account-reset): from chapter 2 a player gives up the campaign and the talents for crystals. The reward is the
 * chapter left, up to the last chapter, so a completed campaign pays as much as its last chapter.
 */
object AccountReset {
    const val MAX_REWARD = ChapterOrder.MAX_CHAPTER

    private val logger = LoggerFactory.getLogger(AccountReset::class.java)

    /** The crystals a reset from [progress] pays; null in chapter 1, where the reset is closed. */
    fun reward(progress: Progress): Int? =
        when {
            progress.completed -> MAX_REWARD
            progress.position.chapter >= 2 -> minOf(progress.position.chapter, MAX_REWARD)
            else -> null
        }

    /**
     * Checks a reset sent from [fromChapter], the chapter the player saw, and returns its reward. Any other stored chapter is a repeated or
     * stale request and is refused before the lock, so the second request of a double click answers the mismatch. [view] builds the stored
     * progress the mismatch answers.
     */
    fun check(
        progress: Progress,
        fromChapter: Int,
        view: () -> ProgressView,
    ): Int {
        if (fromChapter != progress.position.chapter) {
            logger.warn(
                "Account reset refused, chapter mismatch username={} sent={} stored={}",
                progress.username,
                fromChapter,
                progress.position.chapter,
            )
            throw ResetChapterMismatchException(view(), fromChapter)
        }

        return reward(progress) ?: run {
            logger.warn("Account reset refused, locked username={} stored={}", progress.username, progress.position.chapter)
            throw ResetLockedException()
        }
    }
}

/** An account reset request the client built wrongly (400). */
class ResetRequestException(
    message: String,
) : BusinessException("INVALID_RESET_REQUEST", message)

/** Base type for a reset that is valid but does not apply to the player as they stand (409). */
open class ResetConflictException(
    code: String,
    message: String,
) : BusinessException(code, message)

/** The player saw another chapter than the stored one: nothing is reset. [current] is the stored progress, so the answer can show it. */
class ResetChapterMismatchException(
    val current: ProgressView,
    sent: Int,
) : ResetConflictException(
        "RESET_CHAPTER_MISMATCH",
        "The campaign is in chapter ${current.progress.position.chapter}, the reset was sent from chapter $sent",
    )

/** The campaign is still in chapter 1: the reset opens with chapter 2. */
class ResetLockedException : ResetConflictException("RESET_LOCKED", "The account reset opens after chapter 1")
