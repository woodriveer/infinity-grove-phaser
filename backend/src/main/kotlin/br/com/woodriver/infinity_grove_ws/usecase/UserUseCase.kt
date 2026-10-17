package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.User

interface CreateUserUseCase {
    fun create(
        username: String,
        rawPassword: String,
    ): User
}

interface GetUserUseCase {
    fun get(username: String): User

    fun list(): List<User>
}

interface UpdateUserUseCase {
    fun updatePassword(
        username: String,
        rawPassword: String,
    ): User
}

interface DeleteUserUseCase {
    fun delete(username: String)
}

interface LoginUserUseCase {
    fun login(
        username: String,
        rawPassword: String,
    ): User
}
