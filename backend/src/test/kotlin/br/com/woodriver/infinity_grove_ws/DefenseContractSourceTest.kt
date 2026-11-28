package br.com.woodriver.infinity_grove_ws

import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import kotlin.io.path.name
import kotlin.io.path.readText
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Spec defense-contract, DEF-02 AC 4 and DEF-06 AC 5: the backend source names one enemy defense. The old column and field names stay only
 * in the applied migrations that created, copied or bridged them (V1, V16, V19) and in the contract migration that drops them (V20). The
 * old column names stay in the tests only where they replay V16 on the schema after V20 or assert that the columns are gone or bridged.
 */
class DefenseContractSourceTest {
    private val main: Path = Paths.get("src", "main")
    private val oldNames = Regex("physical_defense|magical_defense|physicalDefense|magicalDefense")
    private val oldColumns = Regex("physical_defense|magical_defense")
    private val testsAllowed = setOf("EnemyDefenseMigrationIT.kt", "EarlyGameRebalanceMigrationIT.kt", "DefenseContractSourceTest.kt")
    private val migrationsAllowed = setOf("V1__schema.sql", "V16__early_game_rebalance.sql", "V19__enemy_defense_expand.sql")

    private fun namesOf(
        root: Path,
        names: Regex = oldNames,
    ): List<String> =
        Files.walk(root).use { paths ->
            paths
                .filter { Files.isRegularFile(it) }
                .filter { names.containsMatchIn(it.readText()) }
                .map { it.name }
                .toList()
        }

    @Test
    fun `no backend main source names the old defense columns or fields outside the applied migrations V1, V16 and V19`() {
        assertTrue(Files.isDirectory(main), "src/main not found from ${Paths.get("").toAbsolutePath()}")

        val offenders = namesOf(main).filterNot { it in migrationsAllowed || it.startsWith("V20__") }

        assertEquals(emptyList(), offenders)
    }

    @Test
    fun `the migrations that still name the old columns are the three applied ones`() {
        val inMigrations = namesOf(main.resolve("resources").resolve("db").resolve("migration")).filterNot { it.startsWith("V20__") }

        assertEquals(migrationsAllowed, inMigrations.toSet())
    }

    @Test
    fun `no backend test names the old defense columns outside the migration replays and the column assertions`() {
        val tests = Paths.get("src", "test")
        assertTrue(Files.isDirectory(tests), "src/test not found from ${Paths.get("").toAbsolutePath()}")

        val offenders = namesOf(tests, oldColumns).filterNot { it in testsAllowed }

        assertEquals(emptyList(), offenders)
    }
}
