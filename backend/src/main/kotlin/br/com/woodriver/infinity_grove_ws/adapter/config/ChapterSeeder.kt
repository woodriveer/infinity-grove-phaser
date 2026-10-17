package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.port.ChapterRepositoryPort
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.stereotype.Component

/** Seeds chapter 1 at startup when it is missing. It never overwrites, so values tuned in the database survive restarts. */
@Component
class ChapterSeeder(
    private val chapters: ChapterRepositoryPort,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) = seed()

    fun seed() {
        val first = ChapterDefinition.first()
        if (chapters.existsByNumber(first.number)) {
            logger.info("Chapter {} already exists, seed skipped", first.number)
            return
        }
        chapters.save(first)
        logger.info("Seeded chapter {} with {} stages", first.number, first.stageCount)
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(ChapterSeeder::class.java)
    }
}
