package br.com.woodriver.infinity_grove_ws.adapter.config

import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.DropTable
import org.springframework.boot.test.context.runner.ApplicationContextRunner
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class WalletConfigTest {
    private val runner = ApplicationContextRunner().withUserConfiguration(WalletConfig::class.java)

    private fun causes(failure: Throwable?) = generateSequence(failure) { it.cause }.mapNotNull { it.message }.toList()

    @Test
    fun `without configuration the table holds level 1 as 1 to 5 copper every 1500 ms`() {
        runner.run { context ->
            assertNull(context.startupFailure)
            assertEquals(listOf(DropRule(1, 1, 5, 1500)), context.getBean(DropTable::class.java).rules)
        }
    }

    @Test
    fun `configured levels replace the default table`() {
        runner
            .withPropertyValues(
                "app.wallet.drop-table[0].level=1",
                "app.wallet.drop-table[0].min-copper=10",
                "app.wallet.drop-table[0].max-copper=12",
                "app.wallet.drop-table[0].kill-interval-ms=2000",
                "app.wallet.drop-table[1].level=2",
                "app.wallet.drop-table[1].min-copper=20",
                "app.wallet.drop-table[1].max-copper=30",
                "app.wallet.drop-table[1].kill-interval-ms=4000",
            ).run { context ->
                assertNull(context.startupFailure)
                assertEquals(
                    listOf(DropRule(1, 10, 12, 2000), DropRule(2, 20, 30, 4000)),
                    context.getBean(DropTable::class.java).rules,
                )
            }
    }

    @Test
    fun `context fails to start and names the level when max-copper is below min-copper`() {
        runner
            .withPropertyValues(
                "app.wallet.drop-table[0].level=1",
                "app.wallet.drop-table[0].min-copper=5",
                "app.wallet.drop-table[0].max-copper=4",
                "app.wallet.drop-table[0].kill-interval-ms=1500",
            ).run { context ->
                assertNotNull(context.startupFailure)
                assertTrue(causes(context.startupFailure).any { it.contains("level 1") && it.contains("max-copper") })
            }
    }

    @Test
    fun `context fails to start when the same level is configured twice`() {
        runner
            .withPropertyValues(
                "app.wallet.drop-table[0].level=1",
                "app.wallet.drop-table[0].min-copper=1",
                "app.wallet.drop-table[0].max-copper=5",
                "app.wallet.drop-table[0].kill-interval-ms=1500",
                "app.wallet.drop-table[1].level=1",
                "app.wallet.drop-table[1].min-copper=2",
                "app.wallet.drop-table[1].max-copper=6",
                "app.wallet.drop-table[1].kill-interval-ms=1500",
            ).run { context ->
                assertTrue(causes(context.startupFailure).any { it.contains("duplicate level 1") })
            }
    }

    @Test
    fun `random roller stays inside the range and reaches both bounds`() {
        val rolls = List(2_000) { RandomDropRoller().roll(3, 4) }

        assertEquals(setOf(3, 4), rolls.toSet())
    }

    @Test
    fun `random roller returns the only value when min equals max`() {
        assertEquals(7, RandomDropRoller().roll(7, 7))
    }
}
