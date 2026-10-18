package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.domain.EquipmentRules
import br.com.woodriver.infinity_grove_ws.domain.PlayerEquipment
import br.com.woodriver.infinity_grove_ws.usecase.EquipPieceUseCase
import br.com.woodriver.infinity_grove_ws.usecase.EquipmentChange
import br.com.woodriver.infinity_grove_ws.usecase.ListEquipmentUseCase
import br.com.woodriver.infinity_grove_ws.usecase.RefinePieceUseCase
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

/** Every piece the player owns (the ones worn carry their `heroId`) and how many the bag holds at most. */
data class EquipmentResponse(
    val capacity: Int,
    val pieces: List<PieceResponse>,
) {
    companion object {
        fun from(
            equipment: PlayerEquipment,
            rules: EquipmentRules,
        ) = EquipmentResponse(equipment.capacity, equipment.pieces.map { PieceResponse.from(it, rules) })
    }
}

/** The pieces and the wallet after an action that spent or earned copper. */
data class EquipmentChangeResponse(
    val equipment: EquipmentResponse,
    val wallet: CoinsResponse,
) {
    companion object {
        fun from(
            change: EquipmentChange,
            rules: EquipmentRules,
        ) = EquipmentChangeResponse(EquipmentResponse.from(change.equipment, rules), CoinsResponse.from(change.wallet.coins()))
    }
}

@RestController
@RequestMapping("/equipment")
class EquipmentController(
    private val listEquipment: ListEquipmentUseCase,
    private val equipPiece: EquipPieceUseCase,
    private val refinePiece: RefinePieceUseCase,
    private val rules: EquipmentRules,
) {
    @GetMapping
    fun get(principal: Principal) = EquipmentResponse.from(listEquipment.list(principal.name), rules)

    @PostMapping("/{id}/equip")
    fun equip(
        principal: Principal,
        @PathVariable id: String,
        @RequestBody body: Map<String, Any?>,
    ): EquipmentResponse {
        val heroId = body["heroId"] as? String
        require(!heroId.isNullOrBlank()) { "heroId must not be blank" }
        return EquipmentResponse.from(equipPiece.equip(principal.name, id, heroId), rules)
    }

    @PostMapping("/{id}/unequip")
    fun unequip(
        principal: Principal,
        @PathVariable id: String,
    ) = EquipmentResponse.from(equipPiece.unequip(principal.name, id), rules)

    @PostMapping("/{id}/refine")
    fun refine(
        principal: Principal,
        @PathVariable id: String,
    ) = EquipmentChangeResponse.from(refinePiece.refine(principal.name, id), rules)
}
