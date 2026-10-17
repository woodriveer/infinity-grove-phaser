# Infinity Grove — Prompts de Assets (Gemini)

Prompts para gerar, no Gemini, as imagens dos personagens **atacando com cada habilidade** descritas no `README.md`. São 5 personagens × 3 habilidades = 15 imagens.

## Como usar

1. Em cada geração, cole **primeiro** o bloco **ESTILO GLOBAL**, depois a **FICHA DO PERSONAGEM** e por fim o prompt da **habilidade**.
2. Para manter o personagem idêntico entre as poses: gere primeiro o *Character Sheet* (seção de cada personagem), e nas habilidades anexe essa imagem ao prompt dizendo "use the attached image as the exact character reference".
3. O Gemini não gera PNG com transparência de forma confiável. Por isso todos os prompts pedem **fundo magenta chapado (#FF00FF)**. Remova depois com chroma key (Photoshop, GIMP, Photopea ou remove.bg) e exporte em PNG.
4. Os prompts estão em inglês porque costumam render melhor; as explicações estão em português.
5. Se a imagem vier com fundo, texto ou moldura, repita pedindo: *"No text, no frame, no background scenery, flat solid magenta #FF00FF background."*
6. Tamanho sugerido de exportação: 1024×1024 (pose única). Para sprite no Phaser, recorte e padronize a altura do personagem (ex.: 256 px).

---

## ESTILO GLOBAL (colar em todo prompt)

```
Style: 2D hand-painted fantasy game art, clean bold outlines, soft cel shading with
rich painterly color, vibrant saturated palette, high contrast. Designed for a
side-view idle/clicker RPG. Character shown in full body, side view facing RIGHT,
dynamic mid-attack key-frame pose, centered with margin around, all visual effects
fully included in the frame. Mystical forest-of-light theme (the Great Tree, glowing
green and gold sap magic). Flat solid magenta #FF00FF background, no scenery, no
ground, no cast shadow, no text, no watermark, no frame, no UI. Square 1:1 image.
```

**Negativo (adicione ao final se necessário):**
```
Avoid: photorealism, 3D render, blurry, extra limbs, extra fingers, deformed
hands, cropped body, multiple characters, background scenery, text, logo.
```

**Additional:**
```
REFERENCE: use the attached image as the exact character reference
EYES: the details on his eyes should be perfect and not blurry
FRAMING (critical): Square 1:1 canvas. Zoom out — the full character. Leave at least 10% empty
magenta margin above the top and bottom. Character at most 75% of the image height, centered.
Nothing touches or crosses the image edges. Do not crop character, items or effects.
```

---

## 1. Kael Raizférrea — Guerreiro

### Ficha do personagem (colar)
```
CHARACTER: Kael Raizférrea, human male warrior, broad athletic build, short dark
brown hair, determined expression, short beard. Heavy plate armor in dark bronze
and moss green with root-like engraved patterns and glowing green sap veins. Mossy
green cape. Wields a large longsword whose blade is translucent amber crystal
(ferro cristalizado na seiva ancestral) with glowing sap inside, and a round
wooden-and-iron shield carved with the Great Tree emblem.
```

### Character Sheet (referência)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
Character reference sheet: the same character in 3 views (front, side facing
right, back) in a neutral standing pose, holding sword and shield, evenly spaced,
flat magenta #FF00FF background.
```

### 1.1 Corte Dimensional (Ataque)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Kael performs a huge two-handed overhead-to-diagonal slash, sword swung
down with full body twist, cape flying. The blade tears a glowing rift in space:
a long jagged diagonal tear of violet-white light with cracked-glass edges
revealing a starry void, extending far to the right. Golden-green sap sparks
and shockwave lines around the cut. Shield strapped to his back.
```

### 1.2 Investida do Baluarte (Controle)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Kael charges forward in a low shield-bash rush, body leaning right, shield
thrust out in front with both hands, sword held behind. A large golden-green
shockwave burst explodes from the shield impact point, with impact rings, speed
lines, flying dust and leaves, and small yellow stun stars circling in the
impact area.
```

### 1.3 Brado Aterrador (Debuff)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Kael roars a war cry, head thrown slightly back, mouth wide open, sword
raised high in one hand, other arm clenched. A visible sound-wave shockwave in
translucent red-orange concentric rings expands to the right, mixed with dark
purple fear-aura wisps shaped like frightened skull-faces. Cape whipping from the
force.
```

---

## 2. Lyra Folhaveloz — Arqueira

### Ficha do personagem (colar)
```
CHARACTER: Lyra Folhaveloz, young female wood elf archer, slim agile build, long
pointed ears, long silver-green braided hair, bright emerald eyes, focused
expression. Light leather armor in forest green and tan with leaf-shaped
shoulder guards, feather-trimmed hooded half-cape, bracers with leaf motifs.
Carries a tall elegant curved longbow of pale living wood with glowing green
runes, and a quiver of white-feathered arrows on her back.
```

### Character Sheet (referência)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
Character reference sheet: the same character in 3 views (front, side facing
right, back) in a neutral standing pose holding the bow, flat magenta #FF00FF
background.
```

### 2.1 Flecha Dupla (Ataque)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Lyra releases two arrows at once from the bow, mid-release, bowstring
vibrating, one knee slightly bent. Two arrows fly toward the right side by side,
each with a thin glowing green wind trail and tiny leaf particles swirling
around them. Hair and cape pushed back by the release.
```

### 2.2 Tiro Preciso (Ataque de conjuração)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Lyra in a deep concentrated aiming stance, bow fully drawn, one eye
squinting, arrow aimed right. A large glowing golden targeting reticle (concentric
circles with crosshair lines) floats in front of the arrow tip. The arrow head
glows intense white-gold, charged with energy, with a spiraling golden light
trail and a critical-hit starburst flare at the tip.
```

### 2.3 Ventos Ligeiros (Buff de grupo)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Lyra stands with arms spread open and one hand holding the bow up, eyes
closed, a calm smile. A powerful spiral of translucent cyan-green wind surrounds
her in a ring and spirals upward, full of floating leaves, feathers and tiny
glowing speed-streaks. Her hair and cape billow strongly. Faint speed-boost aura
glow under her feet.
```

---

## 3. Orina Brumaestrela — Mago

### Ficha do personagem (colar)
```
CHARACTER: Orina Brumaestrela, elderly-looking beatiful barbie female mage, long
silver-white hair, deep blue eyes with tiny star points in them. Long
midnight-blue robe with a night sky and constellation pattern, golden trim, wide
sleeves, and a pointed wide-brim hat decorated with a small silver star.
Carries a tall gnarled wooden staff topped with a floating glowing star-crystal
held by branch-like claws.
```

### Character Sheet (referência)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
Character reference sheet: the same character in 3 views (front, side facing
right, back) in a neutral standing pose holding the staff, flat magenta #FF00FF
background.
```

### 3.1 Prisão de Espinhos (Controle / debuff)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Orina points his staff forward to the right with one hand, other hand open
palm-down, casting. The star-crystal pulses green. From the ground at the right,
thick thorny magical vines with glowing green sap and purple thorns burst
upward and curl together forming a cage of spikes, with magic circle runes
glowing on the floor in green. Sparkles and leaves flying.
```

### 3.2 Tempestade Arcana (Ataque contínuo)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Orina holds the staff raised straight up with both hands, robe and beard
whipping, face intense. Above, a swirling violet-blue arcane storm cloud with
constellations inside, firing multiple branching lightning bolts in electric
cyan and violet that strike down toward the right side. Crackling energy arcs
around the staff crystal and floating arcane glyph circles.
```

### 3.3 Chuva de Meteoros (Ataque)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Orina sweeps his staff in a wide arc pointing toward the upper right, hat
tilted, cloak flowing. A rain of five or six glowing fiery star-meteors in
white-gold and magenta-blue with long burning comet tails falls diagonally from
the top-left toward the right, with embers, star dust and a large glowing
summoning rune circle in the air above Orina.
```

---

## 4. Seraphine Aurora — Clériga

### Ficha do personagem (colar)
```
CHARACTER: Seraphine Aurora, young woman priestess, gentle serene face, long
wavy golden-blonde hair with small white flowers, glowing soft amber eyes.
Flowing white-and-gold ceremonial robe with green leaf embroidery, light gold
shoulder armor, a tall sheer veil-like sash. Carries a golden ceremonial staff
topped with a sun-and-leaf emblem and a small holy bell hanging from it. A soft
halo of light behind her head.
```

### Character Sheet (referência)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
Character reference sheet: the same character in 3 views (front, side facing
right, back) in a neutral standing pose holding the staff, flat magenta #FF00FF
background.
[FRAMING]
```

### 4.1 Bênção da Grande Árvore (Buff de grupo)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Seraphine kneels slightly with hands clasped in prayer, eyes closed,
staff leaning on her shoulder. Behind and above her, the translucent glowing
silhouette of the Great Tree made of golden-green light rises like a spirit,
raining sparkling golden leaves and light motes. Three small floating icons of
light (a sword, an eye, a lightning bolt) circle around her to represent
strength, precision and speed buffs.
```

### 4.2 Luz Divina (Ataque)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Seraphine thrusts her staff toward the sky to the upper right with one arm,
other hand open, head up, hair flowing. A massive vertical pillar of
brilliant white-gold holy light crashes down on the right side of the frame
from the top edge to the bottom, with radiating light rays, a ring shockwave of
light at the base, feathers and sparkles.
```

### 4.3 Carrilhão da Aurora (Buff de grupo)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Seraphine swings the small holy bell on her staff, arm extended, eyes
closed, peaceful smile. Visible golden sound-wave rings expand outward from the
bell. A large translucent protective dome / shield of golden-white light with
a delicate hexagonal and leaf pattern surrounds her, with musical note
sparkles and gentle floating light petals.
```

---

## 5. Vex Sombraespinho — Assassino

### Ficha do personagem (colar)
```
CHARACTER: Vex Sombraespinho, lean male assassin, young, sharp features, short
messy black hair, pale skin with a faint purple Underworld tattoo marking
across one cheek, glowing violet eyes, a confident smirk. Dark hooded
leather armor in charcoal black and deep purple with thorn-shaped spikes on
shoulders and bracers, tattered scarf. Dual curved daggers with serrated
blades, a belt with vials, bombs and smoke pellets.
```

### Character Sheet (referência)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
Character reference sheet: the same character in 3 views (front, side facing
right, back) in a neutral standing pose holding both daggers, flat magenta
#FF00FF background.
```

### 5.1 Bomba de Veneno (Dano contínuo)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Vex mid-throw, arm extended forward after throwing a glass flask, body
low in a crouching lunge, other dagger held back. The flask is shattering in
the air at the right, exploding into a billowing toxic cloud of bright acid
green and sickly yellow gas with skull-shaped wisps, dripping poison droplets
and small bubbles.
```

### 5.2 Bomba de Fumaça (Buff de grupo)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Vex slams a smoke pellet to the ground at his feet, crouched, head
turned toward the viewer with a smirk, one dagger spinning in his hand. A big
swirling cloud of thick dark purple-grey smoke bursts outward around him,
with tiny glowing purple sparks and small floating eye icons glowing inside the
smoke (representing blinded enemies and critical focus).
```

### 5.3 Golpe Sangrento (Ataque + dano contínuo)
```
[ESTILO GLOBAL] [FICHA DO PERSONAGEM]
POSE: Vex lunges forward in a fast cross-slash with both daggers, body
stretched toward the right, motion blur. Two crossing crimson slash arcs in
bright red and dark crimson are left in the air, with flying blood-red droplets
(stylized, not gory) and dripping glowing red bleed particles that fall
downward, plus small speed lines.
```

---

## Checklist de assets

| # | Personagem | Habilidade | Arquivo sugerido | Gerado |
|---|---|---|---|---|
| 1 | Kael | Corte Dimensional | `kael_corte_dimensional.png` | [ ] |
| 2 | Kael | Investida do Baluarte | `kael_investida_baluarte.png` | [ ] |
| 3 | Kael | Brado Aterrador | `kael_brado_aterrador.png` | [ ] |
| 4 | Lyra | Flecha Dupla | `lyra_flecha_dupla.png` | [ ] |
| 5 | Lyra | Tiro Preciso | `lyra_tiro_preciso.png` | [ ] |
| 6 | Lyra | Ventos Ligeiros | `lyra_ventos_ligeiros.png` | [ ] |
| 7 | Orina | Prisão de Espinhos | `orin_prisao_espinhos.png` | [ ] |
| 8 | Orina | Tempestade Arcana | `orin_tempestade_arcana.png` | [ ] |
| 9 | Orina | Chuva de Meteoros | `orin_chuva_meteoros.png` | [ ] |
| 10 | Seraphine | Bênção da Grande Árvore | `seraphine_bencao.png` | [ ] |
| 11 | Seraphine | Luz Divina | `seraphine_luz_divina.png` | [ ] |
| 12 | Seraphine | Carrilhão da Aurora | `seraphine_carrilhao.png` | [ ] |
| 13 | Vex | Bomba de Veneno | `vex_bomba_veneno.png` | [ ] |
| 14 | Vex | Bomba de Fumaça | `vex_bomba_fumaca.png` | [ ] |
| 15 | Vex | Golpe Sangrento | `vex_golpe_sangrento.png` | [ ] |

> Prioridade do MVP: Kael (1–3) e Orina (7–9). Lyra, Seraphine e Vex ficam para depois.

## Dicas de consistência

- Gere sempre na mesma conversa do Gemini para ele lembrar o estilo.
- Anexe o *Character Sheet* a cada nova habilidade.
- Se o rosto/armadura mudar, reenvie a imagem de referência e peça: *"Keep the character design exactly identical to the reference."*
- Para ícones da barra de habilidades (UI), peça depois uma versão separada: *"only the skill effect as a square game icon, no character, rounded square frame, dark background"*.
