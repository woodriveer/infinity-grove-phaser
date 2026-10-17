package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.LoginUserNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.port.PasswordHasherPort
import br.com.woodriver.infinity_grove_ws.port.RefreshTokenRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.CreateUserUseCase
import br.com.woodriver.infinity_grove_ws.usecase.DeleteUserUseCase
import br.com.woodriver.infinity_grove_ws.usecase.GetUserUseCase
import br.com.woodriver.infinity_grove_ws.usecase.LoginUserUseCase
import br.com.woodriver.infinity_grove_ws.usecase.UpdateUserUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class UserService(
    private val userRepository: UserRepositoryPort,
    private val passwordHasher: PasswordHasherPort,
    private val refreshTokenRepository: RefreshTokenRepositoryPort,
) : CreateUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    LoginUserUseCase {
    override fun create(
        username: String,
        rawPassword: String,
    ): User {
        logger.info("Creating user username={}", username)
        return User
            .register(username, rawPassword, passwordHasher, userRepository, System.currentTimeMillis())
            .save(userRepository)
    }

    @Transactional(readOnly = true)
    override fun get(username: String): User {
        logger.info("Getting user username={}", username)
        return userRepository.findByUsername(username) ?: throw UserNotFoundException(username)
    }

    @Transactional(readOnly = true)
    override fun list(): List<User> {
        logger.info("Listing users")
        return userRepository.findAll()
    }

    override fun updatePassword(
        username: String,
        rawPassword: String,
    ): User {
        logger.info("Updating password username={}", username)
        val updated =
            get(username)
                .changePassword(rawPassword, passwordHasher)
                .save(userRepository)
        refreshTokenRepository.revokeAllByUsername(username)
        return updated
    }

    override fun delete(username: String) {
        logger.info("Deleting user username={}", username)
        if (!userRepository.existsByUsername(username)) throw UserNotFoundException(username)
        userRepository.deleteByUsername(username)
        refreshTokenRepository.deleteAllByUsername(username)
    }

    override fun login(
        username: String,
        rawPassword: String,
    ): User {
        logger.info("Login attempt username={}", username)
        val user = userRepository.findByUsername(username) ?: throw LoginUserNotFoundException(username)
        return user
            .authenticate(rawPassword, passwordHasher, System.currentTimeMillis())
            .save(userRepository)
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(UserService::class.java)
    }
}
