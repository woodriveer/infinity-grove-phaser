package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.AccountReset
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.ChapterNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.ChapterRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.CrystalRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.ProgressRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.ResetRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.TalentRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.ResetAccountUseCase
import br.com.woodriver.infinity_grove_ws.usecase.ResetResult
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * A reset takes the `progress` row, the first of the lock order (`progress`, `player_cards`, `wallets`, ADR 0006), like an outcome report:
 * a report and a reset of one player run one after the other, so a reset never pays for a chapter a report just left. Coins, equipment,
 * cards and the auto click level are not touched.
 */
@Service
@Transactional
class AccountResetService(
    private val progressRepository: ProgressRepositoryPort,
    private val chapterRepository: ChapterRepositoryPort,
    private val userRepository: UserRepositoryPort,
    private val talentRepository: TalentRepositoryPort,
    private val crystalRepository: CrystalRepositoryPort,
    private val resetRepository: ResetRepositoryPort,
) : ResetAccountUseCase {
    override fun reset(
        username: String,
        fromChapter: Int,
    ): ResetResult {
        logger.info("Account reset requested username={} fromChapter={}", username, fromChapter)
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Account reset rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }

        val progress = lockProgress(username)
        val reward = AccountReset.check(progress, fromChapter) { progress.view(chapterOf(progress)) }

        val start = progressRepository.save(Progress.start(username))
        talentRepository.deleteByUsername(username)
        val crystals = crystalRepository.balance(username) + reward
        crystalRepository.save(username, crystals)
        val resets = resetRepository.count(username) + 1
        resetRepository.save(username, resets)

        logger.info(
            "Account reset username={} chapter={} reward={} crystals={} resets={}",
            username,
            progress.position.chapter,
            reward,
            crystals,
            resets,
        )
        return ResetResult(reward, crystals, resets, start.view(chapterOf(start)))
    }

    /** Returns the locked progress, created first when the player has none, with the next chapter opened like `ProgressService` does. */
    private fun lockProgress(username: String): Progress {
        progressRepository.createIfAbsent(Progress.start(username))
        val stored = checkNotNull(progressRepository.findForUpdate(username)) { "Progress of $username was just created" }
        val open = stored.withNextChapterOpen()
        if (open != stored) progressRepository.save(open)
        return open
    }

    private fun chapterOf(progress: Progress): ChapterDefinition =
        chapterRepository.findByNumber(progress.position.chapter) ?: throw ChapterNotFoundException(progress.position.chapter)

    private companion object {
        private val logger = LoggerFactory.getLogger(AccountResetService::class.java)
    }
}
