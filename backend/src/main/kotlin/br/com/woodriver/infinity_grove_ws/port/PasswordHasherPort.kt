package br.com.woodriver.infinity_grove_ws.port

interface PasswordHasherPort {
    fun hash(rawPassword: String): String

    fun matches(
        rawPassword: String,
        hashedPassword: String,
    ): Boolean
}
