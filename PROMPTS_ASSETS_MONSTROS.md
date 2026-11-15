# Infinity Grove — Prompts de Assets dos Monstros (Gemini)

Prompts para gerar a arte dos inimigos da campanha de 15 capítulos. Hoje o jogo desenha o monstro como um retângulo (`game/src/adapters/phaser/ClickerGame.js`, `MONSTER`); não existe nenhuma arte de inimigo.

## Quais monstros são necessários e por quê

- A campanha tem **15 capítulos**, divididos aqui em **3 atos de 5 capítulos**; cada ato tem um bioma e um elenco próprio, para o jogador ver monstros novos a cada 5 capítulos.
- Cada capítulo tem 10 estágios, e o **elemento muda por estágio** (não por capítulo): em qualquer capítulo aparecem os 5 elementos. Por isso cada ato precisa de **um monstro comum e um miniboss por elemento**.
- O **chefe do capítulo** tem um elemento fixo por capítulo, e em 5 capítulos seguidos passam os 5 elementos: Trevas, Fogo, Água, Natureza, Luz (capítulos 1 a 5, e a ordem se repete em 6 a 10 e 11 a 15). Por isso cada capítulo tem **um chefe único**.
- Total: 3 atos × (5 comuns + 5 minibosses + 5 chefes) = **45 imagens**.

| Ato | Capítulos | Bioma | Comuns | Minibosses | Chefes |
|---|---|---|---|---|---|
| 1 | 1 a 5 | Bosque Desperto | 5 | 5 | 5 |
| 2 | 6 a 10 | Raízes Profundas | 5 | 5 | 5 |
| 3 | 11 a 15 | Copa Celeste | 5 | 5 | 5 |

> **Prioridade:** gere primeiro o Ato 1 (15 imagens). O mínimo para o jogo deixar de mostrar um retângulo são os 5 monstros comuns do Ato 1. Os Atos 2 e 3 só aparecem depois do capítulo 5.

## Como usar

1. Cada bloco é **autocontido**: copie o bloco inteiro e cole no Gemini. Não precisa colar estilo à parte.
2. Gere todos os monstros de um ato **na mesma conversa**, para manter o traço. A partir do segundo, anexe uma imagem já aprovada do mesmo ato e acrescente: *"Match the art style of the attached image exactly; different creature."*
3. Todos pedem **fundo magenta chapado (#FF00FF)**. Remova com chroma key (Photoshop, GIMP, Photopea) e exporte PNG com transparência.
4. Os monstros olham para a **ESQUERDA** (os heróis ficam à esquerda da tela e olham para a direita). Se vier virado, peça: *"Mirror the creature so it faces LEFT."*
5. Exporte em 1024×1024 e salve com o nome do título em `game/public/assets/monsters/`. No jogo a área do monstro tem 220×250 px; chefes podem passar disso.
6. Se vier com cenário, chão, sombra ou texto, repita com: *"No text, no frame, no ground, no shadow, no scenery, flat solid magenta #FF00FF background."*

Nomes de arquivo: `a<ato>-<elemento>-monster.png`, `a<ato>-<elemento>-miniboss.png` e `boss-c<capítulo>.png`.

> Ligar essas imagens no jogo (carregar no `Preloader`, escolher pelo ato, elemento e tipo do encontro) é uma feature à parte: a spec `campaign-chapters` deixa arte de inimigo fora do escopo.

---

## Ato 1 — Bosque Desperto (capítulos 1 a 5)

### 1. `a1-fire-monster.png` — Brasinha

Monstro comum · Fogo · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small imp made of smoldering bark and glowing coals, twig arms, a leaf-shaped flame on its head, round angry eyes, tiny pointed teeth.
```

### 2. `a1-water-monster.png` — Gota-do-Brejo

Monstro comum · Água · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a plump blob of clear pond water with a lily pad on its head like a hat, a short tadpole tail, two big eyes and a wide grumpy mouth, a tiny fish swimming inside its body.
```

### 3. `a1-nature-monster.png` — Cogumelo Mordaz

Monstro comum · Natureza · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a walking mushroom with a red-brown spotted cap pulled low over angry eyes, stubby root legs, a wide mouth of thorn teeth under the cap, two small leaf arms.
```

### 4. `a1-light-monster.png` — Vaga-lume Errante

Monstro comum · Luz · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: an oversized firefly with a round glowing lantern abdomen, four translucent golden wings, long curled antennae and small hooked legs, hovering just above the ground line.
```

### 5. `a1-darkness-monster.png` — Mariposa-Sombra

Monstro comum · Trevas · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, two bright cold eyes (violet or pale cyan).

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a fluffy shadow moth-bat the size of a cat, ragged dark wings with eye-shaped violet markings, big ears, tiny fangs, hovering just above the ground line.
```

### 6. `a1-fire-miniboss.png` — Javali Brasa

Miniboss · Fogo · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a massive wild boar with charred bark plates on its back, two long tusks of glowing molten amber, a mane of flames along the spine and smoking nostrils, head lowered ready to charge.
```

### 7. `a1-water-miniboss.png` — Sapo Pantaneiro

Miniboss · Água · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a giant armored marsh toad with a swollen glowing water sac under its chin, a shell of river stones and reeds on its back, heavy webbed fists, half-closed lazy dangerous eyes.
```

### 8. `a1-nature-miniboss.png` — Toco Espinhento

Miniboss · Natureza · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a hulking golem made of an old tree stump, a crown of broken branches, long arms wrapped in thorny brambles ending in root claws, a hollow knot face with green glowing eyes.
```

### 9. `a1-light-miniboss.png` — Cervo Solar

Miniboss · Luz · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a tall proud stag with a white-gold coat and huge branching antlers that glow like sunlight through amber, sap dripping gold from the antlers, hostile lowered head, one hoof raised.
```

### 10. `a1-darkness-miniboss.png` — Tecelã da Noite

Miniboss · Trevas · capítulos 1 a 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, two bright cold eyes (violet or pale cyan).

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a large shadow spider with a glossy black-violet body, eight thin armored legs, a pale skull-like marking on the abdomen, strands of dark silk hanging from its fangs.
```

### 11. `boss-c01.png` — Lobo Umbral, o Devorador da Clareira

Chefe do capítulo · Trevas · capítulo 1

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, two bright cold eyes (violet or pale cyan).

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal alpha wolf made of living shadow and black fur, a crest of twisted dark antler-branches on its back, smoke pouring from its jaws, long fangs, pale cyan eyes, a dark mist aura around its paws.
```

### 12. `boss-c02.png` — Urso Fornalha

Chefe do capítulo · Fogo · capítulo 2

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a giant bear standing on its hind legs, its chest an open furnace of burning roots glowing between rib-like bark plates, molten claws, a crown of flames between the ears, embers rising around it.
```

### 13. `boss-c03.png` — Hidra do Brejo

Chefe do capítulo · Água · capítulo 3

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a three-headed marsh serpent rising from a coiled body, each head with fin crests and reed whiskers, scales in teal and deep blue covered with moss and lily pads, water streaming from its jaws.
```

### 14. `boss-c04.png` — Mãe-Espinheira

Chefe do capítulo · Natureza · capítulo 4

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal carnivorous plant queen: a huge fanged flower-bud head with a crown of red petals, a thick thorned stalk body, four vine arms ending in smaller snapping buds, roots as feet.
```

### 15. `boss-c05.png` — Coruja Áurea, Guardiã da Seiva

Chefe do capítulo · Luz · capítulo 5

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 1 THEME: the awakened forest floor. Living animals, plants and little spirits of a sunlit ancient forest, twisted by spoiled sap: bark, moss, fur, mushrooms.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a majestic giant owl with feathers of gold and ivory, wings half open, a halo-ring of hardened amber floating behind its head, glowing sap running through its feathers like veins, stern blinding eyes.
```

---

## Ato 2 — Raízes Profundas (capítulos 6 a 10)

### 16. `a2-fire-monster.png` — Salamandra de Magma

Monstro comum · Fogo · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small stocky salamander with black basalt skin split by glowing lava cracks, a flame on the tip of its tail, a wide grin, short bowed legs.
```

### 17. `a2-water-monster.png` — Caranguejo de Gruta

Monstro comum · Água · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a cave crab with a shell of blue-white crystal, one oversized claw dripping water, two glowing eyes on stalks, barnacles and wet stone on its legs.
```

### 18. `a2-nature-monster.png` — Larva-Raiz

Monstro comum · Natureza · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a fat segmented grub with a bark-armored back, small root-like legs, a round mouth with a ring of thorn teeth, glowing green fungus spots along its sides.
```

### 19. `a2-light-monster.png` — Cristalito

Monstro comum · Luz · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small floating construct of sharp golden-white crystal shards orbiting a bright core, two shards forming angry eyebrows over a single glowing eye, hovering just above the ground line.
```

### 20. `a2-darkness-monster.png` — Sombra Rastejante

Monstro comum · Trevas · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, two bright cold eyes (violet or pale cyan).

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small hooded shade made of thick ink-like darkness, no legs, its body trailing into smoke on the ground line, two long thin clawed hands, two violet eyes under the hood.
```

### 21. `a2-fire-miniboss.png` — Golem de Carvão

Miniboss · Fogo · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a hulking golem of stacked coal and basalt boulders bound by glowing molten seams, a furnace mouth in its chest, heavy fists, small burning eyes, smoke rising from its shoulders.
```

### 22. `a2-water-miniboss.png` — Enguia Abissal

Miniboss · Água · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a giant cave eel reared up like a cobra, armored with coral and shell plates, a lantern lure hanging from its head, translucent fins, needle teeth, water dripping from its body.
```

### 23. `a2-nature-miniboss.png` — Troll Fúngico

Miniboss · Natureza · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a big hunched troll overgrown with shelf mushrooms and glowing green fungus, a huge mushroom cap as a shoulder guard, a club made of a petrified root, a mossy beard.
```

### 24. `a2-light-miniboss.png` — Sentinela de Âmbar

Miniboss · Luz · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: an ancient guardian construct in armor of polished amber and bronze, a glowing sap core visible in its chest, a tall tower shield and a halberd of crystal, no face, only a bright slit visor.
```

### 25. `a2-darkness-miniboss.png` — Cavaleiro Oco

Miniboss · Trevas · capítulos 6 a 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, two bright cold eyes (violet or pale cyan).

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: an empty suit of old root-wrapped plate armor filled with swirling darkness, violet light leaking from the visor and the joints, a jagged greatsword resting on its shoulder, a torn cape.
```

### 26. `boss-c06.png` — Verme do Abismo

Chefe do capítulo · Trevas · capítulo 6

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, two bright cold eyes (violet or pale cyan).

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal cave worm rising from the bottom of the frame in an S curve, segmented black-violet armor plates, a round maw with rings of teeth and a void glow deep inside, a crown of bone spikes around the mouth, dark mist aura.
```

### 27. `boss-c07.png` — Wyrm da Forja

Chefe do capítulo · Fogo · capítulo 7

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a wingless dragon of molten rock, long serpentine body with basalt plates and rivers of lava between them, a horned anvil-shaped head, lava dripping from its jaws, a crown of flames and floating embers.
```

### 28. `boss-c08.png` — Leviatã das Águas Fundas

Chefe do capítulo · Água · capítulo 8

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a huge deep-water beast, part whale part kraken: a massive armored head with glowing cyan runes, four thick tentacles coiled around it, a crown of coral, bioluminescent spots, streams of water swirling around it.
```

### 29. `boss-c09.png` — Coração-Raiz, o Titã Soterrado

Chefe do capítulo · Natureza · capítulo 9

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a titan made of colossal twisted ancient roots, a glowing green heart of sap visible between its root ribs, a crown of stalactite-like wooden spikes, moss and glowing fungus on the shoulders, arms like tree trunks.
```

### 30. `boss-c10.png` — Colosso Prismático

Chefe do capítulo · Luz · capítulo 10

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 2 THEME: the deep caverns under the roots of the Great Tree. Mineral and fungal creatures: stone, coal, crystal, glowing fungus, ancient root-wrapped ruins. Harder, heavier and more armored than forest animals.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a towering crystal titan of faceted golden-white crystal, light refracting into small rainbows inside its body, a floating crystal crown split into shards above its faceless head, a radiant halo, floating shard fragments around it.
```

---

## Ato 3 — Copa Celeste (capítulos 11 a 15)

### 31. `a3-fire-monster.png` — Fênix Filhote

Monstro comum · Fogo · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small fierce phoenix chick, round body of orange-red feathers, flame tail feathers and a flame crest, tiny wings spread, sharp golden beak, hopping on thin legs.
```

### 32. `a3-water-monster.png` — Nimbo Zangado

Monstro comum · Água · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small storm cloud spirit, a puffy dark-blue cloud body with a frowning face, tiny arms of mist, rain falling from underneath and one little lightning spark, hovering just above the ground line.
```

### 33. `a3-nature-monster.png` — Louva-Folha

Monstro comum · Natureza · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a slender mantis whose body and wings are shaped like fresh green leaves, long scythe arms with thorn edges, a triangular head with big amber eyes, standing upright.
```

### 34. `a3-light-monster.png` — Lume Alado

Monstro comum · Luz · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a small orb of white-gold light with a single calm eye, two pairs of feathered wings, a thin golden ring floating above it, hovering just above the ground line.
```

### 35. `a3-darkness-monster.png` — Corvo do Vazio

Monstro comum · Trevas · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, two bright cold eyes (violet or pale cyan).

ROLE: common weak enemy. Small and compact, simple shape, a little mischievous. FRAMING (critical): the creature fills about 55% of the canvas height, centered, at least 15% empty magenta margin on every side.

CREATURE: a raven of void-black feathers with a starfield pattern inside its wings, three glowing violet eyes, a curved silver beak, wings half spread, perched on the ground line.
```

### 36. `a3-fire-miniboss.png` — Grifo de Brasas

Miniboss · Fogo · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a powerful griffin with an eagle head and lion body, wings of burning feathers, a mane of flames, golden armor plates on chest and forelegs, talons glowing red-hot, one foreleg raised.
```

### 37. `a3-water-miniboss.png` — Serpente da Tempestade

Miniboss · Água · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a long sky serpent coiled in the air, cloud-white mane, scales of storm blue, fins like sails, small lightning arcs along its body, rain streaming from its coils, hovering above the ground line.
```

### 38. `a3-nature-miniboss.png` — Dríade Renegada

Miniboss · Natureza · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a tall corrupted forest spirit with a body of pale bark, antlers of flowering branches, hair of hanging vines, a bow made of a living branch with a thorn arrow, a wooden mask face with green glowing eyes.
```

### 39. `a3-light-miniboss.png` — Arconte Estelar

Miniboss · Luz · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a floating armored celestial construct, ivory and gold plate armor with no body inside, only light, four blade-like wings of light, a spear of sunlight, a rotating star-shaped halo behind its helmet.
```

### 40. `a3-darkness-miniboss.png` — Ceifador do Eclipse

Miniboss · Trevas · capítulos 11 a 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, two bright cold eyes (violet or pale cyan).

ROLE: miniboss. Large, heavy and armored, clearly stronger than a common enemy, one standout feature (horns, shell, weapon or crest). FRAMING (critical): the creature fills about 70% of the canvas height, centered, at least 10% empty magenta margin on every side.

CREATURE: a tall robed reaper whose cloak is a night sky full of stars, a black sun disc with a thin bright rim floating behind its hooded head, a long crescent scythe, skeletal dark hands.
```

### 41. `boss-c11.png` — Mariposa do Eclipse

Chefe do capítulo · Trevas · capítulo 11

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT DARKNESS: palette of deep violet, indigo and near-black, wisps of dark smoke, two bright cold eyes (violet or pale cyan).

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a colossal moth with enormous wings spread wide, the wings showing a black sun eclipse pattern with a thin burning rim, a furry dark body, feathered antennae like a crown, falling dark stardust, cold violet eyes.
```

### 42. `boss-c12.png` — Fênix Cinzenta, a Ave do Fim

Chefe do capítulo · Fogo · capítulo 12

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT FIRE: palette of ember orange, deep red and charcoal black, glowing molten cracks, small sparks and heat shimmer.

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a gigantic phoenix with wings spread, feathers shifting from ash grey at the tips to white-hot at the core, a long tail of flame ribbons, a crown of fire, burning ash and embers swirling around it.
```

### 43. `boss-c13.png` — Dragão da Tempestade

Chefe do capítulo · Água · capítulo 13

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT WATER: palette of deep blue, teal and cyan, wet glossy highlights, droplets and small bubbles.

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a mighty winged storm dragon, scales of deep storm blue, wings like thunderclouds, a crown of horn-like lightning rods with arcs between them, rain and wind spirals around its body, glowing cyan eyes and throat.
```

### 44. `boss-c14.png` — Avatar da Árvore Apodrecida

Chefe do capítulo · Natureza · capítulo 14

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT NATURE: palette of moss green, bark brown and lime, leaves, thorns and vines, a few drifting spores.

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: a giant humanoid avatar of the Great Tree gone rotten: a body of pale twisted wood, a crown of dead branches with a few sick glowing leaves, a hollow chest with a dim green sap heart, long branch arms, fungus and falling dry leaves.
```

### 45. `boss-c15.png` — A Luz Faminta, Serafim Caído da Grande Árvore

Chefe do capítulo · Luz · capítulo 15

```
Style: 2D hand-painted fantasy game art, clean bold dark outlines, soft cel shading with rich painterly color, vibrant saturated palette, high contrast. Enemy creature for a side-view idle/clicker RPG. ONE creature, full body, side view facing LEFT (three-quarter turned slightly to the viewer), menacing idle stance, feet or base on the same invisible ground line, readable silhouette at 220x250 px. Mystical forest-of-light world (the Great Tree, glowing sap magic). Flat solid magenta #FF00FF background, no scenery, no ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image. Avoid: photorealism, 3D render, blurry, extra limbs, cropped body, multiple creatures, humans, background scenery, text, logo, magenta or pink on the creature itself.

ACT 3 THEME: the celestial canopy of the Great Tree, above the clouds and among the stars. Winged, majestic and otherworldly creatures: feathers, clouds, starlight, void. Elegant and dangerous, the strongest enemies of the game.

ELEMENT LIGHT: palette of warm gold, amber and ivory white, soft radiant glow, tiny floating motes of light.

ROLE: chapter boss. Huge, imposing and ornate, unique silhouette, a crown-like or halo-like feature and a strong elemental aura fully inside the frame. FRAMING (critical): the creature fills about 82% of the canvas height, centered, at least 8% empty magenta margin on every side, nothing touches the edges.

CREATURE: the final boss: a towering fallen seraph of pure white-gold light, six great wings of feathers and amber, a cracked golden halo crown, a faceless radiant mask with one vertical eye, long robes dissolving into sap-light, blinding aura with a few dark cracks in it.
```

---

## Checklist de assets

| # | Ato | Tipo | Elemento | Monstro | Arquivo | Gerado |
|---|---|---|---|---|---|---|
| 1 | 1 | Monstro comum | Fogo | Brasinha | `a1-fire-monster.png` | [ ] |
| 2 | 1 | Monstro comum | Água | Gota-do-Brejo | `a1-water-monster.png` | [ ] |
| 3 | 1 | Monstro comum | Natureza | Cogumelo Mordaz | `a1-nature-monster.png` | [ ] |
| 4 | 1 | Monstro comum | Luz | Vaga-lume Errante | `a1-light-monster.png` | [ ] |
| 5 | 1 | Monstro comum | Trevas | Mariposa-Sombra | `a1-darkness-monster.png` | [ ] |
| 6 | 1 | Miniboss | Fogo | Javali Brasa | `a1-fire-miniboss.png` | [ ] |
| 7 | 1 | Miniboss | Água | Sapo Pantaneiro | `a1-water-miniboss.png` | [ ] |
| 8 | 1 | Miniboss | Natureza | Toco Espinhento | `a1-nature-miniboss.png` | [ ] |
| 9 | 1 | Miniboss | Luz | Cervo Solar | `a1-light-miniboss.png` | [ ] |
| 10 | 1 | Miniboss | Trevas | Tecelã da Noite | `a1-darkness-miniboss.png` | [ ] |
| 11 | 1 | Chefe do capítulo | Trevas | Lobo Umbral, o Devorador da Clareira | `boss-c01.png` | [ ] |
| 12 | 1 | Chefe do capítulo | Fogo | Urso Fornalha | `boss-c02.png` | [ ] |
| 13 | 1 | Chefe do capítulo | Água | Hidra do Brejo | `boss-c03.png` | [ ] |
| 14 | 1 | Chefe do capítulo | Natureza | Mãe-Espinheira | `boss-c04.png` | [ ] |
| 15 | 1 | Chefe do capítulo | Luz | Coruja Áurea, Guardiã da Seiva | `boss-c05.png` | [ ] |
| 16 | 2 | Monstro comum | Fogo | Salamandra de Magma | `a2-fire-monster.png` | [ ] |
| 17 | 2 | Monstro comum | Água | Caranguejo de Gruta | `a2-water-monster.png` | [ ] |
| 18 | 2 | Monstro comum | Natureza | Larva-Raiz | `a2-nature-monster.png` | [ ] |
| 19 | 2 | Monstro comum | Luz | Cristalito | `a2-light-monster.png` | [ ] |
| 20 | 2 | Monstro comum | Trevas | Sombra Rastejante | `a2-darkness-monster.png` | [ ] |
| 21 | 2 | Miniboss | Fogo | Golem de Carvão | `a2-fire-miniboss.png` | [ ] |
| 22 | 2 | Miniboss | Água | Enguia Abissal | `a2-water-miniboss.png` | [ ] |
| 23 | 2 | Miniboss | Natureza | Troll Fúngico | `a2-nature-miniboss.png` | [ ] |
| 24 | 2 | Miniboss | Luz | Sentinela de Âmbar | `a2-light-miniboss.png` | [ ] |
| 25 | 2 | Miniboss | Trevas | Cavaleiro Oco | `a2-darkness-miniboss.png` | [ ] |
| 26 | 2 | Chefe do capítulo | Trevas | Verme do Abismo | `boss-c06.png` | [ ] |
| 27 | 2 | Chefe do capítulo | Fogo | Wyrm da Forja | `boss-c07.png` | [ ] |
| 28 | 2 | Chefe do capítulo | Água | Leviatã das Águas Fundas | `boss-c08.png` | [ ] |
| 29 | 2 | Chefe do capítulo | Natureza | Coração-Raiz, o Titã Soterrado | `boss-c09.png` | [ ] |
| 30 | 2 | Chefe do capítulo | Luz | Colosso Prismático | `boss-c10.png` | [ ] |
| 31 | 3 | Monstro comum | Fogo | Fênix Filhote | `a3-fire-monster.png` | [ ] |
| 32 | 3 | Monstro comum | Água | Nimbo Zangado | `a3-water-monster.png` | [ ] |
| 33 | 3 | Monstro comum | Natureza | Louva-Folha | `a3-nature-monster.png` | [ ] |
| 34 | 3 | Monstro comum | Luz | Lume Alado | `a3-light-monster.png` | [ ] |
| 35 | 3 | Monstro comum | Trevas | Corvo do Vazio | `a3-darkness-monster.png` | [ ] |
| 36 | 3 | Miniboss | Fogo | Grifo de Brasas | `a3-fire-miniboss.png` | [ ] |
| 37 | 3 | Miniboss | Água | Serpente da Tempestade | `a3-water-miniboss.png` | [ ] |
| 38 | 3 | Miniboss | Natureza | Dríade Renegada | `a3-nature-miniboss.png` | [ ] |
| 39 | 3 | Miniboss | Luz | Arconte Estelar | `a3-light-miniboss.png` | [ ] |
| 40 | 3 | Miniboss | Trevas | Ceifador do Eclipse | `a3-darkness-miniboss.png` | [ ] |
| 41 | 3 | Chefe do capítulo | Trevas | Mariposa do Eclipse | `boss-c11.png` | [ ] |
| 42 | 3 | Chefe do capítulo | Fogo | Fênix Cinzenta, a Ave do Fim | `boss-c12.png` | [ ] |
| 43 | 3 | Chefe do capítulo | Água | Dragão da Tempestade | `boss-c13.png` | [ ] |
| 44 | 3 | Chefe do capítulo | Natureza | Avatar da Árvore Apodrecida | `boss-c14.png` | [ ] |
| 45 | 3 | Chefe do capítulo | Luz | A Luz Faminta, Serafim Caído da Grande Árvore | `boss-c15.png` | [ ] |

## Dicas de consistência

- Aprove primeiro **um comum, um miniboss e um chefe do Ato 1** e use os três como referência de traço para o resto.
- Mantenha a escala entre os tipos: comum pequeno, miniboss grande, chefe enorme. Se um comum vier grande demais, peça: *"Make the creature smaller in the frame, about 55% of the canvas height."*
- O elemento precisa ser lido pela cor de longe (laranja, azul, verde, dourado, violeta); se a paleta fugir, repita a linha `ELEMENT` no pedido de correção.
- Evite rosa e magenta no monstro: o chroma key apagaria essas partes.
- Para animar depois (respirar, tomar dano, morrer), a mesma imagem base serve: o jogo pode mover e tingir o sprite sem novos quadros.
