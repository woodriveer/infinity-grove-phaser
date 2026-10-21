package br.com.woodriver.infinity_grove_ws.domain

/** The five heroes of `README.md`, in README order. Texts are Portuguese as written there; art names are the files of `art/`. */
object HeroSeed {
    fun heroes(): List<Hero> = listOf(kael(), lyra(), orina(), seraphine(), vex())

    private fun kael() =
        Hero(
            id = "kael",
            name = "Kael Raizférrea",
            heroClass = "Guerreiro",
            element = Element.FIRE,
            leaderBonus = "+25% de dano contra chefes.",
            portrait = "kael_position",
            skills =
                listOf(
                    Skill(
                        1,
                        "Corte Dimensional",
                        "Ataque",
                        "Um golpe que rasga o próprio espaço, causando 1500% de dano físico a todos os inimigos e ignorando 30% da resistência física.",
                        20,
                        "kael_dimensional_cut",
                    ),
                    Skill(
                        2,
                        "Investida do Baluarte",
                        "Controle",
                        "Kael avança com o escudo, causa 400% de dano e atordoa os inimigos por 3s (pausa a Fúria dos chefes).",
                        25,
                        "kael_charge",
                    ),
                    Skill(
                        3,
                        "Brado Aterrador",
                        "Debuff",
                        "Um grito de guerra que causa Medo: inimigos perdem 30% de resistência física por 10s.",
                        30,
                        "kael_screen",
                    ),
                ),
        )

    private fun lyra() =
        Hero(
            id = "lyra",
            name = "Lyra Folhaveloz",
            heroClass = "Arqueira",
            element = Element.NATURE,
            leaderBonus = "30% de chance de executar um clique duplo crítico.",
            portrait = "lyra_position",
            skills =
                listOf(
                    Skill(
                        1,
                        "Flecha Dupla",
                        "Ataque",
                        "Dispara duas flechas, cada uma causando 300% de dano físico.",
                        8,
                        "lyra_double_shot",
                    ),
                    Skill(
                        2,
                        "Tiro Preciso",
                        "Ataque (conjuração)",
                        "Concentra a mira por 2s e dispara uma flecha com crítico garantido de 3000% de dano. " +
                            "Se Lyra for interrompida, a habilidade é perdida.",
                        30,
                        "lyra_focused_shot",
                    ),
                    Skill(
                        3,
                        "Ventos Ligeiros",
                        "Buff de grupo",
                        "Lyra e todos os aliados ganham +50% de velocidade de ataque por 12s.",
                        40,
                        "lyra_rapid_wind",
                    ),
                ),
        )

    private fun orina() =
        Hero(
            id = "orina",
            name = "Orina Brumaestrela",
            heroClass = "Maga",
            element = Element.WATER,
            leaderBonus = "+20% de Poder Arcano para todo o grupo.",
            portrait = "orina_position",
            skills =
                listOf(
                    Skill(
                        1,
                        "Prisão de Espinhos",
                        "Controle / debuff",
                        "Vinhas mágicas prendem os inimigos por 2s; enquanto presos, recebem +25% de dano mágico.",
                        18,
                        "orina_grasp_prision",
                    ),
                    Skill(
                        2,
                        "Tempestade Arcana",
                        "Ataque contínuo",
                        "Raios caem por 6s, causando 200% de dano mágico por segundo a todos os inimigos.",
                        35,
                        "orina_tempest",
                    ),
                    Skill(
                        3,
                        "Chuva de Meteoros",
                        "Ataque",
                        "Uma chuva de estrelas causa 2500% de dano mágico em área.",
                        45,
                        "orina_meteor_storm",
                    ),
                ),
        )

    private fun seraphine() =
        Hero(
            id = "seraphine",
            name = "Seraphine Aurora",
            heroClass = "Clériga",
            element = Element.LIGHT,
            leaderBonus = "+15% de Seiva obtida.",
            portrait = "seraphine_position",
            skills =
                listOf(
                    Skill(
                        1,
                        "Bênção da Grande Árvore",
                        "Buff de grupo",
                        "Por 15s, todos os aliados ganham +20% de Precisão, +30% de Força e +25% de velocidade de ataque.",
                        30,
                        "seraphine_blessing",
                    ),
                    Skill(
                        2,
                        "Luz Divina",
                        "Ataque",
                        "Um pilar de luz atinge todos os inimigos, causando 800% de dano mágico (+50% contra criaturas do Submundo).",
                        25,
                        "seraphine_holy_light",
                    ),
                    Skill(
                        3,
                        "Carrilhão da Aurora",
                        "Buff de grupo",
                        "O badalar de um sino sagrado aumenta a Resistência dos aliados em 40% e os torna imunes a efeitos negativos por 10s.",
                        45,
                        "seraphine_bell_ringing",
                    ),
                ),
        )

    private fun vex() =
        Hero(
            id = "vex",
            name = "Vex Sombraespinho",
            heroClass = "Assassino",
            element = Element.DARKNESS,
            leaderBonus = "+30% de dano contra inimigos sob efeitos de dano contínuo.",
            portrait = "vex_position",
            skills =
                listOf(
                    Skill(
                        1,
                        "Bomba de Veneno",
                        "Dano contínuo",
                        "Envenena todos os inimigos: 100% de dano por segundo durante 8s. Acumula até 3 vezes.",
                        15,
                        "vex_poison_bomb",
                    ),
                    Skill(
                        2,
                        "Bomba de Fumaça",
                        "Buff de grupo",
                        "Uma nuvem cega os inimigos: por 10s, os ataques dos aliados não erram (evasão inimiga zerada) " +
                            "e ganham +15% de chance de crítico.",
                        35,
                        "vex_smoke_bomb",
                    ),
                    Skill(
                        3,
                        "Golpe Sangrento",
                        "Ataque + dano contínuo",
                        "Causa 600% de dano e aplica Sangramento: 150% de dano por segundo durante 6s.",
                        20,
                        "vex_bleeding_blow",
                    ),
                ),
        )
}
