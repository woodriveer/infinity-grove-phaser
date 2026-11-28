package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.ClickPowerResult
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.RankingBoard
import br.com.woodriver.infinity_grove_ws.domain.RankingPage
import br.com.woodriver.infinity_grove_ws.domain.RecordRules
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.ProgressRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.RankingRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.GetRankingUseCase
import br.com.woodriver.infinity_grove_ws.usecase.RefreshClickPowerUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/** The two use cases behind `/rankings`: one board page with the top 10 and the caller's row, and the click power refresh. */
@Service
@Transactional
class RankingService(
    private val rankings: RankingRepositoryPort,
    private val records: RecordKeeper,
    private val progressRepository: ProgressRepositoryPort,
    private val userRepository: UserRepositoryPort,
) : GetRankingUseCase,
    RefreshClickPowerUseCase {
    @Transactional(readOnly = true)
    override fun board(
        username: String,
        board: RankingBoard,
        chapter: Int?,
    ): RankingPage {
        val shown = RecordRules.chapterOf(board, chapter)
        logger.info("Ranking board username={} board={} chapter={}", username, board, shown)
        return RankingPage(board, shown, rankings.top(board, shown, RecordRules.TOP), rankings.me(board, shown, username))
    }

    override fun refreshClickPower(username: String): ClickPowerResult {
        logger.info("Refreshing click power username={}", username)
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Click power refresh rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
        // The progress row lock comes first, the lock order of the other services
        val progress = progressRepository.findForUpdate(username)?.withNextChapterOpen() ?: Progress.start(username)
        val value = records.recordClickPower(username, progress)
        return ClickPowerResult(value, rankings.clickPower(username))
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(RankingService::class.java)
    }
}
