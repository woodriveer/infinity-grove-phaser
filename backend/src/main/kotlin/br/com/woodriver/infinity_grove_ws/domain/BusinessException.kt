package br.com.woodriver.infinity_grove_ws.domain

/** Base type for every rule violation raised by the domain. Carries a stable [code] for API clients. */
open class BusinessException(
    val code: String,
    message: String,
) : RuntimeException(message)

class UserAlreadyExistsException(
    username: String,
) : BusinessException("USER_ALREADY_EXISTS", "User '$username' already exists")

class UserNotFoundException(
    username: String,
) : BusinessException("USER_NOT_FOUND", "User '$username' not found")

/** Base type for login-specific failures. */
open class LoginException(
    code: String,
    message: String,
) : BusinessException(code, message)

class LoginUserNotFoundException(
    username: String,
) : LoginException("LOGIN_USER_NOT_FOUND", "User '$username' does not exist")

class InvalidPasswordException : LoginException("LOGIN_INVALID_PASSWORD", "Password is invalid")

class InvalidRefreshTokenException : BusinessException("AUTH_INVALID_REFRESH_TOKEN", "Refresh token is invalid")

/** Base type for a wallet request the client built wrongly. */
open class WalletRequestException(
    code: String,
    message: String,
) : BusinessException(code, message)

class InvalidKillsException(
    reason: String,
) : WalletRequestException("WALLET_INVALID_KILLS", "Kills are invalid: $reason")

class UnknownLevelException(
    level: String,
) : WalletRequestException("WALLET_UNKNOWN_LEVEL", "Monster level '$level' is unknown")
