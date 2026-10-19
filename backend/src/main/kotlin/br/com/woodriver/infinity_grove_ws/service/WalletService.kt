package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.DropTable
import br.com.woodriver.infinity_grove_ws.domain.SyncResult
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.Wallet
import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import br.com.woodriver.infinity_grove_ws.port.DropRuleRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.WalletRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.GetDropTableUseCase
import br.com.woodriver.infinity_grove_ws.usecase.GetWalletUseCase
import br.com.woodriver.infinity_grove_ws.usecase.SyncKillsUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
@Transactional
class WalletService(
    private val walletRepository: WalletRepositoryPort,
    private val userRepository: UserRepositoryPort,
    private val dropRules: DropRuleRepositoryPort,
    private val dropRoller: DropRollerPort,
    private val clock: Clock,
) : GetWalletUseCase,
    SyncKillsUseCase,
    GetDropTableUseCase {
    override fun get(username: String): Wallet {
        logger.info("Getting wallet username={}", username)
        return walletRepository.save(load(username, dropRules.findAll()))
    }

    override fun dropTable() = dropRules.findAll()

    override fun sync(
        username: String,
        kills: Map<Int, Int>,
    ): SyncResult {
        logger.info("Syncing kills username={}", username)
        val table = dropRules.findAll()
        val result = load(username, table).credit(kills, table, dropRoller, clock.millis())
        walletRepository.save(result.wallet)
        return result
    }

    /** Returns the locked wallet with its queues up to date, creating it first when the player has none. */
    private fun load(
        username: String,
        dropTable: DropTable,
    ): Wallet {
        if (!userRepository.existsByUsername(username)) {
            logger.warn("Wallet request rejected, user not found username={}", username)
            throw UserNotFoundException(username)
        }
        val now = clock.millis()
        val stored =
            walletRepository.findForUpdate(username) ?: run {
                walletRepository.createIfAbsent(Wallet.open(username, dropTable, dropRoller, now))
                walletRepository.findForUpdate(username) ?: error("Wallet for '$username' vanished after creation")
            }
        return stored.refreshed(dropTable, dropRoller, now)
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(WalletService::class.java)
    }
}
