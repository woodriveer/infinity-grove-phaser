package br.com.woodriver.infinity_grove_ws.port

interface IdGeneratorPort {
    /** Returns an identifier no other call returned. */
    fun next(): String
}
