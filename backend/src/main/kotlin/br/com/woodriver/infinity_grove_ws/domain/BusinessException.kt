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

class UnknownDropRuleException(
    ruleId: String,
) : WalletRequestException("WALLET_UNKNOWN_DROP_RULE", "Drop rule '$ruleId' is unknown")

/** Base type for a progress request the client built wrongly. */
open class ProgressRequestException(
    code: String,
    message: String,
) : BusinessException(code, message)

class InvalidOutcomeException(
    reason: String,
) : ProgressRequestException("PROGRESS_INVALID_OUTCOME", "Outcome is invalid: $reason")

/** The reported position is not the stored one (or the report is not allowed there); [current] is the stored progress. */
class ProgressConflictException(
    val current: ProgressView,
) : BusinessException("PROGRESS_CONFLICT", "Reported position does not match the stored progress")

class ChapterNotFoundException(
    chapter: Int,
) : BusinessException("CHAPTER_NOT_FOUND", "Chapter '$chapter' not found")
