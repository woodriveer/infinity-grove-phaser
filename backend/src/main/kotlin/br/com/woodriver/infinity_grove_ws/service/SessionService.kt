package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.domain.AuthTokens
import br.com.woodriver.infinity_grove_ws.domain.InvalidRefreshTokenException
import br.com.woodriver.infinity_grove_ws.domain.RefreshToken
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.port.AccessTokenIssuerPort
import br.com.woodriver.infinity_grove_ws.port.RefreshTokenRepositoryPort
import br.com.woodriver.infinity_grove_ws.port.RefreshTokenSecretPort
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import br.com.woodriver.infinity_grove_ws.usecase.EndSessionUseCase
import br.com.woodriver.infinity_grove_ws.usecase.RefreshSessionUseCase
import br.com.woodriver.infinity_grove_ws.usecase.StartSessionUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
@Transactional
class SessionService(
    private val userRepository: UserRepositoryPort,
    private val refreshTokenRepository: RefreshTokenRepositoryPort,
    private val accessTokenIssuer: AccessTokenIssuerPort,
    private val refreshTokenSecrets: RefreshTokenSecretPort,
    private val clock: Clock,
) : StartSessionUseCase,
    RefreshSessionUseCase,
    EndSessionUseCase {
    override fun start(user: User): AuthTokens {
        logger.info("Starting session username={}", user.username)
        val now = clock.millis()
        val access = accessTokenIssuer.issue(user.username, now)
        val issued = RefreshToken.issue(user.username, refreshTokenSecrets::generate, refreshTokenSecrets::hash, now)
        refreshTokenRepository.save(issued.token)
        return AuthTokens(
            user = user,
            accessToken = access.value,
            accessTokenExpiresAt = access.expiresAt,
            refreshToken = issued.rawValue,
            refreshTokenExpiresAt = issued.token.expiresAt,
        )
    }

    override fun refresh(rawRefreshToken: String): AuthTokens {
        logger.info("Refreshing session")
        val stored = refreshTokenRepository.findByHash(refreshTokenSecrets.hash(rawRefreshToken))
        if (stored == null || !stored.isUsableAt(clock.millis())) {
            logger.warn("Refresh rejected, token unknown, expired or revoked")
            throw InvalidRefreshTokenException()
        }
        val user =
            userRepository.findByUsername(stored.username) ?: run {
                logger.warn("Refresh rejected, user no longer exists username={}", stored.username)
                throw InvalidRefreshTokenException()
            }
        refreshTokenRepository.save(stored.revoke())
        return start(user)
    }

    override fun end(rawRefreshToken: String) {
        logger.info("Ending session")
        val stored = refreshTokenRepository.findByHash(refreshTokenSecrets.hash(rawRefreshToken))
        if (stored == null) {
            logger.info("End session ignored, token unknown")
            return
        }
        refreshTokenRepository.save(stored.revoke())
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(SessionService::class.java)
    }
}
