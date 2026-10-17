package br.com.woodriver.infinity_grove_ws.port

interface DropRollerPort {
    /** Returns a uniform integer from [min] to [max], both inclusive. */
    fun roll(
        min: Int,
        max: Int,
    ): Int
}
