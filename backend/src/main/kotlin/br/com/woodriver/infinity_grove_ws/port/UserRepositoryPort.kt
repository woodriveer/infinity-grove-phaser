package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.User

interface UserRepositoryPort {
    fun save(user: User): User

    fun findByUsername(username: String): User?

    fun findAll(): List<User>

    fun existsByUsername(username: String): Boolean

    fun deleteByUsername(username: String)
}
