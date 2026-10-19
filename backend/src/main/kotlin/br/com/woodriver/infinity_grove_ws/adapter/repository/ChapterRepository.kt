package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.EnemyStats
import br.com.woodriver.infinity_grove_ws.port.ChapterRepositoryPort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

interface JpaChapterRepository : JpaRepository<ChapterEntity, Int>

interface JpaStageRepository : JpaRepository<StageEntity, String> {
    fun findAllByChapterOrderByNumber(chapter: Int): List<StageEntity>
}

/** Assembles a chapter from its row, its stage rows and the enemies they point at; saving resolves each enemy to its catalog row. */
@Repository
class ChapterRepository(
    private val jpaChapterRepository: JpaChapterRepository,
    private val jpaStageRepository: JpaStageRepository,
    private val jpaEnemyRepository: JpaEnemyRepository,
    private val enemyRepository: EnemyRepository,
) : ChapterRepositoryPort {
    @Transactional(readOnly = true)
    override fun findByNumber(number: Int): ChapterDefinition? {
        val chapter = jpaChapterRepository.findById(number).orElse(null) ?: return null
        val stages = jpaStageRepository.findAllByChapterOrderByNumber(number)
        val enemyIds = stages.flatMap { listOf(it.monsterEnemyId, it.minibossEnemyId) } + chapter.bossEnemyId
        val enemies = jpaEnemyRepository.findAllById(enemyIds.toSet()).associate { it.id!! to it.toDomain() }
        return chapter.toDomain(stages, enemies)
    }

    @Transactional(readOnly = true)
    override fun existsByNumber(number: Int) = jpaChapterRepository.existsById(number)

    @Transactional
    override fun save(chapter: ChapterDefinition): ChapterDefinition {
        val ids = mutableMapOf<EnemyStats, Long>()
        val idOf = { stats: EnemyStats -> ids.getOrPut(stats) { enemyRepository.idOf(stats) } }
        jpaChapterRepository.save(ChapterEntity.from(chapter, idOf(chapter.boss)))
        jpaStageRepository.saveAll(
            chapter.stages.map { StageEntity.from(chapter.number, it, idOf(it.monster), idOf(it.miniboss)) },
        )
        return chapter
    }
}
