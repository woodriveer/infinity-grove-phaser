package br.com.woodriver.infinity_grove_ws.port

/** Whether the database answers a trivial query now (spec supabase-postgres, RUN-01). */
interface DatabaseHealthPort {
    fun reachable(): Boolean
}
