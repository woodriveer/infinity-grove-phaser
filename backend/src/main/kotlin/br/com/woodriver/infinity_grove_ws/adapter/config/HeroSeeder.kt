package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.HeroSeed
import br.com.woodriver.infinity_grove_ws.port.HeroRepositoryPort
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.stereotype.Component

/** Seeds the heroes that are missing at startup. It never overwrites, so values tuned in the database survive restarts. */
@Component
class HeroSeeder(
    private val heroes: HeroRepositoryPort,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) = seed()

    fun seed() {
        HeroSeed.heroes().forEachIndexed { index, hero ->
            if (heroes.existsById(hero.id)) {
                logger.info("Hero {} already exists, seed skipped", hero.id)
            } else {
                heroes.save(hero, index)
                logger.info("Seeded hero {} at position {}", hero.id, index)
            }
        }
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(HeroSeeder::class.java)
    }
}
