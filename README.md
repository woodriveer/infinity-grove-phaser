# Infinity Grove — Briefing do Jogo

## Objetivo deste documento
Este documento descreve o jogo Infinity Grove, um clicker estratégico a ser
desenvolvido em Phaser 4. Use-o como referência para implementar o jogo,
começando pelo escopo do MVP descrito no final. Todos os valores numéricos são
pontos de partida para balanceamento e devem ficar em arquivos de dados (JSON),
não fixos no código.

## Visão geral
**Gênero:** Clicker estratégico (incremental com habilidades ativas)
**Plataforma:** Web (Phaser 4), desktop e mobile
**Pitch:** Defenda a Grande Árvore, fonte de toda a magia do planeta, das hordas
do Submundo. Monte um grupo de heróis de classes diferentes, combine suas
habilidades no momento certo e faça a floresta renascer cada vez mais forte.

**Diferencial:** diferente de clickers tradicionais, as habilidades dos heróis
são ativadas manualmente pelo jogador. O momento e a ordem em que elas são
usadas (combos e sinergias) são o centro da estratégia.

## História
Eldora é um planeta encantado, sustentado pela magia da natureza que flui da
Grande Árvore. Quando os invasores do Submundo rompem a barreira entre os mundos
com o objetivo de corromper e destruir a Árvore, ela desperta e escolhe seus
guardiões: heróis de diferentes classes que lutarão para proteger a fonte de
vida do planeta.

A cada região reconquistada, a Árvore recupera parte de seu poder e desperta
novos guardiões.

## Loop principal
1. O jogador clica nos inimigos para causar dano (dano de clique).
2. Os heróis recrutados atacam automaticamente (dano por segundo, DPS).
3. Inimigos derrotados soltam **Seiva** (moeda principal).
4. A Seiva é usada para subir o nível dos heróis e do clique.
5. O jogador ativa habilidades no momento certo para vencer ondas difíceis e
   chefes.
6. Ao derrotar o chefe, avança para a próxima fase/região.

## Seleção de personagens
- No início do jogo, o jogador escolhe **1 personagem** como líder.
- O líder concede um **Bônus de líder** exclusivo enquanto estiver nessa função.
- Os demais personagens são desbloqueados ao avançar (um a cada chefe de região).
- Novos personagens aumentam o dano total e adicionam novas habilidades à barra
  do jogador.
- Cada habilidade tem **tempo de recarga** e é ativada manualmente.

## Atributos de combate

**Heróis:** Força (dano físico), Poder Arcano (dano mágico), Velocidade de
Ataque, Precisão, Chance de Crítico, Resistência.

**Inimigos:**
- **Evasão:** chance de esquivar dos ataques (reduzida por Precisão)
- **Resistência física / mágica:** reduz o dano recebido de cada tipo
- **Fúria (chefes):** o timer do chefe (30s). Quando acaba, o jogador volta uma
  onda. Efeitos de controle (atordoar, prender) pausam a Fúria.
- **Interrupção (chefes):** chefes podem interromper habilidades de conjuração
  periodicamente, a menos que estejam controlados.
- **Efeitos negativos (chefes):** chefes podem aplicar debuffs ao grupo, como
  redução de velocidade de ataque.

**Tipos de dano contínuo:** Veneno e Sangramento causam dano por segundo e podem
interagir entre si (ver Sinergias).

## Personagens

### Kael Raizférrea — Guerreiro
Guardião das raízes da Grande Árvore, cuja espada foi forjada com ferro
cristalizado na seiva ancestral. Especialista em ataque e controle.
**Bônus de líder:** +25% de dano contra chefes.

| Habilidade | Tipo | Efeito | Recarga |
|---|---|---|---|
| **Corte Dimensional** | Ataque | Um golpe que rasga o próprio espaço, causando 1500% de dano físico a todos os inimigos e ignorando 30% da resistência física. | 20s |
| **Investida do Baluarte** | Controle | Kael avança com o escudo, causa 400% de dano e atordoa os inimigos por 3s (pausa a Fúria dos chefes). | 25s |
| **Brado Aterrador** | Debuff | Um grito de guerra que causa Medo: inimigos perdem 30% de resistência física por 10s. | 30s |

### Lyra Folhaveloz — Arqueira
Batedora élfica que caça nas copas da floresta; dizem que suas flechas seguem o
vento. Especialista em dano rápido e preciso.
**Bônus de líder:** 30% de chance de executar um clique duplo crítico.

| Habilidade | Tipo | Efeito | Recarga |
|---|---|---|---|
| **Flecha Dupla** | Ataque | Dispara duas flechas, cada uma causando 300% de dano físico. | 8s |
| **Tiro Preciso** | Ataque (conjuração) | Concentra a mira por 2s e dispara uma flecha com crítico garantido de 3000% de dano. Se Lyra for interrompida, a habilidade é perdida. | 30s |
| **Ventos Ligeiros** | Buff de grupo | Lyra e todos os aliados ganham +50% de velocidade de ataque por 12s. | 40s |

### Orina Brumaestrela — Maga
Estudiosa das estrelas que caem sobre a floresta; canaliza a magia bruta que
corre pelos galhos da Grande Árvore. Especialista em dano mágico em área.
**Bônus de líder:** +20% de Poder Arcano para todo o grupo.

| Habilidade | Tipo | Efeito | Recarga |
|---|---|---|---|
| **Prisão de Espinhos** | Controle / debuff | Vinhas mágicas prendem os inimigos por 2s; enquanto presos, recebem +25% de dano mágico. | 18s |
| **Tempestade Arcana** | Ataque contínuo | Raios caem por 6s, causando 200% de dano mágico por segundo a todos os inimigos. | 35s |
| **Chuva de Meteoros** | Ataque | Uma chuva de estrelas causa 2500% de dano mágico em área. | 45s |

### Seraphine Aurora — Clériga
Sacerdotisa que ouve a voz da Grande Árvore; sua luz é o veneno natural das
criaturas do Submundo. Especialista em suporte e buffs.
**Bônus de líder:** +15% de Seiva obtida.

| Habilidade | Tipo | Efeito | Recarga |
|---|---|---|---|
| **Bênção da Grande Árvore** | Buff de grupo | Por 15s, todos os aliados ganham +20% de Precisão, +30% de Força e +25% de velocidade de ataque. | 30s |
| **Luz Divina** | Ataque | Um pilar de luz atinge todos os inimigos, causando 800% de dano mágico (+50% contra criaturas do Submundo). | 25s |
| **Carrilhão da Aurora** | Buff de grupo | O badalar de um sino sagrado aumenta a Resistência dos aliados em 40% e os torna imunes a efeitos negativos por 10s. | 45s |

### Vex Sombraespinho — Assassino
Ex-espião do Submundo que traiu os invasores e agora usa os truques deles contra
eles mesmos. Especialista em dano contínuo e precisão.
**Bônus de líder:** +30% de dano contra inimigos sob efeitos de dano contínuo.

| Habilidade | Tipo | Efeito | Recarga |
|---|---|---|---|
| **Bomba de Veneno** | Dano contínuo | Envenena todos os inimigos: 100% de dano por segundo durante 8s. Acumula até 3 vezes. | 15s |
| **Bomba de Fumaça** | Buff de grupo | Uma nuvem cega os inimigos: por 10s, os ataques dos aliados não erram (evasão inimiga zerada) e ganham +15% de chance de crítico. | 35s |
| **Golpe Sangrento** | Ataque + dano contínuo | Causa 600% de dano e aplica Sangramento: 150% de dano por segundo durante 6s. | 20s |

## Sinergias entre habilidades
- **Medo + dano físico:** Brado Aterrador antes de Corte Dimensional, Flecha
  Dupla ou Golpe Sangrento.
- **Atordoar + conjuração:** Investida do Baluarte ou Prisão de Espinhos
  garantem que o Tiro Preciso não seja interrompido.
- **Fumaça + crítico:** Bomba de Fumaça + Tiro Preciso = acerto garantido e dano
  máximo.
- **Veneno + Sangramento:** inimigos com os dois efeitos recebem +25% de dano de
  todas as fontes.
- **Bênção + Ventos Ligeiros:** os bônus de velocidade de ataque se somam, ideal
  para fases de chefe.
- **Carrilhão + chefes:** a imunidade a efeitos negativos anula os debuffs
  aplicados pelos chefes.

## Inimigos e camada estratégica
- **Blindados:** alta resistência física (fracos contra Maga e Clériga).
- **Ágeis:** alta evasão (fracos contra Bomba de Fumaça e Bênção).
- **Conjuradores:** alta resistência mágica (fracos contra Guerreiro e
  Arqueira).
- **Chefes:** muita vida, Fúria, interrupções e debuffs (exigem controle e
  combos).

## Progressão
- **Fases:** 10 ondas por fase; a 10ª é um chefe.
- **Regiões:** cada 5 fases formam uma região com visual e inimigos próprios
  (Bosque Encantado, Pântano Sombrio, Montanhas Cristalinas, Raízes Profundas).
- **Desbloqueio de personagens:** um novo personagem a cada chefe de região.
- **Renascimento (prestígio):** o jogador pode reiniciar o progresso em troca de
  **Sementes Ancestrais**, que dão bônus permanentes.
- **Progresso offline:** os heróis continuam gerando Seiva enquanto o jogador
  está fora (limite de 8 horas).

## Recursos
| Recurso | Como ganha | Para que serve |
|---|---|---|
| Seiva | Derrotar inimigos | Upar heróis e o dano de clique |
| Sementes Ancestrais | Renascimento | Bônus permanentes |

## Interface
- Inimigo no centro da tela com barra de vida e indicador de efeitos ativos
  (veneno, sangramento, medo, atordoado).
- Timer de Fúria visível nas lutas contra chefes.
- Barra de habilidades na parte inferior, com ícones, recarga visual e atalhos de
  teclado (1, 2, 3...).
- Painel lateral com heróis, níveis e botões de upgrade.
- Números de dano flutuantes (crítico em destaque).
- Contador de Seiva e progresso de onda/fase no topo.

## Estrutura técnica (Phaser 4)
- **Cenas:** Boot → Preload → Menu → Seleção de Personagem → Jogo (+ cena de UI
  sobreposta)
- **Dados:** personagens, habilidades, inimigos e upgrades definidos em JSON
- **Sistemas separados:** combate, habilidades/recargas, efeitos de status
  (buffs/debuffs), economia e save
- **Números grandes:** notação abreviada (1K, 1M, 1B...) ou uma biblioteca como
  `break_infinity.js`
- **Save:** `localStorage` com salvamento automático a cada 30 segundos

## Escopo do MVP
- [ ] Clique causando dano em um inimigo
- [ ] Seleção de personagem inicial (Kael ou Orina)
- [ ] Kael e Orina jogáveis com suas 3 habilidades e bônus de líder
- [ ] Sistema de efeitos de status (atordoar, medo, prisão)
- [ ] 1 região com 5 fases e 1 chefe com Fúria
- [ ] Upgrades com Seiva
- [ ] Save/load local

## Fora do MVP (futuro)
- Lyra, Seraphine e Vex
- Renascimento e Sementes Ancestrais
- Progresso offline
- Regiões adicionais
- Conquistas, sons e música, eventos sazonais