package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.BusinessException
import br.com.woodriver.infinity_grove_ws.domain.HeroConflictException
import br.com.woodriver.infinity_grove_ws.domain.HeroNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.HeroRequestException
import br.com.woodriver.infinity_grove_ws.domain.InvalidRefreshTokenException
import br.com.woodriver.infinity_grove_ws.domain.LoginException
import br.com.woodriver.infinity_grove_ws.domain.LoginUserNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.ProgressConflictException
import br.com.woodriver.infinity_grove_ws.domain.ProgressRequestException
import br.com.woodriver.infinity_grove_ws.domain.UserAlreadyExistsException
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.WalletRequestException
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(LoginUserNotFoundException::class)
    fun loginUserNotFound(e: LoginUserNotFoundException) = problem(HttpStatus.NOT_FOUND, e)

    @ExceptionHandler(LoginException::class)
    fun login(e: LoginException) = problem(HttpStatus.UNAUTHORIZED, e)

    @ExceptionHandler(InvalidRefreshTokenException::class)
    fun invalidRefreshToken(e: InvalidRefreshTokenException) = problem(HttpStatus.UNAUTHORIZED, e)

    @ExceptionHandler(UserNotFoundException::class)
    fun notFound(e: UserNotFoundException) = problem(HttpStatus.NOT_FOUND, e)

    @ExceptionHandler(UserAlreadyExistsException::class)
    fun conflict(e: UserAlreadyExistsException) = problem(HttpStatus.CONFLICT, e)

    @ExceptionHandler(WalletRequestException::class)
    fun walletRequest(e: WalletRequestException) = problem(HttpStatus.BAD_REQUEST, e)

    @ExceptionHandler(ProgressRequestException::class)
    fun progressRequest(e: ProgressRequestException) = problem(HttpStatus.BAD_REQUEST, e)

    /** The body carries the stored progress so the game can realign without another request. */
    @ExceptionHandler(ProgressConflictException::class)
    fun progressConflict(e: ProgressConflictException) =
        problem(HttpStatus.CONFLICT, e).apply { setProperty("progress", ProgressResponse.from(e.current)) }

    @ExceptionHandler(HeroRequestException::class)
    fun heroRequest(e: HeroRequestException) = problem(HttpStatus.BAD_REQUEST, e)

    @ExceptionHandler(HeroNotFoundException::class)
    fun heroNotFound(e: HeroNotFoundException) = problem(HttpStatus.NOT_FOUND, e)

    @ExceptionHandler(HeroConflictException::class)
    fun heroConflict(e: HeroConflictException) = problem(HttpStatus.CONFLICT, e)

    @ExceptionHandler(BusinessException::class)
    fun business(e: BusinessException) = problem(HttpStatus.UNPROCESSABLE_CONTENT, e)

    @ExceptionHandler(IllegalArgumentException::class)
    fun badRequest(e: IllegalArgumentException): ProblemDetail {
        logger.warn("Bad request: {}", e.message)
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.message ?: "Bad request")
    }

    private fun problem(
        status: HttpStatus,
        e: BusinessException,
    ): ProblemDetail {
        logger.warn("Business exception code={} status={}", e.code, status.value())
        return ProblemDetail.forStatusAndDetail(status, e.message ?: status.reasonPhrase).apply {
            setProperty("code", e.code)
        }
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(ApiExceptionHandler::class.java)
    }
}
