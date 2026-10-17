package br.com.woodriver.infinity_grove_ws.adapter.security

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.annotation.web.invoke
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.AuthenticationException
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import tools.jackson.databind.ObjectMapper
import javax.crypto.spec.SecretKeySpec

/** Stateless JWT resource server. Only sign-up, login, refresh and logout are public. */
@Configuration
@EnableWebSecurity
class SecurityConfig {
    @Bean
    fun jwtDecoder(properties: SecurityProperties): JwtDecoder =
        NimbusJwtDecoder
            .withSecretKey(SecretKeySpec(properties.jwtSecret.toByteArray(Charsets.UTF_8), "HmacSHA256"))
            .macAlgorithm(MacAlgorithm.HS256)
            .build()

    @Bean
    fun problemAuthenticationEntryPoint(objectMapper: ObjectMapper): AuthenticationEntryPoint =
        ProblemAuthenticationEntryPoint(objectMapper)

    @Bean
    fun securityFilterChain(
        http: HttpSecurity,
        entryPoint: AuthenticationEntryPoint,
    ): SecurityFilterChain {
        http {
            csrf { disable() }
            sessionManagement { sessionCreationPolicy = SessionCreationPolicy.STATELESS }
            authorizeHttpRequests {
                authorize(HttpMethod.POST, "/users", permitAll)
                authorize(HttpMethod.POST, "/users/login", permitAll)
                authorize(HttpMethod.POST, "/auth/refresh", permitAll)
                authorize(HttpMethod.POST, "/auth/logout", permitAll)
                authorize("/error", permitAll)
                authorize(anyRequest, authenticated)
            }
            exceptionHandling { authenticationEntryPoint = entryPoint }
            oauth2ResourceServer {
                authenticationEntryPoint = entryPoint
                jwt { }
            }
        }
        return http.build()
    }
}

/** Writes the same ProblemDetail shape as `ApiExceptionHandler`, with code `AUTH_UNAUTHENTICATED`. */
class ProblemAuthenticationEntryPoint(
    private val objectMapper: ObjectMapper,
) : AuthenticationEntryPoint {
    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException,
    ) {
        logger.warn("Unauthenticated request method={} path={}", request.method, request.requestURI)
        val body =
            linkedMapOf(
                "type" to "about:blank",
                "title" to HttpStatus.UNAUTHORIZED.reasonPhrase,
                "status" to HttpStatus.UNAUTHORIZED.value(),
                "detail" to "Authentication is required",
                "code" to CODE,
            )
        response.status = HttpStatus.UNAUTHORIZED.value()
        response.contentType = MediaType.APPLICATION_PROBLEM_JSON_VALUE
        response.setHeader("WWW-Authenticate", "Bearer")
        objectMapper.writeValue(response.outputStream, body)
    }

    companion object {
        const val CODE = "AUTH_UNAUTHENTICATED"
        private val logger = LoggerFactory.getLogger(ProblemAuthenticationEntryPoint::class.java)
    }
}
