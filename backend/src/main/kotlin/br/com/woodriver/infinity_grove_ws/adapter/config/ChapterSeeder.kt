package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.ChapterOrder
import br.com.woodriver.infinity_grove_ws.port.ChapterRepositoryPort
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.stereotype.Component

/** Seeds the five chapters at startup when they are missing. It never overwrites, so values tuned in the database survive restarts. */
@Component
class ChapterSeeder(
    private val chapters: ChapterRepositoryPort,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) = seed()

    fun seed() {
        (1..ChapterOrder.MAX_CHAPTER).forEach { number ->
            if (chapters.existsByNumber(number)) {
                logger.info("Chapter {} already exists, seed skipped", number)
                return@forEach
            }
            val chapter = ChapterDefinition.of(number)
            chapters.save(chapter)
            logger.info("Seeded chapter {} with {} stages", chapter.number, chapter.stageCount)
        }
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(ChapterSeeder::class.java)
    }
}
