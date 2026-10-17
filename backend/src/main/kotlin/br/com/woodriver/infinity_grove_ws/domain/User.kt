package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.port.PasswordHasherPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import org.slf4j.LoggerFactory

data class User(
    val username: String,
    val password: String,
    val createdAt: Long,
    val lastLoginAt: Long,
) {
    fun save(userRepository: UserRepositoryPort): User {
        logger.info("Saving User username={}", username)
        return userRepository.save(this)
    }

    fun changePassword(
        rawPassword: String,
        passwordHasher: PasswordHasherPort,
    ): User {
        validatePassword(rawPassword)
        logger.info("Changing password for User username={}", username)
        return copy(password = passwordHasher.hash(rawPassword))
    }

    fun authenticate(
        rawPassword: String,
        passwordHasher: PasswordHasherPort,
        now: Long,
    ): User {
        if (!passwordHasher.matches(rawPassword, password)) {
            logger.warn("Authentication failed for User username={}", username)
            throw InvalidPasswordException()
        }
        logger.info("Authentication succeeded for User username={}", username)
        return copy(lastLoginAt = now)
    }

    companion object {
        private val logger = LoggerFactory.getLogger(User::class.java)
        const val MIN_PASSWORD_LENGTH = 8

        fun register(
            username: String,
            rawPassword: String,
            passwordHasher: PasswordHasherPort,
            userRepository: UserRepositoryPort,
            now: Long,
        ): User {
            val normalized = username.trim()
            require(normalized.isNotEmpty()) { "Username must not be blank" }
            validatePassword(rawPassword)
            if (userRepository.existsByUsername(normalized)) {
                logger.warn("Registration rejected, username already taken username={}", normalized)
                throw UserAlreadyExistsException(normalized)
            }
            logger.info("Registering User username={}", normalized)
            return User(
                username = normalized,
                password = passwordHasher.hash(rawPassword),
                createdAt = now,
                lastLoginAt = now,
            )
        }

        private fun validatePassword(rawPassword: String) {
            require(rawPassword.length >= MIN_PASSWORD_LENGTH) {
                "Password must have at least $MIN_PASSWORD_LENGTH characters"
            }
        }
    }
}
