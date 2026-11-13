# Infinity Grove — Prompts de Assets da Interface (Gemini)

Prompts para gerar, no Gemini, os assets da **interface**: o mapa do menu "Rever chefes", os ícones das 4 peças de equipamento e os ícones da árvore de talentos. Os personagens e as habilidades continuam em `PROMPTS_ASSETS.md`.

Total: **1 mapa + 4 ícones de equipamento + 10 ícones de talento + 20 ícones dos graus 2 e 3 + 2 texturas = 37 imagens.**

## Como usar

1. Em cada geração, cole **primeiro** o bloco do estilo (**ESTILO DO MAPA** para o mapa, **ESTILO DOS ÍCONES** para os ícones) e depois o prompt do asset.
2. Os ícones usam **fundo magenta chapado (#FF00FF)**: o Gemini não gera PNG transparente de forma confiável. Remova o magenta com chroma key (Photopea, GIMP, remove.bg) e exporte em **PNG**.
3. O mapa **não** usa fundo magenta: é uma imagem inteira, exportada em **JPG** (qualidade 85 ou mais).
4. Se a imagem vier com texto, moldura ou número, repita pedindo: *"No text, no numbers, no letters, no frame, no UI."*
5. Os prompts estão em inglês porque costumam render melhor; as explicações estão em português.
6. Salve os arquivos em `game/public/assets/` com **exatamente** os nomes indicados abaixo. Enquanto um arquivo não existir, o jogo mostra um desenho de reserva (ícone simples ou o caminho desenhado em CSS), então nada quebra.
7. Depois de gerar o mapa, me mande a imagem: eu ajusto no código as posições dos 11 pontos (fases e chefe) para casarem com o caminho que o Gemini desenhou.

---

## ESTILO DO MAPA (colar no prompt do mapa)

```
Style: 2D hand-painted fantasy game map, same look as a polished mobile RPG
world map. Clean soft outlines, painterly cel shading, rich saturated colors,
warm parchment-and-forest palette with glowing green and gold sap magic (the Great
Tree theme). Seen from a high three-quarter top-down angle, like a diorama.
No text, no numbers, no letters, no labels, no UI, no characters, no frame, no
border, no watermark, no compass, no legend.
```

## 1. Mapa da jornada — `boss-map.jpg`

**Uso:** fundo da janela "Rever chefes". O jogo desenha por cima 10 botões de miniboss (fases 1 a 10) e 1 botão do chefe do capítulo, e escreve os números e nomes. Por isso o mapa precisa ter **11 pontos vazios e bem marcados** ao longo do caminho.

**Tamanho:** paisagem **16:9**, 1792×1008 px (o jogo mostra a imagem em ~880×495 px).

### Como os níveis aparecem

- São **10 clareiras circulares** (placas de pedra musgosa com runas apagadas, cerca de 6% da largura da imagem cada), **vazias**: sem número, sem bandeira, sem inimigo. O jogo coloca a bandeira, o número e o estado (derrotado, atual, bloqueado) por cima.
- O **11º ponto** é o **chefe do capítulo**: uma estrutura grande no topo direito (portão de uma fortaleza em ruínas corrompida, com uma árvore retorcida escura ao fundo), claramente maior que as clareiras (cerca de 14% da largura).
- O caminho liga os pontos **em ordem**, sem bifurcações e sem cruzar a si mesmo: é uma única estrada de terra e pedra, larga (cerca de 3% da largura), em formato de **S de três fileiras**.
- O ambiente muda ao longo da jornada, para dar sensação de progresso: **início** (fileira de baixo) = floresta viva, verde clara, cheia de luz dourada e vagalumes; **meio** = névoa, árvores mais altas e escuras, raízes grossas; **fim** (fileira de cima) = terreno corrompido, galhos secos, brasas e névoa roxa, e a fortaleza do chefe no final.

### Posições aproximadas (em % da imagem, origem no canto superior esquerdo)

| Ponto | x | y | Observação |
|---|---|---|---|
| Fase 1 | 10 | 84 | início, perto das raízes da Grande Árvore (canto inferior esquerdo) |
| Fase 2 | 28 | 88 | |
| Fase 3 | 46 | 84 | |
| Fase 4 | 64 | 88 | |
| Curva da direita | 88 | 76 | a estrada sobe, sem clareira |
| Fase 5 | 80 | 62 | fileira do meio, andando para a esquerda |
| Fase 6 | 58 | 56 | |
| Fase 7 | 36 | 60 | |
| Curva da esquerda | 12 | 48 | a estrada sobe, sem clareira |
| Fase 8 | 20 | 30 | fileira de cima, andando para a direita |
| Fase 9 | 40 | 24 | |
| Fase 10 | 60 | 30 | |
| Chefe | 84 | 16 | fortaleza corrompida, canto superior direito |

As posições são um alvo, não precisam ser exatas. O que importa: ordem do caminho, 10 clareiras iguais e vazias e o chefe grande no fim.

### Prompt

```
[ESTILO DO MAPA]
A wide 16:9 landscape fantasy journey map for an idle RPG, a single winding road
shaped like a three-row "S". The road starts in the bottom-left corner among the
huge glowing roots of the Great Tree, runs right along the bottom row, curves up
at the right edge, runs left along the middle row, curves up at the left edge,
then runs right along the top row and ends at a big corrupted ruined fortress
gate in the top-right corner (the final boss lair). The road is made of packed
dirt and mossy flagstones, wide and clearly readable, with no forks and no
crossings.

Along the road place exactly 10 identical round stone clearings (mossy circular
stone pads with faint worn runes, about 6% of the image width each), evenly
spaced: 4 on the bottom row, 3 on the middle row, 3 on the top row. Every
clearing must be completely EMPTY: no numbers, no flags, no signs, no
creatures, no icons, because the game will draw those on top. The fortress gate
at the end is much larger than the clearings (about 14% of the image width),
dark and menacing, with purple mist and ember glow, clearly different from the
clearings.

The scenery tells the journey from start to end: the bottom row is a living
bright green forest full of golden fireflies and glowing sap; the middle row
turns misty with taller darker trees and thick roots; the top row is corrupted,
with dry twisted branches, embers, cracked ground and purple fog. Leave the
road and the 11 spots unobstructed by trees or rocks. Keep a soft vignette and
keep every important element at least 4% away from the image edges.
No text, no numbers, no letters, no UI, no characters, no frame.
```

**Negativo (se necessário):**
```
Avoid: photorealism, 3D render, blurry, text, numbers, letters, labels, icons on
the clearings, characters, creatures on the road, forks in the road, a road that
crosses itself, watermark, border.
```

---

## ESTILO DOS ÍCONES (colar em todo prompt de ícone)

```
Style: 2D hand-painted fantasy game item icon, clean bold dark outline, soft cel
shading with rich painterly color, vibrant saturated palette, high contrast, a
single object centered, slight three-quarter view, readable at 64x64 px. Mystical
forest-of-light theme (the Great Tree, glowing green and gold sap magic).
FRAMING (critical): square 1:1 canvas, the object fills about 70% of the canvas,
at least 10% empty margin on every side, nothing touches the edges. Flat solid
magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no
watermark, no frame, no border, no UI.
Avoid: photorealism, 3D render, blurry, text, multiple objects, hands, characters.
```

Os ícones de equipamento são **neutros** (sem cor de raridade): o jogo desenha a borda colorida da raridade por cima. Use madeira clara, ferro e seiva verde-dourada.

---

## 2. Ícones de equipamento

### 2.1 Arma — `slot-weapon.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a single longsword lying diagonally from bottom-left to top-right, blade
of translucent amber crystal with glowing green-gold sap inside, hilt of dark
wood wrapped with root-like patterns, small leaf-shaped crossguard.
```

### 2.2 Armadura — `slot-armor.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a single chest armor (breastplate) seen from the front, dark bronze plates
with moss green trim and root-like engraved patterns, glowing green sap veins,
leaf-shaped shoulder guards.
```

### 2.3 Anel — `slot-ring.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a single ring standing upright, band of twisted golden roots holding a
round glowing emerald-green gem, tiny leaves around the gem, soft sap glow.
```

### 2.4 Amuleto — `slot-amulet.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a single amulet pendant on a short curved chain, a carved wooden disc
with a tiny Great Tree emblem in gold, glowing green sap in the carved lines,
small hanging leaf charms.
```

---

## 3. Ícones da árvore de talentos

Quatro ramos, cada um com um tema de cor para o jogo reconhecer de relance: **Tempo** (azul-turquesa), **Quebra de defesa** (vermelho-brasa), **Poder do clique** (dourado) e **Combo** (esmeralda e dourado).

### Ramo Tempo

#### 3.1 Tempo do miniboss — `talent-miniboss-time.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a small pocket hourglass with turquoise glowing sand and a tiny horned
skull-shaped cap on top, wooden frame wrapped with roots, turquoise light glow.
```

#### 3.2 Tempo do chefe do capítulo — `talent-boss-time.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a large ornate hourglass with turquoise glowing sand and a golden crown
on top, frame of dark wood and gold with root patterns, a few turquoise sparks
around it, looks more grand than a small hourglass.
```

### Ramo Quebra de defesa

#### 3.3 Quebra da defesa física — `talent-break-physical.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a cracked round iron shield split in the middle by a glowing ember-red
fracture, small metal shards flying off, red-orange glow in the crack.
```

#### 3.4 Quebra da defesa mágica — `talent-break-magical.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a shattering translucent magic barrier in the shape of a hexagonal rune
shield, cracked with ember-red lines, violet glass-like shards flying off, red
glow in the cracks.
```

#### 3.5 Quebra da resistência a crítico — `talent-break-crit.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a broken chain link of dark iron snapping apart, with a small ember-red
starburst between the two halves, sparks and metal shards flying.
```

### Ramo Poder do clique

#### 3.6 Dano de clique — `talent-click-damage.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a golden gauntlet fist with a pointing index finger pressing down, a
golden shockwave ring and sparks around the fingertip, fist plated in gold with
green leaf engravings.
```

#### 3.7 Chance de crítico — `talent-crit-chance.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a golden targeting reticle (concentric circles with crosshair lines) with
a bright four-point star flare in the center, golden light trail, green gem at
the top of the ring.
```

#### 3.8 Dano crítico — `talent-crit-damage.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a bursting golden impact starburst with sharp jagged spikes and a white
hot core, tiny flying sparks and leaf fragments, an explosive burst shape that
reads as a critical hit.
```

### Ramo Poder do clique (continuação)

#### 3.9 Dano direto do clique — `talent-click-flat-damage.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a single golden gauntlet fingertip tapping down onto a glowing green-gold
rune stone, a round impact crater with a bright golden shockwave ring on the
stone, a heavy blunt hit feeling, small golden sparks. No text, no numbers.
```

### Ramo Combo

O Combo tem cor própria: **verde-esmeralda com dourado** (a seiva da Grande Árvore).

#### 3.10 Limite de dano do combo — `talent-combo.png`
```
[ESTILO DOS ÍCONES]
OBJECT: a glowing emerald-green chain of three linked rings rising diagonally,
each ring brighter than the one before, topped by a golden upward arrow-shaped
leaf, golden sap sparks along the chain, wooden root band holding the rings.
```

---

## 4. Ícones dos graus 2 e 3

Cada talento tem 3 graus e cada grau tem seu ícone. O **grau 1** é o arquivo normal das seções 3.1 a 3.10. Os graus 2 e 3 usam o **mesmo objeto**, ficando mais nobres a cada grau, e a **cor do ramo continua a mesma** (turquesa, vermelho-brasa, dourado, esmeralda), para o jogador reconhecer o talento de relance.

**Como gerar (melhor resultado):** anexe no Gemini o ícone do grau 1 já pronto e peça: *"Redraw this exact icon as GRADE 2 (or 3) using the block below, same object, same pose, same colors."* Sem imagem de referência, cole **ESTILO DOS ÍCONES + o OBJECT da seção 3 do talento + o bloco do grau**, nessa ordem.

### Bloco GRAU 2 (colar depois do OBJECT)
```
GRADE 2 (improved): same object and same pose as the base version, but the
materials are upgraded: polished silver-steel and bright metal replace plain
iron and wood, an extra ornamental detail (a small engraved leaf rune band), a
brighter and larger glow in the branch color, and a few more sparks. A small
silver-bordered gem is added on the object. Still clearly the same icon.
```

### Bloco GRAU 3 (colar depois do OBJECT)
```
GRADE 3 (legendary): same object and same pose as the base version, but fully
legendary: gleaming gold and ornate filigree, a radiant halo of light behind the
object, a small golden laurel of leaves around its base, a larger faceted gem
glowing in the branch color, intense glow and many floating sparks and tiny
leaf particles. Looks like the rarest, most powerful version. Still clearly the
same icon, still centered and inside the safe margin.
```

### Arquivos por talento e grau

| Talento | Grau 2 | Grau 3 | Detalhe extra do grau (pode juntar ao bloco) |
|---|---|---|---|
| Tempo do miniboss (3.1) | `talent-miniboss-time-g2.png` | `talent-miniboss-time-g3.png` | G2: areia com brilho mais forte; G3: chifres dourados na tampa |
| Tempo do chefe (3.2) | `talent-boss-time-g2.png` | `talent-boss-time-g3.png` | G2: coroa de prata; G3: coroa dourada com gemas e areia que flutua |
| Quebra física (3.3) | `talent-break-physical-g2.png` | `talent-break-physical-g3.png` | G2: rachadura maior, escudo de aço; G3: escudo dourado partido em 2 metades com luz saindo |
| Quebra mágica (3.4) | `talent-break-magical-g2.png` | `talent-break-magical-g3.png` | G2: runa extra e mais cacos; G3: barreira dupla se estilhaçando com núcleo brilhante |
| Quebra de crítico (3.5) | `talent-break-crit-g2.png` | `talent-break-crit-g3.png` | G2: elo de aço com faísca maior; G3: elo dourado explodindo em estrela |
| Dano de clique (3.6) | `talent-click-damage-g2.png` | `talent-click-damage-g3.png` | G2: luva de aço e 2 anéis de onda; G3: luva dourada e 3 anéis de onda com raios |
| Chance de crítico (3.7) | `talent-crit-chance-g2.png` | `talent-crit-chance-g3.png` | G2: mira com 2 estrelas; G3: mira dourada com asas de folhas |
| Dano crítico (3.8) | `talent-crit-damage-g2.png` | `talent-crit-damage-g3.png` | G2: explosão com mais espinhos; G3: explosão dourada gigante com núcleo branco |
| Dano direto do clique (3.9) | `talent-click-flat-damage-g2.png` | `talent-click-flat-damage-g3.png` | G2: runa com 2 rachaduras de luz; G3: runa dourada partida, coluna de luz subindo |
| Limite do combo (3.10) | `talent-combo-g2.png` | `talent-combo-g3.png` | G2: 4 elos; G3: 5 elos com flecha de ouro e halo |

Exemplo completo (Dano de clique, grau 3):
```
[ESTILO DOS ÍCONES]
OBJECT: a golden gauntlet fist with a pointing index finger pressing down, a
golden shockwave ring and sparks around the fingertip, fist plated in gold with
green leaf engravings.
[Bloco GRAU 3]
EXTRA: a gold gauntlet with three golden shockwave rings and light rays.
```

Enquanto o arquivo de um grau não existir, o jogo mostra o ícone do grau 1 (e, se este também faltar, o desenho de reserva).

---

## 5. Texturas da interface

Duas texturas **repetíveis** (as bordas se encaixam) para os painéis de pergaminho e as molduras de madeira. Sem fundo magenta: são imagens inteiras, em **JPG** (qualidade 85 ou mais), **512×512 px**.

Enquanto o arquivo não existir, o jogo desenha o pergaminho e a madeira com gradientes de CSS. Depois de salvar o arquivo em `game/public/assets/`, troque **uma linha** em `game/public/style.css`, no bloco `:root`:

| Arquivo | Linha de hoje | Linha nova |
|---|---|---|
| `ui-parchment.jpg` | `--texture-parchment: none;` | `--texture-parchment: url("assets/ui-parchment.jpg");` |
| `ui-wood.jpg` | `--texture-wood: none;` | `--texture-wood: url("assets/ui-wood.jpg");` |

### 5.1 Pergaminho — `ui-parchment.jpg`

```
Seamless tileable texture, 512x512, flat top-down scan of aged fantasy
parchment paper. Warm cream and light tan (#f4e6c8 to #e6d0a2), soft fibers,
faint stains and mottling, very low contrast so dark text stays readable on it.
Even lighting, no vignette, no burnt edges, no folds, no shadows, no objects.
No text, no letters, no symbols, no frame, no border, no watermark.
The left edge must continue the right edge and the top edge the bottom edge.
```

### 5.2 Madeira escura — `ui-wood.jpg`

```
Seamless tileable texture, 512x512, flat top-down view of dark stained oak
planks for a fantasy RPG interface. Deep brown (#3d2a1c to #1c120c), visible
grain running horizontally, subtle warm highlights, low contrast so light text
stays readable on it. Even lighting, no vignette, no nails, no metal, no
objects. No text, no letters, no symbols, no frame, no border, no watermark.
The left edge must continue the right edge and the top edge the bottom edge.
```

---

## Checklist de arquivos

Todos em `game/public/assets/`:

| Arquivo | Formato | Fundo |
|---|---|---|
| `boss-map.jpg` | JPG 16:9 | cenário inteiro |
| `slot-weapon.png`, `slot-armor.png`, `slot-ring.png`, `slot-amulet.png` | PNG 1:1 | transparente (chroma key do magenta) |
| `talent-miniboss-time.png`, `talent-boss-time.png` | PNG 1:1 | transparente |
| `talent-break-physical.png`, `talent-break-magical.png`, `talent-break-crit.png` | PNG 1:1 | transparente |
| `talent-click-damage.png`, `talent-crit-chance.png`, `talent-crit-damage.png` | PNG 1:1 | transparente |
| `talent-click-flat-damage.png`, `talent-combo.png` | PNG 1:1 | transparente |
| `talent-<nome>-g2.png` e `talent-<nome>-g3.png` dos 10 talentos (seção 4) | PNG 1:1 | transparente |
| `ui-parchment.jpg`, `ui-wood.jpg` | JPG 1:1, 512×512, repetível | textura inteira (seção 5) |

## Coisas que NÃO precisam de asset (feitas em CSS no jogo)

- A roda dos elementos (fogo, natureza, água, luz, escuridão).
- As bordas coloridas de raridade das peças, as estrelas e o combo.
- Os marcadores de fase do mapa (bandeira, número, estados derrotado, atual e bloqueado).
