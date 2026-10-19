package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.concurrent.ThreadLocalRandom

/** The drop rules live in the `drop_rules` table; only the roller is wired here. */
@Configuration
class WalletConfig {
    @Bean
    fun dropRoller(): DropRollerPort = RandomDropRoller()
}

class RandomDropRoller : DropRollerPort {
    override fun roll(
        min: Int,
        max: Int,
    ): Int = ThreadLocalRandom.current().nextInt(min, max + 1)
}
