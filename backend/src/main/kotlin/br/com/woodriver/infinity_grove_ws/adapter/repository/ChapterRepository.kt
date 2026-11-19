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

interface JpaStageAddRepository : JpaRepository<StageAddEntity, String> {
    fun findAllByStageIdIn(stageIds: Collection<String>): List<StageAddEntity>
}

/**
 * Assembles a chapter from its row, its stage rows, their adds and the enemies they point at; saving resolves each enemy to its
 * catalog row and replaces the adds of the chapter.
 */
@Repository
class ChapterRepository(
    private val jpaChapterRepository: JpaChapterRepository,
    private val jpaStageRepository: JpaStageRepository,
    private val jpaStageAddRepository: JpaStageAddRepository,
    private val jpaEnemyRepository: JpaEnemyRepository,
    private val enemyRepository: EnemyRepository,
) : ChapterRepositoryPort {
    @Transactional(readOnly = true)
    override fun findByNumber(number: Int): ChapterDefinition? {
        val chapter = jpaChapterRepository.findById(number).orElse(null) ?: return null
        val stages = jpaStageRepository.findAllByChapterOrderByNumber(number)
        val enemyIds = stages.flatMap { listOf(it.monsterEnemyId, it.minibossEnemyId) } + chapter.bossEnemyId
        val enemies = jpaEnemyRepository.findAllById(enemyIds.toSet()).associate { it.id!! to it.toDomain() }
        val adds =
            jpaStageAddRepository
                .findAllByStageIdIn(stages.map { it.id })
                .groupBy { it.stageId }
                .mapValues { (_, rows) -> rows.sortedBy { it.slot }.map { it.toDomain() } }
        return chapter.toDomain(stages, enemies, adds)
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
        val stageIds = chapter.stages.map { StageEntity.idOf(chapter.number, it.number) }
        val wanted =
            chapter.stages.flatMap { stage ->
                stage.adds.mapIndexed { index, add -> StageAddEntity.from(chapter.number, stage.number, index + 1, add) }
            }
        val wantedIds = wanted.map { it.id }.toSet()
        // a save replaces the adds of the chapter: rows of a slot the new chapter no longer has are deleted, the others are written over
        jpaStageAddRepository.deleteAll(jpaStageAddRepository.findAllByStageIdIn(stageIds).filterNot { it.id in wantedIds })
        jpaStageAddRepository.saveAll(wanted)
        return chapter
    }
}
