package br.com.woodriver.infinity_grove_ws.adapter.security

import br.com.woodriver.infinity_grove_ws.port.PasswordHasherPort
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Component

@Component
class BCryptPasswordHasher : PasswordHasherPort {
    private val encoder = BCryptPasswordEncoder()

    override fun hash(rawPassword: String): String = encoder.encode(rawPassword)!!

    override fun matches(
        rawPassword: String,
        hashedPassword: String,
    ): Boolean = encoder.matches(rawPassword, hashedPassword)
}
