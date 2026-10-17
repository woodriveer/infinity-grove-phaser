package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.port.ChapterRepositoryPort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

interface JpaChapterRepository : JpaRepository<ChapterEntity, Int>

interface JpaStageRepository : JpaRepository<StageEntity, String> {
    fun findAllByChapterOrderByNumber(chapter: Int): List<StageEntity>
}

@Repository
class ChapterRepository(
    private val jpaChapterRepository: JpaChapterRepository,
    private val jpaStageRepository: JpaStageRepository,
) : ChapterRepositoryPort {
    @Transactional(readOnly = true)
    override fun findByNumber(number: Int): ChapterDefinition? {
        val chapter = jpaChapterRepository.findById(number).orElse(null) ?: return null
        return chapter.toDomain(jpaStageRepository.findAllByChapterOrderByNumber(number))
    }

    @Transactional(readOnly = true)
    override fun existsByNumber(number: Int) = jpaChapterRepository.existsById(number)

    @Transactional
    override fun save(chapter: ChapterDefinition): ChapterDefinition {
        jpaChapterRepository.save(ChapterEntity.from(chapter))
        jpaStageRepository.saveAll(chapter.stages.map { StageEntity.from(chapter.number, it) })
        return chapter
    }
}
