package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.DropTable
import br.com.woodriver.infinity_grove_ws.domain.Wallet
import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import br.com.woodriver.infinity_grove_ws.port.WalletRepositoryPort
import org.springframework.stereotype.Component
import java.time.Clock

/** The wallet of a player for the services that spend or credit copper: locked until the transaction ends, created when missing. */
@Component
class WalletAccess(
    private val walletRepository: WalletRepositoryPort,
    private val dropTable: DropTable,
    private val dropRoller: DropRollerPort,
    private val clock: Clock,
) {
    fun lock(username: String): Wallet =
        walletRepository.findForUpdate(username) ?: run {
            walletRepository.createIfAbsent(Wallet.open(username, dropTable, dropRoller, clock.millis()))
            walletRepository.findForUpdate(username) ?: error("Wallet for '$username' vanished after creation")
        }

    fun save(wallet: Wallet): Wallet = walletRepository.save(wallet)
}
