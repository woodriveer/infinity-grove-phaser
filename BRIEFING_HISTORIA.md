# Infinity Grove — Briefing da História

Documento de trabalho para decidirmos juntos a história da campanha. Junta tudo o que já existe (README, `PROMPTS_ASSETS_MONSTROS.md`, `PROMPTS_ASSETS_UI.md`, código) e propõe como a história evolui por 30 capítulos. As decisões estão na seção 5.

---

## 1. O que já é canon (existe hoje)

| Fato | Fonte |
|---|---|
| **Eldora**, planeta encantado, sustentado pela magia que flui da **Grande Árvore** | README, "História" |
| Os invasores do **Submundo** romperam a barreira entre os mundos para corromper e destruir a Árvore | README |
| A Árvore desperta e escolhe **guardiões**; a cada região reconquistada recupera poder | README |
| **Seiva** é a moeda; **Sementes Ancestrais** vêm do renascimento | README |
| Slogan no menu: "Defenda a Grande Árvore das hordas do Submundo." | `game/src/adapters/phaser/MainMenu.js:5` |
| A campanha tem **15 capítulos** de 10 estágios; o chefe de cada capítulo tem elemento fixo, na ordem Trevas, Fogo, Água, Natureza, Luz (repete a cada 5) | `PROMPTS_ASSETS_MONSTROS.md`, spec `campaign-chapters` |
| Biomas dos atos: **Bosque Desperto** (1–5), **Raízes Profundas** (6–10), **Copa Celeste** (11–15) | `PROMPTS_ASSETS_MONSTROS.md` |
| Chefe do capítulo 15: **A Luz Faminta, Serafim Caído da Grande Árvore** | `PROMPTS_ASSETS_MONSTROS.md` |

### Os 5 heróis

| Herói | Classe | Origem (README) |
|---|---|---|
| **Kael Raizférrea** | Guerreiro | Guardião das raízes; espada de ferro cristalizado na seiva ancestral |
| **Lyra Folhaveloz** | Arqueira | Batedora élfica das copas; as flechas seguem o vento |
| **Orina Brumaestrela** | Maga | Estuda as estrelas que caem sobre a floresta; canaliza a magia dos galhos |
| **Seraphine Aurora** | Clériga | **Sacerdotisa que ouve a voz da Grande Árvore**; sua luz é veneno para o Submundo. Habilidade: **Carrilhão da Aurora** (sino sagrado) |
| **Vex Sombraespinho** | Assassino | **Ex-espião do Submundo** que traiu os invasores |

> Repare: o material já planta duas pistas sem querer. Seraphine "ouve a voz da Árvore" e o chefe 15 é um "Serafim Caído". E Vex, vindo do Submundo, é o suspeito óbvio. A proposta abaixo usa as duas.

### Inconsistências a resolver

- README fala em 4 regiões (Bosque Encantado, Pântano Sombrio, Montanhas Cristalinas, Raízes Profundas); os prompts usam 3 atos. **Proposta:** valem os atos deste briefing; o README é atualizado depois.
- README diz "um herói novo por chefe de região"; o jogo hoje dá a equipe a partir do capítulo 5. A história não deve depender da ordem de desbloqueio.
- O jogo **não tem onde contar história** hoje (sem intro, sem texto entre capítulos). Ver decisão D8.

---

## 2. Estrutura: 30 capítulos em 6 atos

Primeira metade (atos 1–3): defender Eldora, subindo da floresta até a copa. Virada no capítulo 15. Segunda metade (atos 4–6): descer ao Submundo e fechar os portões.

| Ato | Capítulos | Bioma | Arco |
|---|---|---|---|
| 1 | 1–5 | Bosque Desperto | A invasão: os bichos do bosque estão sendo corrompidos |
| 2 | 6–10 | Raízes Profundas | A origem: a corrupção sobe pelas raízes, de baixo |
| 3 | 11–15 | Copa Celeste | O coração da Árvore — **e a traição** |
| 4 | 16–20 | Terras Fendidas | A fenda aberta; Eldora já virou meio Submundo |
| 5 | 21–25 | O Submundo | Dentro do mundo inimigo |
| 6 | 26–30 | Trono Sob as Raízes | O grande chefe e o fechamento dos portões |

Pela ordem de elementos, **todo fim de ato (5, 10, 15, 20, 25, 30) é um chefe de Luz**. Proposta de tema: cada final de ato é uma "falsa luz" — o inimigo imita a luz da Árvore. Isso dá sentido ao chefe final ser de Luz.

---

## 3. A história, ato por ato

### Ato 1 — Bosque Desperto (1–5)
Os animais do bosque aparecem com olhos vermelhos, chifres e veias roxas. A Árvore desperta os guardiões. Seraphine diz ouvir a Árvore e passa a guiar o grupo — ela é a voz da missão.
- **Fim (cap. 5):** a **Coruja Áurea, Guardiã da Seiva**, morre dizendo: *"A luz que vocês seguem... não nasceu da Árvore."* O grupo acha que ela fala do Submundo.

### Ato 2 — Raízes Profundas (6–10)
O grupo descobre que a corrupção não vem de fora: sobe pelas raízes. Embaixo da Árvore existe um **Selo** antigo entre Eldora e o Submundo, e ele está rachado.
- Vex reconhece marcas do Submundo e vira o suspeito do grupo (pista falsa).
- **Pista:** perto do Selo, um eco de sino ressoa nas pedras (o Carrilhão de Seraphine).
- **Pista:** o Selo foi quebrado **por cima**, de dentro do santuário da Árvore — onde só sacerdotes entram.
- **Fim (cap. 10):** o Selo está aberto. A única saída é subir à Copa e reacender o coração da Árvore.

### Ato 3 — Copa Celeste (11–15)
Subida até o topo. Os inimigos ficam mais fortes perto do coração da Árvore, como se algo ali os alimentasse. Seraphine insiste em chegar primeiro ao coração.
- **Fim (cap. 15) — o plot twist:** a **Luz Faminta** cai, e dentro dela está o **Carrilhão da Aurora** rachado. A memória do sino mostra Seraphine, meses antes, tocando-o diante do Selo porque "a Árvore pediu". A voz que ela ouvia nunca foi a Árvore: era **Morvath, o Rei Sob as Raízes**, falando através das raízes. Seraphine abriu os portões.

### Ato 4 — Terras Fendidas (16–20)
O grupo racha. Vex, acusado o tempo todo, é quem defende Seraphine ("eu também já servi a voz errada"). Eles descem pela fenda; o bosque do ato 1 reaparece meio engolido pelo Submundo.
- **Fim (cap. 20):** os portões são encontrados — só fecham por dentro.

### Ato 5 — O Submundo (21–25)
O mundo de Morvath: rios de cinza, florestas de osso, a Seiva roubada correndo para baixo. Seraphine descobre que o Carrilhão também é a chave para fechar os portões.
- **Fim (cap. 25):** o grupo chega à cidadela; Morvath oferece a Seraphine voltar a "ouvir a Árvore" se ela se entregar.

### Ato 6 — Trono Sob as Raízes (26–30)
A batalha final. **Cap. 30: Morvath, o Rei Sob as Raízes**, chefe de Luz, uma luz falsa e dourada que imita a Árvore. Ao cair, Seraphine toca o Carrilhão e os portões se fecham. Seraphine fica do lado de dentro e passa a ser a voz verdadeira da Árvore (D5).

---

## 4. Monstros por ato

Regra geral (combinada antes): a **marca do Submundo** é a mesma em todos (olhos vermelhos, chifres pretos, veias roxas); o elemento só muda paleta e efeito; cada elemento é **uma família**, e monstro → add → miniboss → chefe é o mesmo bicho crescendo.

| Ato | Fogo | Água | Natureza | Luz | Trevas |
|---|---|---|---|---|---|
| 1 Bosque Desperto | raposas e ursos | felinos (lince) | cervos e javalis | corujas e aves | répteis e insetos |
| 2 Raízes Profundas | salamandras de magma | sapos e axolotes de caverna | toupeiras e texugos | morcegos albinos | aranhas e escorpiões |
| 3 Copa Celeste | gaviões até fênix | rãs-arborícolas | esquilos e macacos | borboletas douradas | corvos |
| 4 Terras Fendidas | os bichos do ato 1 **meio fundidos** com demônios: mesma família, mais monstruosa | | | | |
| 5 O Submundo | demônios nativos: diabretes de brasa | enguias de cinza | árvores de osso | anjos falsos de luz | sombras vivas |
| 6 Trono Sob as Raízes | a guarda de elite de Morvath, uma por elemento, mais armadura e coroas | | | | |

Chefes de fim de ato: 5 Coruja Áurea · 10 Morcego Prismático · 15 A Luz Faminta · 20 Guardião dos Portões · 25 Arauto da Falsa Aurora · 30 **Morvath, o Rei Sob as Raízes**.

---

## 5. Decisões (fechadas em 2026-11-28)

O dono aprovou todas as recomendações. As seções 2 a 4 passam a ser o canon da campanha.

| # | Decisão |
|---|---|
| D1 | **6 atos** de 5 capítulos: 1–5, 6–10, 11–15, 16–20, 21–25, 26–30 |
| D2 | A traidora é **Seraphine Aurora** |
| D3 | Ela foi **enganada** pela voz de Morvath, mas **escondeu** o que fez quando percebeu |
| D4 | Seraphine **continua jogável** depois do capítulo 15 (arco de redenção, nada muda no gameplay) |
| D5 | Final: Seraphine fecha os portões por dentro com o Carrilhão e **fica no Submundo**, virando a voz verdadeira da Árvore (agridoce) |
| D6 | O grande chefe é **Morvath, o Rei Sob as Raízes**, que imita a luz da Árvore |
| D7 | **Vex** é a pista falsa nos atos 1–3 e defende Seraphine no ato 4 |
| D8 | A história é contada numa **cena de diálogo com voz gerada por IA depois de cada chefe de capítulo** (mais um prólogo), avançada por clique; roteiro, ficha de vozes e durações em `ROTEIRO_DIALOGOS.md` (feature nova, para o `product-owner`) |
| D9 | Arte de **add** só a partir do ato 3 (onde os adds existem no jogo: minibosses do cap. 11+) |

Próximos passos depois das decisões: reescrever `PROMPTS_ASSETS_MONSTROS.md` (6 atos, famílias, adds), atualizar a "História" do README e, se D8 for aprovada, pedir a spec ao `product-owner`. Estender o jogo para 30 capítulos é uma feature à parte (hoje `MAX_CHAPTER` é 15).
