package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.port.ProgressRepositoryPort
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

interface JpaProgressRepository : JpaRepository<ProgressEntity, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from ProgressEntity p where p.username = :username")
    fun findForUpdate(
        @Param("username") username: String,
    ): ProgressEntity?

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(
        value =
            "insert into progress (username, chapter, stage, encounter, phase, completed) " +
                "values (:username, :chapter, :stage, :encounter, :phase, :completed) on conflict (username) do nothing",
        nativeQuery = true,
    )
    fun insertIfAbsent(
        @Param("username") username: String,
        @Param("chapter") chapter: Int,
        @Param("stage") stage: Int,
        @Param("encounter") encounter: String,
        @Param("phase") phase: Int,
        @Param("completed") completed: Boolean,
    ): Int
}

@Repository
class ProgressRepository(
    private val jpaProgressRepository: JpaProgressRepository,
) : ProgressRepositoryPort {
    @Transactional
    override fun findForUpdate(username: String): Progress? = jpaProgressRepository.findForUpdate(username)?.toDomain()

    @Transactional
    override fun createIfAbsent(progress: Progress) {
        val row = ProgressEntity.from(progress)
        jpaProgressRepository.insertIfAbsent(row.username, row.chapter, row.stage, row.encounter, row.phase, row.completed)
    }

    @Transactional
    override fun save(progress: Progress): Progress {
        jpaProgressRepository.save(ProgressEntity.from(progress))
        return progress
    }

    @Transactional
    override fun deleteByUsername(username: String) {
        jpaProgressRepository.deleteById(username)
    }
}
