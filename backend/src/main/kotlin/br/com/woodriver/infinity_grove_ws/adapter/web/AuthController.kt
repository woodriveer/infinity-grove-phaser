package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.usecase.EndSessionUseCase
import br.com.woodriver.infinity_grove_ws.usecase.RefreshSessionUseCase
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

data class RefreshTokenRequest(
    val refreshToken: String,
)

@RestController
@RequestMapping("/auth")
class AuthController(
    private val refreshSession: RefreshSessionUseCase,
    private val endSession: EndSessionUseCase,
) {
    @PostMapping("/refresh")
    fun refresh(
        @RequestBody request: RefreshTokenRequest,
    ): AuthResponse {
        require(request.refreshToken.isNotBlank()) { "refreshToken must not be blank" }
        return AuthResponse.from(refreshSession.refresh(request.refreshToken))
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun logout(
        @RequestBody request: RefreshTokenRequest,
    ) {
        require(request.refreshToken.isNotBlank()) { "refreshToken must not be blank" }
        endSession.end(request.refreshToken)
    }
}
