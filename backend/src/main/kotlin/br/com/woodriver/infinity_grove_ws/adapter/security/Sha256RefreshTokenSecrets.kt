package br.com.woodriver.infinity_grove_ws.adapter.security

import br.com.woodriver.infinity_grove_ws.port.RefreshTokenSecretPort
import org.springframework.stereotype.Component
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64
import java.util.HexFormat

@Component
class Sha256RefreshTokenSecrets : RefreshTokenSecretPort {
    private val random = SecureRandom()

    override fun generate(): String {
        val bytes = ByteArray(TOKEN_BYTES).also(random::nextBytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    override fun hash(raw: String): String =
        HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.toByteArray(Charsets.UTF_8)))

    private companion object {
        const val TOKEN_BYTES = 32
    }
}
