package br.com.woodriver.infinity_grove_ws

import br.com.woodriver.infinity_grove_ws.adapter.security.SecurityProperties
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import java.time.Clock

@SpringBootApplication
@EnableConfigurationProperties(SecurityProperties::class)
class InfinityGroveWsApplication {
    @Bean
    fun clock(): Clock = Clock.systemUTC()
}

/** Starts the game backend; the blue-green deploy runs it from the image of one commit, behind the proxy. */
fun main(args: Array<String>) {
    runApplication<InfinityGroveWsApplication>(*args)
}
