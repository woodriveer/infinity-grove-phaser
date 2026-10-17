package br.com.woodriver.infinity_grove_ws.adapter.security

import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.test.context.runner.ApplicationContextRunner
import org.springframework.context.annotation.Configuration
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class SecurityPropertiesStartupTest {
    @Configuration
    @EnableConfigurationProperties(SecurityProperties::class)
    class PropertiesConfiguration

    private val runner = ApplicationContextRunner().withUserConfiguration(PropertiesConfiguration::class.java)

    @Test
    fun `context fails to start when the jwt secret is missing`() {
        runner.run { context -> assertNotNull(context.startupFailure) }
    }

    @Test
    fun `context fails to start when the jwt secret is 31 bytes`() {
        runner
            .withPropertyValues("app.security.jwt-secret=" + "a".repeat(31))
            .run { context -> assertNotNull(context.startupFailure) }
    }

    @Test
    fun `context starts when the jwt secret is 32 bytes`() {
        runner
            .withPropertyValues("app.security.jwt-secret=" + "a".repeat(32))
            .run { context ->
                assertEquals(null, context.startupFailure)
                assertEquals("a".repeat(32), context.getBean(SecurityProperties::class.java).jwtSecret)
            }
    }
}
