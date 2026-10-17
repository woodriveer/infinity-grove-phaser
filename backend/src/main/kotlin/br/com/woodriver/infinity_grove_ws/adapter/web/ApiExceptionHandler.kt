package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.BusinessException
import br.com.woodriver.infinity_grove_ws.domain.InvalidRefreshTokenException
import br.com.woodriver.infinity_grove_ws.domain.LoginException
import br.com.woodriver.infinity_grove_ws.domain.LoginUserNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.UserAlreadyExistsException
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
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
