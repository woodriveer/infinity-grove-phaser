package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.PlayerTalents
import br.com.woodriver.infinity_grove_ws.domain.TalentCatalog
import br.com.woodriver.infinity_grove_ws.domain.TalentRules
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.TalentRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.ListTalentsUseCase
import br.com.woodriver.infinity_grove_ws.usecase.TalentChange
import br.com.woodriver.infinity_grove_ws.usecase.UpgradeTalentUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * An upgrade takes only the `wallets` row, the last of the lock order (`progress`, `player_cards`, `wallets`, ADR 0006): it holds it for the
 * whole request, so two upgrades of one player run one after the other and the second sees the level the first stored.
 */
@Service
@Transactional
class TalentService(
    private val talentRepository: TalentRepositoryPort,
    private val userRepository: UserRepositoryPort,
    private val walletAccess: WalletAccess,
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
    ): TalentChange {
        logger.info("Talent upgrade requested username={} talent={} fromLevel={}", username, talentId, fromLevel)
        requireUser(username)
        val definition = TalentCatalog.find(talentId)
        definition.requireSeenLevel(fromLevel)

        val wallet = walletAccess.lock(username)
        val upgrade = load(username).upgrade(definition, fromLevel, rules)
        val paid = wallet.minus(upgrade.cost)

        talentRepository.save(username, talentId, upgrade.talents.level(talentId))
        walletAccess.save(paid)
        logger.info("Talent upgraded username={} talent={} level={} copper={}", username, talentId, upgrade.talents.level(talentId), upgrade.cost)
        return TalentChange(upgrade.talents, paid)
    }

    private fun load(username: String) = PlayerTalents(username, talentRepository.findAll(username))

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
