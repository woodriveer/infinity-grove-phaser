package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.EnemyStats
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

interface JpaEnemyRepository : JpaRepository<EnemyEntity, Long> {
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(
        value =
            "insert into enemies (element, physical_defense, magical_defense, crit_resistance) " +
                "values (:element, :physicalDefense, :magicalDefense, :critResistance) " +
                "on conflict (element, physical_defense, magical_defense, crit_resistance) do nothing",
        nativeQuery = true,
    )
    fun insertIfAbsent(
        @Param("element") element: String,
        @Param("physicalDefense") physicalDefense: Int,
        @Param("magicalDefense") magicalDefense: Int,
        @Param("critResistance") critResistance: Int,
    ): Int

    fun findByElementAndPhysicalDefenseAndMagicalDefenseAndCritResistance(
        element: String,
        physicalDefense: Int,
        magicalDefense: Int,
        critResistance: Int,
    ): EnemyEntity?
}

/** The enemy catalog: each distinct attribute set is stored once and shared by every stage and chapter that uses it. */
@Repository
class EnemyRepository(
    private val jpaEnemyRepository: JpaEnemyRepository,
) {
    /** The id of the row holding [stats], inserting it first when no row has those attributes; a concurrent insert is not an error. */
    @Transactional
    fun idOf(stats: EnemyStats): Long {
        val element = stats.element.name
        jpaEnemyRepository.insertIfAbsent(element, stats.physicalDefense, stats.magicalDefense, stats.critResistance)
        val row =
            jpaEnemyRepository.findByElementAndPhysicalDefenseAndMagicalDefenseAndCritResistance(
                element,
                stats.physicalDefense,
                stats.magicalDefense,
                stats.critResistance,
            )
        return checkNotNull(row?.id) { "Enemy $stats was inserted but cannot be read back" }
    }
}
