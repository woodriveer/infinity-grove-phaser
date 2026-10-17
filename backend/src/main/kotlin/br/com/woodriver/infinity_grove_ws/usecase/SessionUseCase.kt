package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.AuthTokens
import br.com.woodriver.infinity_grove_ws.domain.User

interface StartSessionUseCase {
    fun start(user: User): AuthTokens
}

interface RefreshSessionUseCase {
    fun refresh(rawRefreshToken: String): AuthTokens
}

interface EndSessionUseCase {
    fun end(rawRefreshToken: String)
}
