# Infinity Grove — Prompts de Assets dos Monstros (Gemini)

Prompts para gerar a arte dos inimigos da campanha de **30 capítulos em 6 atos** (canon em `BRIEFING_HISTORIA.md`). Substitui a versão anterior de 3 atos: os nomes de arquivo continuam os mesmos, então as imagens novas dos atos 1 a 3 sobrescrevem as antigas.

## A regra do elenco

- **A marca do Submundo** é igual em todos os inimigos: olhos vermelhos brilhantes, chifres pretos curvos e veias roxas brilhando sob a pele. Quanto maior o nível, maiores os chifres e mais veias. É isso que liga todo inimigo à invasão do Submundo.
- **Cada elemento é uma família** em cada ato (ex.: no ato 1, Fogo são raposas e ursos). O elemento só muda a paleta e o efeito.
- **Os níveis são o mesmo bicho crescendo:** monstro comum (o filhote, pequeno) → add (o lacaio que protege o miniboss, com runa ou corrente roxa) → miniboss (o alfa, grande e blindado) → chefe (a forma lendária, enorme, com coroa de chifres, aura e partículas).
- **Adds só a partir do ato 3**: no jogo, os adds acompanham os minibosses do capítulo 11 em diante.
- **O chefe do capítulo** tem elemento fixo: o 1º capítulo de cada ato é Trevas, depois Fogo, Água, Natureza e Luz. Todo fim de ato é um chefe de Luz, uma "falsa luz" que imita a Grande Árvore; o último é Morvath.

| Ato | Capítulos | Bioma | O que são os inimigos |
|---|---|---|---|
| 1 | 1 a 5 | Bosque Desperto | Animais do bosque corrompidos |
| 2 | 6 a 10 | Raízes Profundas | Animais de caverna e subterrâneo |
| 3 | 11 a 15 | Copa Celeste | Animais das copas e do céu |
| 4 | 16 a 20 | Terras Fendidas | Os animais do ato 1 meio fundidos com demônios |
| 5 | 21 a 25 | O Submundo | Demônios nativos |
| 6 | 26 a 30 | Trono Sob as Raízes | A guarda de elite de Morvath |

Total: atos 1 e 2 com 15 imagens cada (5 comuns, 5 minibosses, 5 chefes) e atos 3 a 6 com 20 (mais 5 adds) = **110 imagens**.

> **Prioridade:** gere o ato 1 primeiro. O jogo hoje vai até o capítulo 15 (atos 1 a 3); os atos 4 a 6 dependem da extensão da campanha para 30 capítulos.

## Como usar

1. Cada bloco é **autocontido**: copie o bloco inteiro e cole no Gemini.
2. Gere uma **família inteira na mesma conversa** (monstro, add, miniboss e chefe do mesmo elemento), para o bicho crescer com o mesmo traço. A partir do segundo, anexe a imagem já aprovada da família e acrescente: *"Same creature family and art style as the attached image, next rank: bigger and more corrupted."*
3. Todos pedem **fundo magenta chapado (#FF00FF)**. Remova com chroma key (Photoshop, GIMP, Photopea) e exporte PNG com transparência.
4. Os monstros olham para a **ESQUERDA** (os heróis ficam à esquerda da tela). Se vier virado, peça: *"Mirror the creature so it faces LEFT."*
5. Exporte em 1024×1024 e salve com o nome do título em `game/public/assets/monsters/`. No jogo a área do monstro tem 220×250 px; chefes podem passar disso.
6. Se vier com cenário, chão, sombra ou texto, repita com: *"No text, no frame, no ground, no shadow, no scenery, flat solid magenta #FF00FF background."*
7. Se a marca do Submundo sumir (olhos de outra cor, sem chifres), repita a linha `UNDERWORLD MARK`.

Nomes de arquivo: `a<ato>-<elemento>-monster.png`, `a<ato>-<elemento>-add.png`, `a<ato>-<elemento>-miniboss.png` e `boss-c<capítulo>.png`.

> Ligar essas imagens no jogo (carregar no `Preloader`, escolher pelo ato, elemento e tipo do encontro) é uma feature à parte.

---

## Ato 1 — Bosque Desperto (capítulos 1 a 5)

| Elemento | Família | Monstro comum | Miniboss | Chefe do capítulo |
|---|---|---|---|---|
| Fogo | raposas e ursos | Raposa Brasa | Urso Brasa | Urso Fornalha |
| Água | felinos | Gato-do-Brejo | Lince do Brejo | Pantera do Brejo |
| Natureza | cervos e javalis | Gamo de Musgo | Javali Espinheiro | Rei-Javali Espinheiro |
| Luz | corujas | Mocho Lúmen | Coruja Solar | Coruja Áurea, Guardiã da Seiva |
| Trevas | serpentes | Víbora Umbral | Cobra-Real Umbral | Serpente Umbral, a Devoradora da Clareira |

### 1. `a1-fire-monster.png` — Raposa Brasa

Monstro comum · Fogo · família: raposas e ursos · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small young fox with ember-orange fur tipped in charcoal black, its tail ending in a small living flame, two short black horns, glowing molten cracks along its legs, sly crouched pose.
```

### 2. `a1-water-monster.png` — Gato-do-Brejo

Monstro comum · Água · família: felinos · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small wildcat with wet dark-blue fur and teal stripes, tufted ears with short black horns, water dripping from its fur, crouched ready to pounce.
```

### 3. `a1-nature-monster.png` — Gamo de Musgo

Monstro comum · Natureza · família: cervos e javalis · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small fawn with mossy brown fur and white spots, short black horn-nubs sprouting thorny twigs, leaves stuck to its back, skittish but hostile stance.
```

### 4. `a1-light-monster.png` — Mocho Lúmen

Monstro comum · Luz · família: corujas · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small round little owl with warm golden feathers, two tiny black horns like ear tufts, amber light leaking between its feathers.
```

### 5. `a1-darkness-monster.png` — Víbora Umbral

Monstro comum · Trevas · família: serpentes · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small coiled viper with violet and black scales, two short black horns, hissing with a forked tongue, a drop of purple venom on its fangs.
```

### 6. `a1-fire-miniboss.png` — Urso Brasa

Miniboss · Fogo · família: raposas e ursos · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a young bear on all fours, thick charcoal-black fur with glowing molten cracks, curved black horns, a shoulder plate of cooled lava rock, smoke puffing from its nostrils.
```

### 7. `a1-water-miniboss.png` — Lince do Brejo

Miniboss · Água · família: felinos · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large lynx with glossy teal and deep-blue fur, long ear tufts grown into curved black horns, swamp water flowing along its back like a mane, wet river-stone plates on its shoulders.
```

### 8. `a1-nature-miniboss.png` — Javali Espinheiro

Miniboss · Natureza · família: cervos e javalis · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a heavy wild boar with bark-like hide, a ridge of thorny vines and spikes along its spine, big curved tusks, curved black horns, moss and small mushrooms on its shoulders.
```

### 9. `a1-light-miniboss.png` — Coruja Solar

Miniboss · Luz · família: corujas · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large barn owl with gold and ivory feathers, wings half spread, curved black horns, a sun-like halo of light behind its head, talons glowing gold.
```

### 10. `a1-darkness-miniboss.png` — Cobra-Real Umbral

Miniboss · Trevas · família: serpentes · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large king cobra raised high with its hood fully spread, the hood patterned with glowing purple veins shaped like an eye, curved black horns, indigo scales, dark smoke around its coils.
```

### 11. `boss-c01.png` — Serpente Umbral, a Devoradora da Clareira

Chefe do capítulo · Trevas · família: serpentes · capítulo 1

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal serpent coiled in a tall S-shape, head raised high and looking down at the viewer, mouth open showing long fangs dripping glowing purple venom, a crown of curved black horns along its head and neck, dark violet scales cracked with glowing purple veins, dark smoke rising from its coils.
```

### 12. `boss-c02.png` — Urso Fornalha

Chefe do capítulo · Fogo · família: raposas e ursos · capítulo 2

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal bear rearing up on its hind legs, its chest a glowing furnace of molten lava seen through cracked rock-like plates, a crown of large curved black horns, flames rising from its back and shoulders, red-hot claws, embers swirling around it.
```

### 13. `boss-c03.png` — Pantera do Brejo

Chefe do capítulo · Água · família: felinos · capítulo 3

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal panther of deep-blue fur and living swamp water, a crown of black horns, a mane of flowing water with floating droplets around its head, glowing cyan markings mixed with the purple veins, water swirling in an aura around its paws, regal predatory pose.
```

### 14. `boss-c04.png` — Rei-Javali Espinheiro

Chefe do capítulo · Natureza · família: cervos e javalis · capítulo 4

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal king boar, massive tusks wrapped in thorny vines, a crown of black horns entwined with branches and leaves, its back a small thorny forest, roots trailing from its hooves, an aura of swirling leaves and spores.
```

### 15. `boss-c05.png` — Coruja Áurea, Guardiã da Seiva

Chefe do capítulo · Luz · família: corujas · capítulo 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 1 THEME: the awakened forest. Real woodland animals of a sunlit ancient forest, corrupted by the Underworld. They still look like the animal they were.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal majestic owl, the ancient guardian of the sap, wings fully spread in a radiant display, gold and ivory feathers dripping amber sap like glowing honey, a halo-crown of black horns and rays of light, purple corruption veins creeping through its golden plumage.
```

---

## Ato 2 — Raízes Profundas (capítulos 6 a 10)

| Elemento | Família | Monstro comum | Miniboss | Chefe do capítulo |
|---|---|---|---|---|
| Fogo | salamandras | Salamandra de Magma | Salamandra-Forja | Wyrm da Forja |
| Água | axolotes e sapos de caverna | Axolote Cego | Sapo das Cavernas | Leviatã do Lago Cego |
| Natureza | toupeiras e texugos | Toupeira Raiz | Texugo Couraçado | Toupeira-Titã Soterrada |
| Luz | morcegos albinos | Morceguinho Albino | Morcego Lanterna | Morcego Prismático |
| Trevas | aranhas | Aranha das Raízes | Aranha Tecelã | Rainha-Aranha do Abismo |

### 16. `a2-fire-monster.png` — Salamandra de Magma

Monstro comum · Fogo · família: salamandras · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small salamander with black skin cracked by glowing magma lines, short black horns, a tail tip dripping lava, low crawling pose.
```

### 17. `a2-water-monster.png` — Axolote Cego

Monstro comum · Água · família: axolotes e sapos de caverna · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small pale blind axolotl with frilly teal gills, milky skin, short black horns, glowing red eyes despite the blindness, dripping wet.
```

### 18. `a2-nature-monster.png` — Toupeira Raiz

Monstro comum · Natureza · família: toupeiras e texugos · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small mole with brown velvet fur, oversized digging claws wrapped in roots, short black horns, soil falling from its back.
```

### 19. `a2-light-monster.png` — Morceguinho Albino

Monstro comum · Luz · família: morcegos albinos · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small white bat with translucent wings glowing faint gold, short black horns, hanging pose turned upright, tiny fangs.
```

### 20. `a2-darkness-monster.png` — Aranha das Raízes

Monstro comum · Trevas · família: aranhas · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small black spider with violet markings, short black horns on its head, standing on a single strand of web.
```

### 21. `a2-fire-miniboss.png` — Salamandra-Forja

Miniboss · Fogo · família: salamandras · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large thick-bodied salamander covered in plates of cooled lava like an anvil, curved black horns, molten drool, its back venting small jets of fire.
```

### 22. `a2-water-miniboss.png` — Sapo das Cavernas

Miniboss · Água · família: axolotes e sapos de caverna · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large heavy cave toad with pale blue warty skin, crystal-like mineral crusts on its back, curved black horns, a throat sac glowing with purple veins.
```

### 23. `a2-nature-miniboss.png` — Texugo Couraçado

Miniboss · Natureza · família: toupeiras e texugos · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large badger with an armor of bark and root plates, a striped mossy face, curved black horns, heavy claws dug into a clump of earth.
```

### 24. `a2-light-miniboss.png` — Morcego Lanterna

Miniboss · Luz · família: morcegos albinos · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large albino bat with wings spread, a glowing amber sac on its chest like a lantern, curved black horns, ivory fur.
```

### 25. `a2-darkness-miniboss.png` — Aranha Tecelã

Miniboss · Trevas · família: aranhas · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large hairy spider with an indigo abdomen patterned with purple veins, curved black horns, front legs raised, strands of dark web hanging from it.
```

### 26. `boss-c06.png` — Rainha-Aranha do Abismo

Chefe do capítulo · Trevas · família: aranhas · capítulo 6

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal spider queen with a huge abdomen covered in glowing purple veins, a crown of black horns over many red eyes, long spiked legs, dark web and smoke around her, menacing royal pose.
```

### 27. `boss-c07.png` — Wyrm da Forja

Chefe do capítulo · Fogo · família: salamandras · capítulo 7

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal wingless salamander-dragon coiled around itself, its body made of molten metal and black rock plates, a crown of black horns like forge tongs, a glowing furnace throat, sparks and molten drops raining around it.
```

### 28. `boss-c08.png` — Leviatã do Lago Cego

Chefe do capítulo · Água · família: axolotes e sapos de caverna · capítulo 8

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal pale axolotl-leviathan rising from dark water, huge frilled gills glowing cyan like a crown together with black horns, translucent skin showing purple veins, water cascading from its body and floating droplets around it.
```

### 29. `boss-c09.png` — Toupeira-Titã Soterrada

Chefe do capítulo · Natureza · família: toupeiras e texugos · capítulo 9

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal mole titan bursting out of the earth, enormous claws of root and stone, a crown of black horns and twisted roots, rocks and soil floating around it, moss and glowing sap running through its cracks.
```

### 30. `boss-c10.png` — Morcego Prismático

Chefe do capítulo · Luz · família: morcegos albinos · capítulo 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 2 THEME: the deep roots. Underground and cave animals living among the giant glowing roots of the Great Tree, corrupted by the Underworld: pale cave skin, mineral crusts, root fragments and glowing sap stains.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal albino bat with huge wings made of prismatic crystal membranes that split light into rainbow rays, a crown of black horns, ivory fur, beams of golden light radiating around it.
```

---

## Ato 3 — Copa Celeste (capítulos 11 a 15)

| Elemento | Família | Monstro comum | Add (lacaio) | Miniboss | Chefe do capítulo |
|---|---|---|---|---|---|
| Fogo | gaviões | Gavião Brasa | Falcão Brasa | Gavião-Real Flamejante | Fênix Cinzenta, a Ave do Fim |
| Água | rãs-arborícolas | Rã-de-Copa | Rã-de-Chuva | Rã Tempestade | Rã-Trovão |
| Natureza | esquilos e macacos | Esquilo Espinho | Esquilo Voador | Macaco-Galho | Símio da Árvore Apodrecida |
| Luz | borboletas douradas | Borboleta Lúmen | Borboleta Solar | Borboleta-Rainha Áurea | A Luz Faminta, Serafim Caído da Grande Árvore |
| Trevas | corvos | Corvo Umbral | Corvo Sentinela | Corvo Ancião | Corvo do Eclipse |

### 31. `a3-fire-monster.png` — Gavião Brasa

Monstro comum · Fogo · família: gaviões · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small hawk with ember-orange feathers and black wingtips, short black horns, wings half open, sparks falling from its tail.
```

### 32. `a3-water-monster.png` — Rã-de-Copa

Monstro comum · Água · família: rãs-arborícolas · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small tree frog with bright teal skin and blue spots, short black horns, sticky toes, glossy wet highlights.
```

### 33. `a3-nature-monster.png` — Esquilo Espinho

Monstro comum · Natureza · família: esquilos e macacos · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small squirrel with a tail made of thorny leaves, mossy fur, short black horns, holding a spiky seed.
```

### 34. `a3-light-monster.png` — Borboleta Lúmen

Monstro comum · Luz · família: borboletas douradas · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small butterfly with glowing golden wings, short black horns instead of antennae, light dust falling from its wings.
```

### 35. `a3-darkness-monster.png` — Corvo Umbral

Monstro comum · Trevas · família: corvos · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small black crow with violet sheen, short black horns, cawing with its beak open.
```

### 36. `a3-fire-add.png` — Falcão Brasa

Add (lacaio) · Fogo · família: gaviões · capítulos 11 a 15, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a lean falcon with burning red feathers, longer black horns, a glowing purple rune on its chest, wings spread for a dive.
```

### 37. `a3-water-add.png` — Rã-de-Chuva

Add (lacaio) · Água · família: rãs-arborícolas · capítulos 11 a 15, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a tree frog the size of a cat, deep-blue skin, a small rain cloud dripping above its back, longer black horns, a purple rune glowing on its back.
```

### 38. `a3-nature-add.png` — Esquilo Voador

Add (lacaio) · Natureza · família: esquilos e macacos · capítulos 11 a 15, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a flying squirrel gliding with leaf-shaped skin flaps, longer black horns, a purple rune glowing on its belly.
```

### 39. `a3-light-add.png` — Borboleta Solar

Add (lacaio) · Luz · família: borboletas douradas · capítulos 11 a 15, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a large butterfly with amber wings patterned like suns, longer black horns, a glowing purple rune on its body.
```

### 40. `a3-darkness-add.png` — Corvo Sentinela

Add (lacaio) · Trevas · família: corvos · capítulos 11 a 15, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a large raven with longer black horns, feathers like dark blades, a glowing purple rune on its chest.
```

### 41. `a3-fire-miniboss.png` — Gavião-Real Flamejante

Miniboss · Fogo · família: gaviões · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large harpy eagle with a crest of flames, red and charcoal feathers, curved black horns, talons glowing red-hot.
```

### 42. `a3-water-miniboss.png` — Rã Tempestade

Miniboss · Água · família: rãs-arborícolas · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large bulky frog with dark-blue skin, a puffed glowing throat sac crackling with small lightning, curved black horns, raindrops around it.
```

### 43. `a3-nature-miniboss.png` — Macaco-Galho

Miniboss · Natureza · família: esquilos e macacos · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large monkey with bark-like fur and long branch-like arms, vines hanging from its shoulders, curved black horns, hanging by its tail from nothing, then posed upright.
```

### 44. `a3-light-miniboss.png` — Borboleta-Rainha Áurea

Miniboss · Luz · família: borboletas douradas · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a huge royal butterfly with four layered gold and ivory wings, curved black horns, a glowing halo, a body armored in amber.
```

### 45. `a3-darkness-miniboss.png` — Corvo Ancião

Miniboss · Trevas · família: corvos · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a huge old raven with ragged feathers, curved black horns, a cloak of dark smoke, a third eye glowing red on its forehead.
```

### 46. `boss-c11.png` — Corvo do Eclipse

Chefe do capítulo · Trevas · família: corvos · capítulo 11

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal raven with wings spread like an eclipse, a black sun disc halo behind its head ringed with purple light, a crown of black horns, feathers dissolving into dark smoke.
```

### 47. `boss-c12.png` — Fênix Cinzenta, a Ave do Fim

Chefe do capítulo · Fogo · família: gaviões · capítulo 12

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal phoenix of grey ash and dying embers, huge wings shedding cinders, a crown of black horns and flames, long smoky tail feathers, a burning aura of ash swirling around it.
```

### 48. `boss-c13.png` — Rã-Trovão

Chefe do capítulo · Água · família: rãs-arborícolas · capítulo 13

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal storm frog sitting tall, skin of dark storm-cloud blue streaked with lightning, a crown of black horns, a huge throat sac glowing with electricity, a swirling aura of rain and lightning.
```

### 49. `boss-c14.png` — Símio da Árvore Apodrecida

Chefe do capítulo · Natureza · família: esquilos e macacos · capítulo 14

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal ape made of rotten wood, moss and fungus, huge arms, a crown of black horns and dead branches, rotting leaves and spores falling around it.
```

### 50. `boss-c15.png` — A Luz Faminta, Serafim Caído da Grande Árvore

Chefe do capítulo · Luz · família: borboletas douradas · capítulo 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 3 THEME: the sky canopy. Animals of the treetops and the sky above the Great Tree, corrupted by the Underworld: feathers, high canopy leaves, clouds and wind.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal six-winged seraph-butterfly of blinding gold light, its wings like stained glass cracked by purple veins, a crown of black horns and rays, a hollow glowing chest where a small cracked golden bell is visible, an aura of golden light that feels hungry and wrong.
```

---

## Ato 4 — Terras Fendidas (capítulos 16 a 20)

| Elemento | Família | Monstro comum | Add (lacaio) | Miniboss | Chefe do capítulo |
|---|---|---|---|---|---|
| Fogo | raposas e ursos | Raposa Infernal | Raposa de Fenda | Urso Demônio | Behemoth Fornalha |
| Água | felinos | Gato de Fenda | Lince Abissal | Pantera de Piche | Pantera do Rio Negro |
| Natureza | cervos e javalis | Gamo Carniçal | Cervo de Osso | Javali Demônio | Javali Colosso da Fenda |
| Luz | corujas | Mocho Profano | Coruja Fendida | Coruja Demônio | Guardião dos Portões |
| Trevas | serpentes | Víbora de Fenda | Naja Infernal | Cobra Demônio | Hidra da Fenda |

### 51. `a4-fire-monster.png` — Raposa Infernal

Monstro comum · Fogo · família: raposas e ursos · capítulos 16 a 20

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a fox with charred cracked skin and patches of burning fur, bone spikes along the spine, longer black horns, a tail of fire.
```

### 52. `a4-water-monster.png` — Gato de Fenda

Monstro comum · Água · família: felinos · capítulos 16 a 20

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a wildcat with black tar-like fur dripping, bone spikes on its back, longer black horns, glowing rifts on its legs.
```

### 53. `a4-nature-monster.png` — Gamo Carniçal

Monstro comum · Natureza · família: cervos e javalis · capítulos 16 a 20

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a gaunt fawn with exposed ribs grown with thorns, rotten moss, longer black horns, glowing purple flesh in its wounds.
```

### 54. `a4-light-monster.png` — Mocho Profano

Monstro comum · Luz · família: corujas · capítulos 16 a 20

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a little owl with tarnished gold feathers, bald patches of glowing flesh, longer black horns, a cracked halo above its head.
```

### 55. `a4-darkness-monster.png` — Víbora de Fenda

Monstro comum · Trevas · família: serpentes · capítulos 16 a 20

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a viper with cracked scales glowing purple from within, bone spikes, longer black horns, venom smoking.
```

### 56. `a4-fire-add.png` — Raposa de Fenda

Add (lacaio) · Fogo · família: raposas e ursos · capítulos 16 a 20, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a larger fox split by a glowing rift down its body, chains around its neck, black horns, a purple rune burning on its flank.
```

### 57. `a4-water-add.png` — Lince Abissal

Add (lacaio) · Água · família: felinos · capítulos 16 a 20, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a lynx with fur of dark water and tar, chains on its paws, black horns, a purple rune glowing on its chest.
```

### 58. `a4-nature-add.png` — Cervo de Osso

Add (lacaio) · Natureza · família: cervos e javalis · capítulos 16 a 20, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a deer with a skull-like face, antlers of bone and black horns tangled with thorns, chains on its legs, a purple rune on its flank.
```

### 59. `a4-light-add.png` — Coruja Fendida

Add (lacaio) · Luz · família: corujas · capítulos 16 a 20, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: an owl with a glowing rift down its face, gold feathers stained black, chains on its talons, black horns, a purple rune on its chest.
```

### 60. `a4-darkness-add.png` — Naja Infernal

Add (lacaio) · Trevas · família: serpentes · capítulos 16 a 20, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a cobra with a hood of torn skin over a bone frame, chains around its body, black horns, a purple rune on its hood.
```

### 61. `a4-fire-miniboss.png` — Urso Demônio

Miniboss · Fogo · família: raposas e ursos · capítulos 16 a 20

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a huge bear half turned demon, charred skin with exposed glowing flesh, bone spikes, broken chains on its arms, big curved black horns.
```

### 62. `a4-water-miniboss.png` — Pantera de Piche

Miniboss · Água · família: felinos · capítulos 16 a 20

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large panther made of black pitch and dark water, bone plates on its shoulders, big black horns, tar dripping from its jaws.
```

### 63. `a4-nature-miniboss.png` — Javali Demônio

Miniboss · Natureza · família: cervos e javalis · capítulos 16 a 20

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a huge demon boar, bone tusks, a back of thorny bone spikes, charred bark skin, big black horns, chains dragging from its legs.
```

### 64. `a4-light-miniboss.png` — Coruja Demônio

Miniboss · Luz · família: corujas · capítulos 16 a 20

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a huge demon owl with wings of tarnished gold and bone, a broken halo, big black horns, talons of black iron.
```

### 65. `a4-darkness-miniboss.png` — Cobra Demônio

Miniboss · Trevas · família: serpentes · capítulos 16 a 20

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a huge demon snake with bone armor plates, a split jaw with double fangs, big black horns, dark smoke and dripping venom.
```

### 66. `boss-c16.png` — Hidra da Fenda

Chefe do capítulo · Trevas · família: serpentes · capítulo 16

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal three-headed demon hydra, each head crowned with black horns, scales cracked by glowing purple rifts, bone spikes along the necks, venom and dark smoke swirling around it.
```

### 67. `boss-c17.png` — Behemoth Fornalha

Chefe do capítulo · Fogo · família: raposas e ursos · capítulo 17

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal demon-bear behemoth, its body a cracked volcano with lava pouring from its rifts, bone armor, a crown of massive black horns, chains of molten iron, a firestorm aura.
```

### 68. `boss-c18.png` — Pantera do Rio Negro

Chefe do capítulo · Água · família: felinos · capítulo 18

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal demon panther made of a black river, waves of dark water and pitch flowing from its mane, bone armor, a crown of black horns, a whirlpool aura around its paws.
```

### 69. `boss-c19.png` — Javali Colosso da Fenda

Chefe do capítulo · Natureza · família: cervos e javalis · capítulo 19

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal demon boar with a rift splitting its back from which thorny dead trees grow, bone tusks like scythes, a crown of black horns, an aura of rotten leaves and purple spores.
```

### 70. `boss-c20.png` — Guardião dos Portões

Chefe do capítulo · Luz · família: corujas · capítulo 20

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 4 THEME: the rift lands. The same woodland animals of act 1, now half fused with demons: cracked charred skin, exposed glowing purple flesh, bone spikes, chains and burning rifts across the body. Much more monstrous than act 1.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal demon owl guardian standing like a sentinel, wings folded like a gate of gold and black iron, a giant key hanging from chains around its neck, a crown of black horns and a cracked golden halo, cold golden light radiating from it.
```

---

## Ato 5 — O Submundo (capítulos 21 a 25)

| Elemento | Família | Monstro comum | Add (lacaio) | Miniboss | Chefe do capítulo |
|---|---|---|---|---|---|
| Fogo | diabretes de brasa | Diabrete de Brasa | Diabrete Lanceiro | Demônio de Brasa | Senhor das Cinzas |
| Água | enguias de cinza | Enguia de Cinza | Enguia de Piche | Moreia do Rio de Cinza | Serpente-Rio, a Que Bebe a Seiva |
| Natureza | árvores de osso | Broto de Osso | Galho Ossudo | Ent de Osso | Árvore Invertida |
| Luz | anjos falsos | Querubim Falso | Anjo de Latão | Anjo Dourado Falso | Arauto da Falsa Aurora |
| Trevas | sombras vivas | Sombra Rastejante | Sombra Gêmea | Sombra Devoradora | Eco Sem Rosto |

### 71. `a5-fire-monster.png` — Diabrete de Brasa

Monstro comum · Fogo · família: diabretes de brasa · capítulos 21 a 25

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small imp of black coal skin with glowing magma cracks, short black horns, a pointed tail, a mischievous grin.
```

### 72. `a5-water-monster.png` — Enguia de Cinza

Monstro comum · Água · família: enguias de cinza · capítulos 21 a 25

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small eel of grey ash-water, short black horns, glowing purple stripes, swimming upright in the air.
```

### 73. `a5-nature-monster.png` — Broto de Osso

Monstro comum · Natureza · família: árvores de osso · capítulos 21 a 25

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small walking sapling of white bone with twig-like bone fingers, short black horns, a few black leaves.
```

### 74. `a5-light-monster.png` — Querubim Falso

Monstro comum · Luz · família: anjos falsos · capítulos 21 a 25

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small cherub-like demon with gilded skin, tiny golden wings, short black horns, a mask-like smiling face.
```

### 75. `a5-darkness-monster.png` — Sombra Rastejante

Monstro comum · Trevas · família: sombras vivas · capítulos 21 a 25

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small creature of living shadow crawling on four limbs, short black horns, red eyes in a faceless head.
```

### 76. `a5-fire-add.png` — Diabrete Lanceiro

Add (lacaio) · Fogo · família: diabretes de brasa · capítulos 21 a 25, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: an imp soldier with a burning trident, a coal-black body, longer black horns, a purple rune glowing on its chest.
```

### 77. `a5-water-add.png` — Enguia de Piche

Add (lacaio) · Água · família: enguias de cinza · capítulos 21 a 25, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a long black pitch eel crackling with purple electricity, longer black horns, a purple rune on its head.
```

### 78. `a5-nature-add.png` — Galho Ossudo

Add (lacaio) · Natureza · família: árvores de osso · capítulos 21 a 25, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a walking bone tree the size of a person, branches like rib cages, longer black horns, a purple rune carved on its trunk.
```

### 79. `a5-light-add.png` — Anjo de Latão

Add (lacaio) · Luz · família: anjos falsos · capítulos 21 a 25, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a brass-plated angel demon with stiff metal wings, a spear of light, longer black horns, a purple rune on its breastplate.
```

### 80. `a5-darkness-add.png` — Sombra Gêmea

Add (lacaio) · Trevas · família: sombras vivas · capítulos 21 a 25, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a tall living shadow with two overlapping silhouettes, longer black horns, a purple rune glowing in its chest.
```

### 81. `a5-fire-miniboss.png` — Demônio de Brasa

Miniboss · Fogo · família: diabretes de brasa · capítulos 21 a 25

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large demon of molten rock with burning wings folded, big black horns, a whip of fire coiled in its hand.
```

### 82. `a5-water-miniboss.png` — Moreia do Rio de Cinza

Miniboss · Água · família: enguias de cinza · capítulos 21 a 25

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a huge moray eel of dark ash water, a gaping jaw with rows of fangs, big black horns, bone plates along its back.
```

### 83. `a5-nature-miniboss.png` — Ent de Osso

Miniboss · Natureza · família: árvores de osso · capítulos 21 a 25

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a huge treant of bone and black wood, roots like skeletal feet, big black horns, pale fungi glowing on its bark.
```

### 84. `a5-light-miniboss.png` — Anjo Dourado Falso

Miniboss · Luz · família: anjos falsos · capítulos 21 a 25

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a tall false angel with six golden wings, a porcelain mask, big black horns behind a fake halo, a sword of light.
```

### 85. `a5-darkness-miniboss.png` — Sombra Devoradora

Miniboss · Trevas · família: sombras vivas · capítulos 21 a 25

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a huge shadow beast with a gaping glowing mouth across its whole chest, big black horns, smoke tendrils for arms.
```

### 86. `boss-c21.png` — Eco Sem Rosto

Chefe do capítulo · Trevas · família: sombras vivas · capítulo 21

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal faceless shadow giant whose body is made of whispering silhouettes, a crown of black horns, dozens of red eyes, dark smoke and purple light swirling around it.
```

### 87. `boss-c22.png` — Senhor das Cinzas

Chefe do capítulo · Fogo · família: diabretes de brasa · capítulo 22

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal ash demon lord with a body of grey ash and glowing embers, burning wings spread, a crown of black horns, a scepter of fire, an aura of falling cinders.
```

### 88. `boss-c23.png` — Serpente-Rio, a Que Bebe a Seiva

Chefe do capítulo · Água · família: enguias de cinza · capítulo 23

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal river serpent made of flowing black water, streams of stolen golden sap running inside its translucent body, a crown of black horns, waves and droplets swirling around it.
```

### 89. `boss-c24.png` — Árvore Invertida

Chefe do capítulo · Natureza · família: árvores de osso · capítulo 24

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal black inverted tree demon with its roots up like a crown and branches down like legs, bone bark, a crown of black horns among the roots, golden sap dripping upward, an aura of black leaves.
```

### 90. `boss-c25.png` — Arauto da Falsa Aurora

Chefe do capítulo · Luz · família: anjos falsos · capítulo 25

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 5 THEME: the Underworld itself. Native demons of a world of ash rivers, bone forests and stolen golden sap flowing downward. Not animals: demonic creatures with an ancient, otherworldly look.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal false angel herald blowing a golden horn, huge radiant wings, a cracked porcelain mask over a dark face, a crown of black horns hidden behind a blazing sunrise halo, beams of golden light.
```

---

## Ato 6 — Trono Sob as Raízes (capítulos 26 a 30)

| Elemento | Família | Monstro comum | Add (lacaio) | Miniboss | Chefe do capítulo |
|---|---|---|---|---|---|
| Fogo | cães infernais | Cão Infernal | Cão de Guarda Rubro | Mastim do Trono | Cérbero da Forja Rubra |
| Água | krakens | Polvo Negro | Lula do Fosso | Kraken Jovem | Kraken do Fosso do Trono |
| Natureza | gólens de raiz | Pedrisco de Raiz | Gólem de Raiz | Gólem Colosso | Titã das Raízes Mortas |
| Luz | arautos dourados | Lacaio Dourado | Arauto Dourado | Paladino da Falsa Luz | Morvath, o Rei Sob as Raízes |
| Trevas | cavaleiros ocos | Escudeiro Oco | Cavaleiro Oco | Comandante Oco | General Oco, a Mão de Morvath |

### 91. `a6-fire-monster.png` — Cão Infernal

Monstro comum · Fogo · família: cães infernais · capítulos 26 a 30

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small hellhound with black coal skin, a mane of flames, short black horns, a black and gold collar.
```

### 92. `a6-water-monster.png` — Polvo Negro

Monstro comum · Água · família: krakens · capítulos 26 a 30

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small black octopus with gold rings on its tentacles, short black horns, glowing purple suckers.
```

### 93. `a6-nature-monster.png` — Pedrisco de Raiz

Monstro comum · Natureza · família: gólens de raiz · capítulos 26 a 30

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small golem of stone and black roots, short black horns, a glowing purple core in its chest.
```

### 94. `a6-light-monster.png` — Lacaio Dourado

Monstro comum · Luz · família: arautos dourados · capítulos 26 a 30

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small gilded imp in a tiny golden robe, short black horns, holding a lantern of false light.
```

### 95. `a6-darkness-monster.png` — Escudeiro Oco

Monstro comum · Trevas · família: cavaleiros ocos · capítulos 26 a 30

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: common weak enemy, the youngest and smallest of its family. Small and compact, simple shape, short horns. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small hollow suit of black armor with nothing inside but purple smoke, short black horns on its helm, a dented shield.
```

### 96. `a6-fire-add.png` — Cão de Guarda Rubro

Add (lacaio) · Fogo · família: cães infernais · capítulos 26 a 30, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a hellhound in black and gold armor plates, burning jaws, longer black horns, a purple rune on its collar.
```

### 97. `a6-water-add.png` — Lula do Fosso

Add (lacaio) · Água · família: krakens · capítulos 26 a 30, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a squid in black and gold armor plates, longer black horns, a purple rune on its mantle, ink trailing.
```

### 98. `a6-nature-add.png` — Gólem de Raiz

Add (lacaio) · Natureza · família: gólens de raiz · capítulos 26 a 30, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a medium golem of black roots bound in gold chains, longer black horns, a purple rune carved on its stone chest.
```

### 99. `a6-light-add.png` — Arauto Dourado

Add (lacaio) · Luz · família: arautos dourados · capítulos 26 a 30, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a gilded demon herald in a gold and black robe, longer black horns, a purple rune on its chest, a staff of light.
```

### 100. `a6-darkness-add.png` — Cavaleiro Oco

Add (lacaio) · Trevas · família: cavaleiros ocos · capítulos 26 a 30, só nos minibosses com adds

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: add, an escort minion that protects the miniboss of the same family. Medium size, between the common enemy and the miniboss, the same kind of creature with longer horns and a glowing purple rune or chain on its body that binds it to its master. FRAMING (critical): the creature fills about 60% of the canvas height, centered, at least 12% empty magenta margin on every side.

CREATURE: a hollow knight in black and gold armor, purple smoke leaking from its joints, longer black horns, a purple rune on its breastplate.
```

### 101. `a6-fire-miniboss.png` — Mastim do Trono

Miniboss · Fogo · família: cães infernais · capítulos 26 a 30

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a huge armored hellhound mastiff, gold-trimmed black barding, big black horns, molten drool, chains of gold.
```

### 102. `a6-water-miniboss.png` — Kraken Jovem

Miniboss · Água · família: krakens · capítulos 26 a 30

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large kraken with gold-capped tentacles, a helm of black armor, big black horns, dark water dripping.
```

### 103. `a6-nature-miniboss.png` — Gólem Colosso

Miniboss · Natureza · família: gólens de raiz · capítulos 26 a 30

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a huge golem of stone, black roots and gold armor plates, big black horns, fists like boulders.
```

### 104. `a6-light-miniboss.png` — Paladino da Falsa Luz

Miniboss · Luz · família: arautos dourados · capítulos 26 a 30

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a tall demon paladin in ornate gold armor, a shield shaped like a sun, big black horns, a sword of golden light.
```

### 105. `a6-darkness-miniboss.png` — Comandante Oco

Miniboss · Trevas · família: cavaleiros ocos · capítulos 26 a 30

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: miniboss, the grown alpha of its family. Large, heavy and armored, clearly stronger than the common enemy of the same family, bigger horns and one standout feature. FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a huge hollow commander in spiked black armor, a tattered cape, big black horns on its helm, a greatsword of darkness.
```

### 106. `boss-c26.png` — General Oco, a Mão de Morvath

Chefe do capítulo · Trevas · família: cavaleiros ocos · capítulo 26

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, purple venom (the eyes stay red).

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal hollow general in ornate black and gold armor, a crown of black horns on its helm, a halberd of shadow, a royal cape, purple smoke and dark aura pouring from the armor.
```

### 107. `boss-c27.png` — Cérbero da Forja Rubra

Chefe do capítulo · Fogo · família: cães infernais · capítulo 27

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal three-headed hellhound in royal black and gold armor, each head crowned with black horns and breathing fire, a mane of flames, an inferno aura.
```

### 108. `boss-c28.png` — Kraken do Fosso do Trono

Chefe do capítulo · Água · família: krakens · capítulo 28

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal kraken wearing a royal black and gold crown with black horns, huge tentacles curling around it, dark water and whirlpools swirling, glowing purple veins.
```

### 109. `boss-c29.png` — Titã das Raízes Mortas

Chefe do capítulo · Natureza · família: gólens de raiz · capítulo 29

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal titan made of the dead roots of the Great Tree and black stone, royal gold armor, a crown of black horns and roots, dead leaves and dust swirling around it.
```

### 110. `boss-c30.png` — Morvath, o Rei Sob as Raízes

Chefe do capítulo · Luz · família: arautos dourados · capítulo 30

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or body on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

UNDERWORLD MARK (same on every creature of the game): glowing RED eyes, curved BLACK horns, and glowing purple veins pulsing under the fur, feathers, scales or skin. The higher the rank, the bigger the horns and the more veins.

ACT 6 THEME: the Throne Beneath the Roots. The elite guard of Morvath, the demon king: the strongest Underworld creatures wearing black and gold armor, royal regalia, chains and sigils. The most ornate enemies of the game.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: chapter boss, the legendary top form of its family. Huge, imposing and ornate, unique silhouette, a crown of black horns, a strong elemental aura and particles fully inside the frame, a superior and dominant pose. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: the colossal demon king Morvath, tall and regal, a body of black roots and shadow hidden under a cloak of false golden light that imitates the Great Tree, a crown of enormous black horns woven with golden leaves, a calm smiling face, long elegant hands, a golden aura that turns into dark roots at its edges.
```

---

## Checklist de assets

| # | Ato | Tipo | Elemento | Monstro | Arquivo | Gerado |
|---|---|---|---|---|---|---|
| 1 | 1 | Monstro comum | Fogo | Raposa Brasa | `a1-fire-monster.png` | [ ] |
| 2 | 1 | Monstro comum | Água | Gato-do-Brejo | `a1-water-monster.png` | [ ] |
| 3 | 1 | Monstro comum | Natureza | Gamo de Musgo | `a1-nature-monster.png` | [ ] |
| 4 | 1 | Monstro comum | Luz | Mocho Lúmen | `a1-light-monster.png` | [ ] |
| 5 | 1 | Monstro comum | Trevas | Víbora Umbral | `a1-darkness-monster.png` | [ ] |
| 6 | 1 | Miniboss | Fogo | Urso Brasa | `a1-fire-miniboss.png` | [ ] |
| 7 | 1 | Miniboss | Água | Lince do Brejo | `a1-water-miniboss.png` | [ ] |
| 8 | 1 | Miniboss | Natureza | Javali Espinheiro | `a1-nature-miniboss.png` | [ ] |
| 9 | 1 | Miniboss | Luz | Coruja Solar | `a1-light-miniboss.png` | [ ] |
| 10 | 1 | Miniboss | Trevas | Cobra-Real Umbral | `a1-darkness-miniboss.png` | [ ] |
| 11 | 1 | Chefe do capítulo | Trevas | Serpente Umbral, a Devoradora da Clareira | `boss-c01.png` | [ ] |
| 12 | 1 | Chefe do capítulo | Fogo | Urso Fornalha | `boss-c02.png` | [ ] |
| 13 | 1 | Chefe do capítulo | Água | Pantera do Brejo | `boss-c03.png` | [ ] |
| 14 | 1 | Chefe do capítulo | Natureza | Rei-Javali Espinheiro | `boss-c04.png` | [ ] |
| 15 | 1 | Chefe do capítulo | Luz | Coruja Áurea, Guardiã da Seiva | `boss-c05.png` | [ ] |
| 16 | 2 | Monstro comum | Fogo | Salamandra de Magma | `a2-fire-monster.png` | [ ] |
| 17 | 2 | Monstro comum | Água | Axolote Cego | `a2-water-monster.png` | [ ] |
| 18 | 2 | Monstro comum | Natureza | Toupeira Raiz | `a2-nature-monster.png` | [ ] |
| 19 | 2 | Monstro comum | Luz | Morceguinho Albino | `a2-light-monster.png` | [ ] |
| 20 | 2 | Monstro comum | Trevas | Aranha das Raízes | `a2-darkness-monster.png` | [ ] |
| 21 | 2 | Miniboss | Fogo | Salamandra-Forja | `a2-fire-miniboss.png` | [ ] |
| 22 | 2 | Miniboss | Água | Sapo das Cavernas | `a2-water-miniboss.png` | [ ] |
| 23 | 2 | Miniboss | Natureza | Texugo Couraçado | `a2-nature-miniboss.png` | [ ] |
| 24 | 2 | Miniboss | Luz | Morcego Lanterna | `a2-light-miniboss.png` | [ ] |
| 25 | 2 | Miniboss | Trevas | Aranha Tecelã | `a2-darkness-miniboss.png` | [ ] |
| 26 | 2 | Chefe do capítulo | Trevas | Rainha-Aranha do Abismo | `boss-c06.png` | [ ] |
| 27 | 2 | Chefe do capítulo | Fogo | Wyrm da Forja | `boss-c07.png` | [ ] |
| 28 | 2 | Chefe do capítulo | Água | Leviatã do Lago Cego | `boss-c08.png` | [ ] |
| 29 | 2 | Chefe do capítulo | Natureza | Toupeira-Titã Soterrada | `boss-c09.png` | [ ] |
| 30 | 2 | Chefe do capítulo | Luz | Morcego Prismático | `boss-c10.png` | [ ] |
| 31 | 3 | Monstro comum | Fogo | Gavião Brasa | `a3-fire-monster.png` | [ ] |
| 32 | 3 | Monstro comum | Água | Rã-de-Copa | `a3-water-monster.png` | [ ] |
| 33 | 3 | Monstro comum | Natureza | Esquilo Espinho | `a3-nature-monster.png` | [ ] |
| 34 | 3 | Monstro comum | Luz | Borboleta Lúmen | `a3-light-monster.png` | [ ] |
| 35 | 3 | Monstro comum | Trevas | Corvo Umbral | `a3-darkness-monster.png` | [ ] |
| 36 | 3 | Add (lacaio) | Fogo | Falcão Brasa | `a3-fire-add.png` | [ ] |
| 37 | 3 | Add (lacaio) | Água | Rã-de-Chuva | `a3-water-add.png` | [ ] |
| 38 | 3 | Add (lacaio) | Natureza | Esquilo Voador | `a3-nature-add.png` | [ ] |
| 39 | 3 | Add (lacaio) | Luz | Borboleta Solar | `a3-light-add.png` | [ ] |
| 40 | 3 | Add (lacaio) | Trevas | Corvo Sentinela | `a3-darkness-add.png` | [ ] |
| 41 | 3 | Miniboss | Fogo | Gavião-Real Flamejante | `a3-fire-miniboss.png` | [ ] |
| 42 | 3 | Miniboss | Água | Rã Tempestade | `a3-water-miniboss.png` | [ ] |
| 43 | 3 | Miniboss | Natureza | Macaco-Galho | `a3-nature-miniboss.png` | [ ] |
| 44 | 3 | Miniboss | Luz | Borboleta-Rainha Áurea | `a3-light-miniboss.png` | [ ] |
| 45 | 3 | Miniboss | Trevas | Corvo Ancião | `a3-darkness-miniboss.png` | [ ] |
| 46 | 3 | Chefe do capítulo | Trevas | Corvo do Eclipse | `boss-c11.png` | [ ] |
| 47 | 3 | Chefe do capítulo | Fogo | Fênix Cinzenta, a Ave do Fim | `boss-c12.png` | [ ] |
| 48 | 3 | Chefe do capítulo | Água | Rã-Trovão | `boss-c13.png` | [ ] |
| 49 | 3 | Chefe do capítulo | Natureza | Símio da Árvore Apodrecida | `boss-c14.png` | [ ] |
| 50 | 3 | Chefe do capítulo | Luz | A Luz Faminta, Serafim Caído da Grande Árvore | `boss-c15.png` | [ ] |
| 51 | 4 | Monstro comum | Fogo | Raposa Infernal | `a4-fire-monster.png` | [ ] |
| 52 | 4 | Monstro comum | Água | Gato de Fenda | `a4-water-monster.png` | [ ] |
| 53 | 4 | Monstro comum | Natureza | Gamo Carniçal | `a4-nature-monster.png` | [ ] |
| 54 | 4 | Monstro comum | Luz | Mocho Profano | `a4-light-monster.png` | [ ] |
| 55 | 4 | Monstro comum | Trevas | Víbora de Fenda | `a4-darkness-monster.png` | [ ] |
| 56 | 4 | Add (lacaio) | Fogo | Raposa de Fenda | `a4-fire-add.png` | [ ] |
| 57 | 4 | Add (lacaio) | Água | Lince Abissal | `a4-water-add.png` | [ ] |
| 58 | 4 | Add (lacaio) | Natureza | Cervo de Osso | `a4-nature-add.png` | [ ] |
| 59 | 4 | Add (lacaio) | Luz | Coruja Fendida | `a4-light-add.png` | [ ] |
| 60 | 4 | Add (lacaio) | Trevas | Naja Infernal | `a4-darkness-add.png` | [ ] |
| 61 | 4 | Miniboss | Fogo | Urso Demônio | `a4-fire-miniboss.png` | [ ] |
| 62 | 4 | Miniboss | Água | Pantera de Piche | `a4-water-miniboss.png` | [ ] |
| 63 | 4 | Miniboss | Natureza | Javali Demônio | `a4-nature-miniboss.png` | [ ] |
| 64 | 4 | Miniboss | Luz | Coruja Demônio | `a4-light-miniboss.png` | [ ] |
| 65 | 4 | Miniboss | Trevas | Cobra Demônio | `a4-darkness-miniboss.png` | [ ] |
| 66 | 4 | Chefe do capítulo | Trevas | Hidra da Fenda | `boss-c16.png` | [ ] |
| 67 | 4 | Chefe do capítulo | Fogo | Behemoth Fornalha | `boss-c17.png` | [ ] |
| 68 | 4 | Chefe do capítulo | Água | Pantera do Rio Negro | `boss-c18.png` | [ ] |
| 69 | 4 | Chefe do capítulo | Natureza | Javali Colosso da Fenda | `boss-c19.png` | [ ] |
| 70 | 4 | Chefe do capítulo | Luz | Guardião dos Portões | `boss-c20.png` | [ ] |
| 71 | 5 | Monstro comum | Fogo | Diabrete de Brasa | `a5-fire-monster.png` | [ ] |
| 72 | 5 | Monstro comum | Água | Enguia de Cinza | `a5-water-monster.png` | [ ] |
| 73 | 5 | Monstro comum | Natureza | Broto de Osso | `a5-nature-monster.png` | [ ] |
| 74 | 5 | Monstro comum | Luz | Querubim Falso | `a5-light-monster.png` | [ ] |
| 75 | 5 | Monstro comum | Trevas | Sombra Rastejante | `a5-darkness-monster.png` | [ ] |
| 76 | 5 | Add (lacaio) | Fogo | Diabrete Lanceiro | `a5-fire-add.png` | [ ] |
| 77 | 5 | Add (lacaio) | Água | Enguia de Piche | `a5-water-add.png` | [ ] |
| 78 | 5 | Add (lacaio) | Natureza | Galho Ossudo | `a5-nature-add.png` | [ ] |
| 79 | 5 | Add (lacaio) | Luz | Anjo de Latão | `a5-light-add.png` | [ ] |
| 80 | 5 | Add (lacaio) | Trevas | Sombra Gêmea | `a5-darkness-add.png` | [ ] |
| 81 | 5 | Miniboss | Fogo | Demônio de Brasa | `a5-fire-miniboss.png` | [ ] |
| 82 | 5 | Miniboss | Água | Moreia do Rio de Cinza | `a5-water-miniboss.png` | [ ] |
| 83 | 5 | Miniboss | Natureza | Ent de Osso | `a5-nature-miniboss.png` | [ ] |
| 84 | 5 | Miniboss | Luz | Anjo Dourado Falso | `a5-light-miniboss.png` | [ ] |
| 85 | 5 | Miniboss | Trevas | Sombra Devoradora | `a5-darkness-miniboss.png` | [ ] |
| 86 | 5 | Chefe do capítulo | Trevas | Eco Sem Rosto | `boss-c21.png` | [ ] |
| 87 | 5 | Chefe do capítulo | Fogo | Senhor das Cinzas | `boss-c22.png` | [ ] |
| 88 | 5 | Chefe do capítulo | Água | Serpente-Rio, a Que Bebe a Seiva | `boss-c23.png` | [ ] |
| 89 | 5 | Chefe do capítulo | Natureza | Árvore Invertida | `boss-c24.png` | [ ] |
| 90 | 5 | Chefe do capítulo | Luz | Arauto da Falsa Aurora | `boss-c25.png` | [ ] |
| 91 | 6 | Monstro comum | Fogo | Cão Infernal | `a6-fire-monster.png` | [ ] |
| 92 | 6 | Monstro comum | Água | Polvo Negro | `a6-water-monster.png` | [ ] |
| 93 | 6 | Monstro comum | Natureza | Pedrisco de Raiz | `a6-nature-monster.png` | [ ] |
| 94 | 6 | Monstro comum | Luz | Lacaio Dourado | `a6-light-monster.png` | [ ] |
| 95 | 6 | Monstro comum | Trevas | Escudeiro Oco | `a6-darkness-monster.png` | [ ] |
| 96 | 6 | Add (lacaio) | Fogo | Cão de Guarda Rubro | `a6-fire-add.png` | [ ] |
| 97 | 6 | Add (lacaio) | Água | Lula do Fosso | `a6-water-add.png` | [ ] |
| 98 | 6 | Add (lacaio) | Natureza | Gólem de Raiz | `a6-nature-add.png` | [ ] |
| 99 | 6 | Add (lacaio) | Luz | Arauto Dourado | `a6-light-add.png` | [ ] |
| 100 | 6 | Add (lacaio) | Trevas | Cavaleiro Oco | `a6-darkness-add.png` | [ ] |
| 101 | 6 | Miniboss | Fogo | Mastim do Trono | `a6-fire-miniboss.png` | [ ] |
| 102 | 6 | Miniboss | Água | Kraken Jovem | `a6-water-miniboss.png` | [ ] |
| 103 | 6 | Miniboss | Natureza | Gólem Colosso | `a6-nature-miniboss.png` | [ ] |
| 104 | 6 | Miniboss | Luz | Paladino da Falsa Luz | `a6-light-miniboss.png` | [ ] |
| 105 | 6 | Miniboss | Trevas | Comandante Oco | `a6-darkness-miniboss.png` | [ ] |
| 106 | 6 | Chefe do capítulo | Trevas | General Oco, a Mão de Morvath | `boss-c26.png` | [ ] |
| 107 | 6 | Chefe do capítulo | Fogo | Cérbero da Forja Rubra | `boss-c27.png` | [ ] |
| 108 | 6 | Chefe do capítulo | Água | Kraken do Fosso do Trono | `boss-c28.png` | [ ] |
| 109 | 6 | Chefe do capítulo | Natureza | Titã das Raízes Mortas | `boss-c29.png` | [ ] |
| 110 | 6 | Chefe do capítulo | Luz | Morvath, o Rei Sob as Raízes | `boss-c30.png` | [ ] |

## Dicas de consistência

- Aprove primeiro **uma família inteira do ato 1** (ex.: Trevas: Víbora → Cobra-Real → Serpente) e use-a como referência de traço para o resto.
- Mantenha a escala entre os níveis: comum pequeno (55% da tela), add médio (60%), miniboss grande (70%), chefe enorme (82%).
- O elemento precisa ser lido pela cor de longe (laranja, azul, verde, dourado, violeta); se a paleta fugir, repita a linha `ELEMENT`.
- A marca do Submundo é a mesma em tudo: os olhos são sempre vermelhos, inclusive nos inimigos de Trevas e de Luz.
- Evite rosa e magenta no monstro: o chroma key apagaria essas partes.
- Para animar depois (respirar, tomar dano, morrer), a mesma imagem base serve: o jogo pode mover e tingir o sprite sem novos quadros.
