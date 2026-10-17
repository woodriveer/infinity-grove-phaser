package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.FakePasswordHasher
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotEquals

class UserTest {
    private val hasher = FakePasswordHasher()
    private val repository = InMemoryUserRepository()

    private fun register(
        username: String = "yan",
        password: String = "password123",
    ) = User.register(username, password, hasher, repository, now = 100L)

    @Test
    fun `register hashes the password and trims the username`() {
        val user = register(username = "  yan ")

        assertEquals("yan", user.username)
        assertNotEquals("password123", user.password)
        assertEquals(100L, user.createdAt)
        assertEquals(100L, user.lastLoginAt)
    }

    @Test
    fun `register rejects blank username`() {
        assertFailsWith<IllegalArgumentException> { register(username = "   ") }
    }

    @Test
    fun `register rejects short password`() {
        assertFailsWith<IllegalArgumentException> { register(password = "short") }
    }

    @Test
    fun `register rejects duplicated username`() {
        register().save(repository)

        assertFailsWith<UserAlreadyExistsException> { register() }
    }

    @Test
    fun `changePassword stores a new hash`() {
        val user = register().changePassword("newpassword1", hasher)

        assertEquals(hasher.hash("newpassword1"), user.password)
    }

    @Test
    fun `changePassword rejects short password`() {
        assertFailsWith<IllegalArgumentException> { register().changePassword("short", hasher) }
    }

    @Test
    fun `authenticate updates lastLoginAt when password matches`() {
        val user = register().authenticate("password123", hasher, now = 500L)

        assertEquals(500L, user.lastLoginAt)
        assertEquals(100L, user.createdAt)
    }

    @Test
    fun `authenticate fails with InvalidPasswordException when password is wrong`() {
        assertFailsWith<InvalidPasswordException> { register().authenticate("wrong-password", hasher, 500L) }
    }
}
