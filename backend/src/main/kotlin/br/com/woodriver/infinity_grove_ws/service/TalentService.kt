package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.PlayerTalents
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.TalentCatalog
import br.com.woodriver.infinity_grove_ws.domain.TalentRules
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.ProgressRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.TalentRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.ListTalentsUseCase
import br.com.woodriver.infinity_grove_ws.usecase.UpgradeTalentUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * An upgrade takes the `progress` row, the first of the lock order (`progress`, `player_cards`, `wallets`, ADR 0006): a first clear pays its
 * points under the same lock, so an upgrade never reads points a report is still adding and two upgrades of one player run one after the
 * other. A player with no progress row gets it first, so there is always a row to lock.
 */
@Service
@Transactional
class TalentService(
    private val talentRepository: TalentRepositoryPort,
    private val userRepository: UserRepositoryPort,
    private val progressRepository: ProgressRepositoryPort,
    private val rules: TalentRules,
) : ListTalentsUseCase,
    UpgradeTalentUseCase {
    override fun list(username: String): PlayerTalents {
        logger.info("Listing talents username={}", username)
        requireUser(username)
        return load(username)
    }

    override fun upgrade(
        username: String,
        talentId: String,
        fromLevel: Int,
    ): PlayerTalents {
        logger.info("Talent upgrade requested username={} talent={} fromLevel={}", username, talentId, fromLevel)
        requireUser(username)
        val definition = TalentCatalog.find(talentId)
        definition.requireSeenLevel(fromLevel)

        progressRepository.createIfAbsent(Progress.start(username))
        progressRepository.findForUpdate(username)
        val upgrade = load(username).upgrade(definition, fromLevel, rules)

        val level = upgrade.talents.level(talentId)

        talentRepository.save(username, talentId, level)
        logger.info("Talent upgraded username={} talent={} level={} points={}", username, talentId, level, upgrade.cost)
        return upgrade.talents
    }

    private fun load(username: String) =
        PlayerTalents(username, talentRepository.findAll(username), talentRepository.earnedPoints(username))

    private fun requireUser(username: String) {
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Talent request rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(TalentService::class.java)
    }
}
