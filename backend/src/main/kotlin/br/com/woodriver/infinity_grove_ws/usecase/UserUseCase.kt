package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.User

interface CreateUserUseCase {
    /** Registers the user and gives them one blank card of the hero of [startingElement] (FIRE, WATER or NATURE), who becomes the leader. */
    fun create(
        username: String,
        rawPassword: String,
        startingElement: Element,
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
