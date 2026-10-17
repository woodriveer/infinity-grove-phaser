package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.port.UserRepositoryPort
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Repository

@Repository
class UserRepository(
    private val jpaUserRepository: JpaUserRepository,
) : UserRepositoryPort {
    override fun save(user: User): User = jpaUserRepository.save(UserEntity.from(user)).toDomain()

    override fun findByUsername(username: String): User? = jpaUserRepository.findByIdOrNull(username)?.toDomain()

    override fun findAll(): List<User> = jpaUserRepository.findAll().map { it.toDomain() }

    override fun existsByUsername(username: String): Boolean = jpaUserRepository.existsById(username)

    override fun deleteByUsername(username: String) = jpaUserRepository.deleteById(username)
}
