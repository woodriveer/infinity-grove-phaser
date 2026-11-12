package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.AuthTokens
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.InvalidStartingElementException
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserForbiddenException
import br.com.woodriver.infinity_grove_ws.usecase.CreateUserUseCase
import br.com.woodriver.infinity_grove_ws.usecase.DeleteUserUseCase
import br.com.woodriver.infinity_grove_ws.usecase.GetUserUseCase
import br.com.woodriver.infinity_grove_ws.usecase.LoginUserUseCase
import br.com.woodriver.infinity_grove_ws.usecase.StartSessionUseCase
import br.com.woodriver.infinity_grove_ws.usecase.UpdateUserUseCase
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

data class CreateUserRequest(
    val username: String,
    val password: String,
    val startingElement: String? = null,
)

data class UpdatePasswordRequest(
    val currentPassword: String,
    val password: String,
)

data class LoginRequest(
    val username: String,
    val password: String,
)

data class UserResponse(
    val username: String,
    val createdAt: Long,
    val lastLoginAt: Long,
) {
    companion object {
        fun from(user: User) = UserResponse(user.username, user.createdAt, user.lastLoginAt)
    }
}

data class AuthResponse(
    val user: UserResponse,
    val accessToken: String,
    val refreshToken: String,
    val accessTokenExpiresAt: Long,
    val refreshTokenExpiresAt: Long,
) {
    companion object {
        fun from(tokens: AuthTokens) =
            AuthResponse(
                user = UserResponse.from(tokens.user),
                accessToken = tokens.accessToken,
                refreshToken = tokens.refreshToken,
                accessTokenExpiresAt = tokens.accessTokenExpiresAt,
                refreshTokenExpiresAt = tokens.refreshTokenExpiresAt,
            )
    }
}

@RestController
@RequestMapping("/users")
class UserController(
    private val createUser: CreateUserUseCase,
    private val getUser: GetUserUseCase,
    private val updateUser: UpdateUserUseCase,
    private val deleteUser: DeleteUserUseCase,
    private val loginUser: LoginUserUseCase,
    private val startSession: StartSessionUseCase,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestBody request: CreateUserRequest,
    ) = AuthResponse.from(
        startSession.start(createUser.create(request.username, request.password, parseStartingElement(request.startingElement))),
    )

    @GetMapping("/{username}")
    fun get(
        @PathVariable username: String,
        principal: Principal,
    ) = UserResponse.from(getUser.get(owned(username, principal)))

    @PutMapping("/{username}/password")
    fun updatePassword(
        @PathVariable username: String,
        @RequestBody request: UpdatePasswordRequest,
        principal: Principal,
    ) = UserResponse.from(updateUser.updatePassword(owned(username, principal), request.currentPassword, request.password))

    @DeleteMapping("/{username}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @PathVariable username: String,
        principal: Principal,
    ) = deleteUser.delete(owned(username, principal))

    @PostMapping("/login")
    fun login(
        @RequestBody request: LoginRequest,
    ) = AuthResponse.from(startSession.start(loginUser.login(request.username, request.password)))

    private fun owned(
        username: String,
        principal: Principal,
    ): String = if (username == principal.name) username else throw UserForbiddenException(username)

    private fun parseStartingElement(value: String?): Element =
        Element.entries.firstOrNull { it.name == value } ?: throw InvalidStartingElementException(value)
}
