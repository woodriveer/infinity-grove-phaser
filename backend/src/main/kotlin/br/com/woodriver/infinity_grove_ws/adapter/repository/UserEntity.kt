package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.domain.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "users")
class UserEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(nullable = false)
    var password: String,
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Long,
    @Column(name = "last_login_at", nullable = false)
    var lastLoginAt: Long,
) {
    fun toDomain() = User(username, password, createdAt, lastLoginAt)

    companion object {
        fun from(user: User) = UserEntity(user.username, user.password, user.createdAt, user.lastLoginAt)
    }
}
