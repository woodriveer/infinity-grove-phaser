package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.AutoClickRules
import br.com.woodriver.infinity_grove_ws.domain.PlayerAutoClick
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.autoClickUnlocked
import br.com.woodriver.infinity_grove_ws.port.AutoClickRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.CrystalRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.ProgressRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.GetAutoClickUseCase
import br.com.woodriver.infinity_grove_ws.usecase.UpgradeAutoClickUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * An upgrade takes the `progress` row, the first of the lock order (`progress`, `player_cards`, `wallets`, ADR 0006), like a talent
 * upgrade: two upgrades of one player run one after the other, and the chapter it checks cannot move under it. A player with no progress
 * row gets it first, so there is always a row to lock.
 */
@Service
@Transactional
class AutoClickService(
    private val autoClickRepository: AutoClickRepositoryPort,
    private val crystalRepository: CrystalRepositoryPort,
    private val userRepository: UserRepositoryPort,
    private val progressRepository: ProgressRepositoryPort,
    private val rules: AutoClickRules,
) : GetAutoClickUseCase,
    UpgradeAutoClickUseCase {
    override fun get(username: String): PlayerAutoClick {
        logger.info("Reading auto click username={}", username)
        requireUser(username)
        return load(username)
    }

    override fun upgrade(
        username: String,
        fromLevel: Int,
    ): PlayerAutoClick {
        logger.info("Auto click upgrade requested username={} fromLevel={}", username, fromLevel)
        requireUser(username)

        progressRepository.createIfAbsent(Progress.start(username))
        val progress = checkNotNull(progressRepository.findForUpdate(username)) { "Progress of $username was just created" }
        val upgraded = load(username).upgrade(fromLevel, autoClickUnlocked(progress), rules)

        autoClickRepository.save(username, upgraded.level)
        crystalRepository.save(username, upgraded.crystals)
        logger.info("Auto click saved username={} level={} crystals={}", username, upgraded.level, upgraded.crystals)
        return upgraded
    }

    private fun load(username: String) = PlayerAutoClick(username, autoClickRepository.level(username), crystalRepository.balance(username))

    private fun requireUser(username: String) {
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Auto click request rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(AutoClickService::class.java)
    }
}
