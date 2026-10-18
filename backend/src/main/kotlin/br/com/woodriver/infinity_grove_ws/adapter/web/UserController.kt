package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.AuthTokens
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.InvalidStartingElementException
import br.com.woodriver.infinity_grove_ws.domain.User
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

data class CreateUserRequest(
    val username: String,
    val password: String,
    val startingElement: String? = null,
)

data class UpdatePasswordRequest(
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

    @GetMapping
    fun list() = getUser.list().map(UserResponse::from)

    @GetMapping("/{username}")
    fun get(
        @PathVariable username: String,
    ) = UserResponse.from(getUser.get(username))

    @PutMapping("/{username}/password")
    fun updatePassword(
        @PathVariable username: String,
        @RequestBody request: UpdatePasswordRequest,
    ) = UserResponse.from(updateUser.updatePassword(username, request.password))

    @DeleteMapping("/{username}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @PathVariable username: String,
    ) = deleteUser.delete(username)

    @PostMapping("/login")
    fun login(
        @RequestBody request: LoginRequest,
    ) = AuthResponse.from(startSession.start(loginUser.login(request.username, request.password)))

    private fun parseStartingElement(value: String?): Element =
        Element.entries.firstOrNull { it.name == value } ?: throw InvalidStartingElementException(value)
}
