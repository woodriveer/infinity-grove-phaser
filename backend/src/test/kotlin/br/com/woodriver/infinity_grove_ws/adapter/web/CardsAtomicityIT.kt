package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.adapter.repository.CardCopyEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.PlayerCardsEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.PlayerCardsRepository
import br.com.woodriver.infinity_grove_ws.adapter.repository.ProgressEntity
import br.com.woodriver.infinity_grove_ws.adapter.repository.UserEntity
import br.com.woodriver.infinity_grove_ws.domain.CopyKey
import br.com.woodriver.infinity_grove_ws.domain.Element
import br.com.woodriver.infinity_grove_ws.domain.HeroSeed
import br.com.woodriver.infinity_grove_ws.domain.PlayerCards
import br.com.woodriver.infinity_grove_ws.port.PlayerCardsRepositoryPort
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.context.annotation.Primary
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse

/** A cards store that is down for the player "boom" and works for everyone else. */
@TestConfiguration(proxyBeanMethods = false)
class DownForBoomConfiguration {
    @Bean
    @Primary
    fun cardsDownForBoom(real: PlayerCardsRepository): PlayerCardsRepositoryPort =
        object : PlayerCardsRepositoryPort by real {
            override fun save(cards: PlayerCards): PlayerCards =
                if (cards.username ==
                    "boom"
                ) {
                    error("cards store is down")
                } else {
                    real.save(cards)
                }
        }
}

/** The all-or-nothing rules over real transactions: a cards failure leaves neither the new user nor the moved progress behind. */
@Import(DownForBoomConfiguration::class)
class CardsAtomicityIT : IntegrationTestBase() {
    @Test
    fun `registration whose cards cannot be stored leaves no user and no cards`() {
        given()
            .contentType(ContentType.JSON)
            .body("""{"username":"boom","password":"password123","startingElement":"FIRE"}""")
            .post("/users")
            .then()
            .statusCode(500)

        assertFalse(jpaUserRepository.existsById("boom"))
        assertEquals(0, jpaPlayerCardsRepository.count())
        assertEquals(0, jpaCardCopyRepository.count())
    }

    @Test
    fun `an outcome report whose cards cannot be stored leaves the progress where it was`() {
        jpaUserRepository.save(UserEntity("boom", "hash", 1L, 1L))
        val started = PlayerCards.start("boom", Element.FIRE, HeroSeed.heroes())
        jpaPlayerCardsRepository.save(PlayerCardsEntity.from(started))
        started.copies.forEach { (key: CopyKey, count) -> jpaCardCopyRepository.save(CardCopyEntity.from("boom", key, count)) }
        jpaProgressRepository.save(ProgressEntity("boom", 1, 1, "MINIBOSS", 1, false))
        chance.value = 0.0

        given()
            .header("Authorization", bearerToken("boom"))
            .contentType(ContentType.JSON)
            .body("""{"chapter":1,"stage":1,"encounter":"MINIBOSS","phase":1,"outcome":"CLEARED"}""")
            .post("/progress/outcome")
            .then()
            .statusCode(500)

        val stored = jpaProgressRepository.findById("boom").get()
        assertEquals(listOf(1, "MINIBOSS", 1, false), listOf(stored.stage, stored.encounter, stored.phase, stored.completed))
        assertEquals(1, jpaCardCopyRepository.findAllByUsername("boom").single().copies)
    }
}
