package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.FakePasswordHasher
import br.com.woodriver.infinity_grove_ws.InMemoryRefreshTokenRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.domain.InvalidPasswordException
import br.com.woodriver.infinity_grove_ws.domain.LoginUserNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.RefreshToken
import br.com.woodriver.infinity_grove_ws.domain.UserAlreadyExistsException
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class UserServiceTest {
    private val repository = InMemoryUserRepository()
    private val hasher = FakePasswordHasher()
    private val refreshTokens = InMemoryRefreshTokenRepository()
    private val service = UserService(repository, hasher, refreshTokens)

    private fun token(
        hash: String,
        username: String,
    ) = RefreshToken(tokenHash = hash, username = username, expiresAt = 9_999_999L, revoked = false)

    @Test
    fun `create persists user with hashed password`() {
        val user = service.create("yan", "password123")

        assertNotEquals("password123", repository.users.getValue("yan").password)
        assertEquals("yan", user.username)
    }

    @Test
    fun `create fails for existing username`() {
        service.create("yan", "password123")

        assertFailsWith<UserAlreadyExistsException> { service.create("yan", "password123") }
    }

    @Test
    fun `get and list return stored users`() {
        service.create("yan", "password123")
        service.create("ana", "password123")

        assertEquals("yan", service.get("yan").username)
        assertEquals(2, service.list().size)
    }

    @Test
    fun `get fails when user is missing`() {
        assertFailsWith<UserNotFoundException> { service.get("ghost") }
    }

    @Test
    fun `updatePassword stores the new hash`() {
        service.create("yan", "password123")

        service.updatePassword("yan", "newpassword1")

        assertEquals(hasher.hash("newpassword1"), repository.users.getValue("yan").password)
    }

    @Test
    fun `updatePassword fails when user is missing`() {
        assertFailsWith<UserNotFoundException> { service.updatePassword("ghost", "newpassword1") }
    }

    @Test
    fun `delete removes the user`() {
        service.create("yan", "password123")

        service.delete("yan")

        assertFalse(repository.existsByUsername("yan"))
    }

    @Test
    fun `delete fails when user is missing`() {
        assertFailsWith<UserNotFoundException> { service.delete("ghost") }
    }

    @Test
    fun `login succeeds and persists lastLoginAt`() {
        val created = service.create("yan", "password123")

        val user = service.login("yan", "password123")

        assertTrue(user.lastLoginAt >= created.lastLoginAt)
        assertEquals(user, repository.users.getValue("yan"))
    }

    @Test
    fun `login fails with wrong password`() {
        service.create("yan", "password123")

        assertFailsWith<InvalidPasswordException> { service.login("yan", "wrong-password") }
    }

    @Test
    fun `login fails with LoginUserNotFoundException for unknown user`() {
        assertFailsWith<LoginUserNotFoundException> { service.login("ghost", "password123") }
    }

    @Test
    fun `delete removes all of that user's tokens and leaves other users' tokens`() {
        service.create("yan", "password123")
        refreshTokens.save(token("y1", "yan"))
        refreshTokens.save(token("y2", "yan"))
        refreshTokens.save(token("a1", "ana"))

        service.delete("yan")

        assertEquals(setOf("a1"), refreshTokens.tokens.keys)
    }

    @Test
    fun `updatePassword revokes all of that user's tokens and leaves other users' tokens`() {
        service.create("yan", "password123")
        refreshTokens.save(token("y1", "yan"))
        refreshTokens.save(token("y2", "yan"))
        refreshTokens.save(token("a1", "ana"))

        service.updatePassword("yan", "newpassword1")

        assertTrue(refreshTokens.tokens.getValue("y1").revoked)
        assertTrue(refreshTokens.tokens.getValue("y2").revoked)
        assertFalse(refreshTokens.tokens.getValue("a1").revoked)
    }

    @Test
    fun `failed delete touches no tokens`() {
        refreshTokens.save(token("g1", "ghost"))

        assertFailsWith<UserNotFoundException> { service.delete("ghost") }

        assertEquals(setOf("g1"), refreshTokens.tokens.keys)
    }

    @Test
    fun `failed password update revokes no tokens`() {
        refreshTokens.save(token("g1", "ghost"))

        assertFailsWith<UserNotFoundException> { service.updatePassword("ghost", "newpassword1") }

        assertFalse(refreshTokens.tokens.getValue("g1").revoked)
    }

    @Test
    fun `failed password update for an invalid password revokes no tokens`() {
        service.create("yan", "password123")
        refreshTokens.save(token("y1", "yan"))

        assertFailsWith<IllegalArgumentException> { service.updatePassword("yan", "short") }

        assertFalse(refreshTokens.tokens.getValue("y1").revoked)
    }
}
