package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.port.DatabaseHealthPort
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

/** What the Cloud Run probes and the Deploy workflow read: UP or DOWN, and the commit of the running image (APP_COMMIT). */
data class HealthResponse(
    val status: String,
    val commit: String,
)

/** Public `GET /health` (spec supabase-postgres, RUN-01): 200 UP when the database answers `select 1`, else 503 DOWN. */
@RestController
class HealthController(
    private val database: DatabaseHealthPort,
    @Value("\${app.commit}") private val commit: String,
) {
    @GetMapping("/health")
    fun health(): ResponseEntity<HealthResponse> =
        if (database.reachable()) {
            ResponseEntity.ok(HealthResponse(UP, commit))
        } else {
            ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(HealthResponse(DOWN, commit))
        }

    companion object {
        const val UP = "UP"
        const val DOWN = "DOWN"
    }
}
