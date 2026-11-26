package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.LegacyRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.ProgressRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.GetLegacyUseCase
import br.com.woodriver.infinity_grove_ws.usecase.LegacyView
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Reads the legacy of the account resets and what the next reset would leave (spec reset-legacy-drops). Not read-only: the progress comes
 * from `findForUpdate`, which Postgres refuses in a read-only transaction; the lock lasts one request, like `GET /progress`.
 */
@Service
@Transactional
class LegacyService(
    private val progressRepository: ProgressRepositoryPort,
    private val legacyRepository: LegacyRepositoryPort,
    private val userRepository: UserRepositoryPort,
) : GetLegacyUseCase {
    override fun legacy(username: String): LegacyView {
        logger.info("Getting legacy username={}", username)
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Legacy request rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
        val progress = (progressRepository.findForUpdate(username) ?: Progress.start(username)).withNextChapterOpen()
        return LegacyView.of(legacyRepository.find(username), progress)
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(LegacyService::class.java)
    }
}
