# Infinity Grove — Roteiro de Diálogos

A história é contada **depois de cada chefe de capítulo**: ao derrotar o chefe, abre uma cena em que os personagens conversam. O jogador clica para avançar fala por fala, e cada fala tem voz gerada por IA. Há também um **prólogo** antes do capítulo 1. O canon da história está em `BRIEFING_HISTORIA.md`.

## Como ler este roteiro

- **Legenda** é o texto que aparece na caixa de diálogo do jogo.
- **Texto para o Eleven v4** é o que se cola no ElevenLabs (modelo Eleven v4): as mesmas palavras da legenda, com as tags de emoção e as pausas. Copie a célula inteira.
- **Duração** é a estimativa da fala gravada: número de palavras dividido pelo ritmo do personagem (tabela abaixo) mais 0,5 s de respiro. Serve para orçar a geração e conferir o áudio; se o áudio gerado passar de 1,5× a estimativa, o ritmo saiu lento demais.
- Todos os cinco heróis aparecem nas cenas, mesmo que o jogador não os tenha na equipe: a história é a mesma para todo mundo.

## Como gerar no Eleven v4

Regras do guia oficial ([Prompting Eleven v4](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices#prompting-eleven-v4)) aplicadas neste roteiro:

- **Tags entre colchetes, em inglês, antes do trecho que mudam:** `[whispers]`, `[sarcastic]`, `[snorts]`. Uma tag nova no meio da fala muda o tom só dali em diante (`Chega. [softer] A Árvore...`). As tags não são faladas; as palavras ficam em português.
- **Tags descritivas de voz** valem mais que uma palavra solta: `[low, steady voice, suspicious]`. Por isso nenhuma tag descreve um som de ambiente: o modelo poderia tentar reproduzi-lo.
- **Pausas:** o v4 **não aceita** `<break time="..."/>` (SSML). As pausas vêm de reticências (`...`), travessão e das tags `[pause]`, `[brief pause]` e `[long pause]`. Use poucas por fala: pausa demais deixa a voz instável.
- **Ênfase com MAIÚSCULAS**, numa palavra por fala no máximo (`a VÍTIMA`, `uma CHAVE`).
- **Uma voz por personagem**, gerando fala por fala (ou no modo de diálogo com `Personagem: texto`, cada um com sua voz). Ajuste a **velocidade** de cada voz pela coluna *Speed* da ficha (o v4 aceita de 0,7 a 1,2; o padrão é 1,0).
- **Teste as tags em cada voz** antes de gerar a cena inteira: uma voz séria pode não responder a tags brincalhonas, e `[hums softly]` (Seraphine cantarolando) é experimental. Se não funcionar, grave o cantarolar à parte.
- **Fora do gerador de voz:** o eco e o reverb da Voz e os efeitos sonoros das cenas (badalada, estrondo, fogueira) entram na edição, não como tag.

---

## Ficha de vozes

| Personagem | Idade aparente | Timbre | Ritmo | Speed (v4) | Trejeitos e jeito de falar |
|---|---|---|---|---|---|
| **Narrador** | 60+ | Grave, quente, levemente rouco | Lento, 2,3 palavras/s | 0,9 | Contador de histórias ao pé da fogueira. Frases longas que terminam em queda. Pausa antes da última palavra de impacto ("...Vermelhos."). Nunca opina, só mostra. |
| **Kael Raizférrea** | 35 | Barítono firme, peito | Pausado, 2,2 palavras/s | 0,9 | Soldado. Frases curtas, ordens no imperativo ("Avançamos ao amanhecer."). Desconfia de Vex e o chama de "espião" nos atos 1 a 3. Quase nunca faz pergunta; quando faz, é seca. Quando se emociona, fica mais baixo, não mais alto. |
| **Lyra Folhaveloz** | 19 | Agudo, claro, energia alta | Rápido, 3,0 palavras/s | 1,1 | Elfa batedora, curiosa, fala atropelando. Repete palavras quando está animada ("vermelho, vermelho"). Usa "tipo" e chama todos pelo nome. Ri curto e nervoso em perigo. Nos atos 4 a 6 fica mais séria, mas o ritmo continua rápido. |
| **Orina Brumaestrela** | 40 | Médio, nasal leve, articulado | Médio, 2,5 palavras/s | 1,0 | Maga estudiosa. Começa frases com "Interessante..." ou "Exatamente." Fala em dados, mapas e padrões. Ironia seca. Faz pausa para pensar no meio da frase. |
| **Seraphine Aurora** | 28 | Soprano suave, aveludado, calmo | Lento, 2,2 palavras/s | 0,9 | Sacerdotisa serena, voz de quem reza. Diz "a Árvore diz..." como bordão. **Pistas de voz:** cantarola a mesma melodia de 4 notas quando está sozinha; quando alguém chega perto da verdade, responde rápido demais e muda de assunto. Depois do capítulo 15, a voz perde a serenidade: fala mais baixo, hesita. |
| **Vex Sombraespinho** | 32 | Tenor rouco, meio sussurrado | Médio, 2,6 palavras/s | 1,0 | Ex-espião do Submundo. Sarcástico, frase curta e seca, risada pelo nariz. Usa gírias do Submundo ("subir pela escada velha"). Chama Kael de "guerreiro" e Seraphine de "sacerdotisa". Quando fala sério, a voz fica totalmente sem ironia, e isso deve chamar a atenção. |
| **A Voz** (Morvath disfarçado) | — | Coro sussurrado, doce, como vento nas folhas | Muito lento, 1,7 palavra/s | 0,8 | Só Seraphine ouve nos atos 1 a 3, e o jogador ouve junto. Chama Seraphine de "criança". **Gerar com a mesma voz de Morvath**, em sussurro e com eco: no capítulo 15 o jogador deve perceber que é a mesma voz. |
| **Morvath, o Rei Sob as Raízes** | antigo | Baixo profundo, aveludado, com eco metálico | Muito lento, 1,7 palavra/s | 0,8 | Nunca grita. Educado, cortês, sorri enquanto fala. Agradece sempre ("Obrigado, sacerdotisa."). A ameaça está na calma. |
| **Coruja Áurea** | antiga | Contralto velho, fraco, solene | Lento, 1,8 palavra/s | 0,8 | Guardiã moribunda. Respira entre as palavras. Só aparece no capítulo 5. |

### Prompts para criar as vozes (gerador de voz por descrição)

Para geradores que criam voz a partir de uma descrição, em inglês, que costuma funcionar melhor. Todas em português do Brasil.

| Personagem | Prompt |
|---|---|
| Narrador | `Old male storyteller, 60s, deep warm slightly raspy voice, slow calm pace, epic fantasy narration, Brazilian Portuguese.` |
| Kael | `Male warrior, mid 30s, firm baritone chest voice, short commanding sentences, steady and serious, Brazilian Portuguese.` |
| Lyra | `Young female elf, 19, bright high-pitched energetic voice, fast excited pace, playful and curious, Brazilian Portuguese.` |
| Orina | `Female scholar mage, 40, clear articulate mid voice, thoughtful pauses, dry wit, Brazilian Portuguese.` |
| Seraphine | `Young female priestess, late 20s, soft velvety soprano, serene prayer-like slow pace, gentle and warm, Brazilian Portuguese.` |
| Vex | `Male rogue, early 30s, husky half-whispered tenor, sarcastic dry delivery, Brazilian Portuguese.` |
| Morvath / A Voz | `Ancient demon king, very deep velvety bass with a faint metallic echo, extremely slow, calm and polite, menacing softness, Brazilian Portuguese.` (A Voz: a mesma voz, sussurrada, com eco e reverb) |
| Coruja Áurea | `Ancient dying female spirit, old weak contralto, breathy, solemn, slow, Brazilian Portuguese.` |

---

| Personagem | Voz escolhida no Eleven Labs |
|---|---|
| Narrador | Infinty Grove - Narrator |
| A voz | Morvath / A Voz |
| Seraphine | Seraphine |
| Kael | Inferno - Arrogant Male Villian |
| Lyra | Nao - Cute, Playful & Bright |
| Vex | Cavendish |
| Orina | Elettra - Mature Actress |



## Mapa das cenas (30 capítulos)

Uma linha por cena; o diálogo completo fica nas seções seguintes conforme cada ato é escrito.

| Cap. | Chefe | O que a cena conta | Escrito |
|---|---|---|---|
| — | — | Prólogo: as raízes tremem, a Árvore escolhe cinco guardiões | ✅ |
| 1 | Serpente Umbral, a Devoradora da Clareira | O grupo se forma; Seraphine "ouve a Árvore"; Vex é olhado com desconfiança | ✅ |
| 2 | Urso Fornalha | As criaturas vieram de baixo da terra; Kael acusa Vex | ✅ |
| 3 | Pantera do Brejo | Orina: a corrupção se espalha em círculos a partir da Árvore; Seraphine se defende rápido demais | ✅ |
| 4 | Rei-Javali Espinheiro | Seraphine cantarola; Vex reconhece a canção do Submundo | ✅ |
| 5 | Coruja Áurea, Guardiã da Seiva | "A luz que vocês seguem não nasceu da Árvore." Fim do ato 1 | ✅ |
| 6 | Rainha-Aranha do Abismo | Descida às raízes; Vex conhece as aranhas e o grupo desconfia mais | ✅ |
| 7 | Wyrm da Forja | A forja das raízes, origem da espada de Kael | ✅ |
| 8 | Leviatã do Lago Cego | Eco de sino na água; Seraphine empalidece | ✅ |
| 9 | Toupeira-Titã Soterrada | O Selo está rachado, e foi quebrado por cima | ✅ |
| 10 | Morcego Prismático | Selo aberto; Kael acusa Vex abertamente; Seraphine manda subir à Copa. Fim do ato 2 | ✅ |
| 11 | Corvo do Eclipse | A Copa, lar de Lyra, está tomada | |
| 12 | Fênix Cinzenta, a Ave do Fim | Orina: as "estrelas caídas" são faíscas do Submundo | |
| 13 | Rã-Trovão | Vex some perto do coração da Árvore; Kael o enfrenta | |
| 14 | Símio da Árvore Apodrecida | Seraphine pergunta à Árvore e ouve silêncio; começa a suspeitar de si e esconde | |
| 15 | A Luz Faminta | **A revelação**: o Carrilhão dentro da criatura; Morvath fala pela primeira vez; Seraphine confessa. Fim do ato 3 | |
| 16 | Hidra da Fenda | O grupo racha; Kael quer Seraphine fora; Vex a defende | |
| 17 | Behemoth Fornalha | O bosque do ato 1 meio engolido pelo Submundo; a raiva de Lyra | |
| 18 | Pantera do Rio Negro | Orina descobre que os portões só fecham por dentro | |
| 19 | Javali Colosso da Fenda | Seraphine e Vex conversam; Kael cede | |
| 20 | Guardião dos Portões | Eles entram no Submundo. Fim do ato 4 | |
| 21 | Eco Sem Rosto | Rios de cinza; a Seiva roubada correndo para baixo | |
| 22 | Senhor das Cinzas | O passado de Vex: seu antigo comandante | |
| 23 | Serpente-Rio, a Que Bebe a Seiva | O Carrilhão pode fechar os portões, mas quem toca fica dentro; Seraphine conta a todos (sem segredos agora) | |
| 24 | Árvore Invertida | Morvath tenta cada herói pela voz | |
| 25 | Arauto da Falsa Aurora | Morvath oferece a Seraphine voltar a "ouvir a Árvore"; ela recusa. Fim do ato 5 | |
| 26 | General Oco, a Mão de Morvath | Subida ao trono: o momento de Kael | |
| 27 | Cérbero da Forja Rubra | O momento de Lyra | |
| 28 | Kraken do Fosso do Trono | O momento de Orina | |
| 29 | Titã das Raízes Mortas | O momento de Vex | |
| 30 | Morvath, o Rei Sob as Raízes | Morvath cai; Seraphine toca o Carrilhão e fica do lado de dentro; epílogo do Narrador. Fim | |

Os chefes seguem `PROMPTS_ASSETS_MONSTROS.md`.

---

## Ato 1 — Bosque Desperto

### Prólogo (antes do capítulo 1)

| # | Personagem | Legenda | Texto para o Eleven v4 | Duração |
|---|---|---|---|---|
| 1 | Narrador | Eldora sempre respirou pela Grande Árvore. Suas raízes bebem do fundo do mundo, e sua seiva corre por cada folha, cada rio, cada criatura. | [warm, deep storyteller voice, slow and epic] Eldora sempre respirou pela Grande Árvore. Suas raízes bebem do fundo do mundo... e sua seiva corre por cada folha, cada rio, cada criatura. | 11 s |
| 2 | Narrador | Até a noite em que as raízes tremeram. | [lower, grave] Até a noite em que as raízes... tremeram. | 4 s |
| 3 | Narrador | Do fundo da terra subiu um rumor. E os animais do bosque abriram os olhos... Vermelhos. | [hushed, building suspense] Do fundo da terra subiu um rumor. E os animais do bosque abriram os olhos... [long pause] Vermelhos. | 7,5 s |
| 4 | Narrador | A Árvore despertou. E, entre milhares, escolheu cinco guardiões. | [solemn, rising] A Árvore despertou. E, entre milhares... escolheu cinco guardiões. | 4,5 s |
| 5 | A Voz | Criança... venha. Eu preciso de você. | [whispers, sweet and airy, like wind through leaves] Criança... venha. Eu preciso de você. | 4 s |
| 6 | Seraphine | Vocês também ouviram? Ela está nos chamando. A Árvore... está com medo. | [soft, awed, almost a prayer] Vocês também ouviram? Ela está nos chamando. [worried] A Árvore... está com medo. | 6 s |

**Duração total:** ~37 s

### Capítulo 1 — depois da Serpente Umbral, a Devoradora da Clareira

| # | Personagem | Legenda | Texto para o Eleven v4 | Duração |
|---|---|---|---|---|
| 1 | Narrador | A Serpente Umbral tomba na clareira, e o veneno roxo escorre de volta para a terra. | [calm, restrained triumph] A Serpente Umbral tomba na clareira, e o veneno roxo escorre de volta para a terra. | 7,5 s |
| 2 | Kael | Uma serpente desse tamanho, aqui? Isto não é do nosso bosque. | [low, steady voice, suspicious] Uma serpente desse tamanho, aqui? Isto não é do nosso bosque. | 5,5 s |
| 3 | Lyra | Olha os olhos dela, Kael! Ainda brilham. Vermelho, vermelho, como brasa! | [excited, fast, half scared] Olha os olhos dela, Kael! Ainda brilham. Vermelho, vermelho, como BRASA! | 4 s |
| 4 | Orina | Interessante... As veias roxas pulsam no mesmo ritmo. Como se algo lá embaixo respirasse por elas. | [curious, thoughtful] Interessante... [pause] As veias roxas pulsam no mesmo ritmo. Como se algo lá embaixo respirasse por elas. | 7 s |
| 5 | Seraphine | A Árvore diz que isto é só o começo. Precisamos ficar juntos. | [serene, confident] A Árvore diz que isto é só o começo. Precisamos ficar juntos. | 6 s |
| 6 | Vex | Ela diz, é? Sorte a sua. Comigo ninguém conversa. | [sarcastic] Ela diz, é? [snorts] Sorte a sua. Comigo ninguém conversa. | 4 s |
| 7 | Kael | Deixe de reclamar, espião. Avançamos ao amanhecer! | [annoyed, then firm and commanding] Deixe de reclamar, espião. [rallying] Avançamos ao amanhecer! | 4,5 s |

**Duração total:** ~38 s

### Capítulo 2 — depois do Urso Fornalha

| # | Personagem | Legenda | Texto para o Eleven v4 | Duração |
|---|---|---|---|---|
| 1 | Narrador | O Urso Fornalha cai, e a mata ao redor ainda arde. | [grave, weary] O Urso Fornalha cai, e a mata ao redor ainda arde. | 5,5 s |
| 2 | Lyra | As pegadas dele não vêm da trilha. Elas começam no chão, tipo... ele saiu de baixo da terra! | [curious, fast] As pegadas dele não vêm da trilha. Elas começam no chão, tipo... [excited] ele saiu de baixo da terra! | 6,5 s |
| 3 | Kael | Do fundo? Só as raízes da Árvore chegam tão fundo. | [slow, worried] Do fundo? Só as raízes da Árvore chegam tão fundo. | 5 s |
| 4 | Vex | No Submundo a gente chamava isso de subir pela escada velha. | [casual, offhand] No Submundo a gente chamava isso de subir pela escada velha. | 4,5 s |
| 5 | Kael | A gente? Engraçado você ainda dizer "a gente", espião. | [cold, accusing] A gente? Engraçado você ainda dizer "a gente", espião. | 4,5 s |
| 6 | Vex | Hábito, guerreiro. Assim como o seu, de desconfiar de tudo. | [dry, unbothered] Hábito, guerreiro. Assim como o seu, de desconfiar de tudo. | 4,5 s |
| 7 | Seraphine | Chega. A Árvore escolheu cada um de nós. Inclusive ele. | [firm but calm] Chega. [softer] A Árvore escolheu cada um de nós. Inclusive ele. | 5 s |

**Duração total:** ~36 s

### Capítulo 3 — depois da Pantera do Brejo

| # | Personagem | Legenda | Texto para o Eleven v4 | Duração |
|---|---|---|---|---|
| 1 | Narrador | No brejo, a Pantera afunda nas águas escuras, e o silêncio volta. Por um instante. | [calm] No brejo, a Pantera afunda nas águas escuras, e o silêncio volta. [brief pause] Por um instante. | 7 s |
| 2 | Orina | Marquei no mapa cada lugar onde a corrupção apareceu. Eles formam círculos. | [focused, matter-of-fact] Marquei no mapa cada lugar onde a corrupção apareceu. Eles formam círculos. | 5,5 s |
| 3 | Lyra | Círculos? Tipo uma pedra caindo num lago? | [curious, quick] Círculos? Tipo uma pedra caindo num lago? | 3 s |
| 4 | Orina | Exatamente. E o centro de todos eles... é a Grande Árvore. | [slow, deliberate] Exatamente. E o centro de todos eles... [pause] é a Grande Árvore. | 5 s |
| 5 | Kael | Impossível. A Árvore é a vítima, não a origem. | [hard, certain] Impossível. A Árvore é a VÍTIMA, não a origem. | 4,5 s |
| 6 | Seraphine | Os cálculos de Orina estão errados. A Árvore saberia. Vamos em frente. | [too quick, cutting in, defensive] Os cálculos de Orina estão errados. A Árvore saberia. Vamos em frente. | 6 s |
| 7 | Orina | Números não mentem, Seraphine. Pessoas, às vezes. | [dry, slow irony] Números não mentem, Seraphine. [pause] Pessoas, às vezes. | 3,5 s |

**Duração total:** ~34 s

### Capítulo 4 — depois do Rei-Javali Espinheiro

| # | Personagem | Legenda | Texto para o Eleven v4 | Duração |
|---|---|---|---|---|
| 1 | Narrador | O Rei-Javali desaba sobre os espinhos. Naquela noite, junto à fogueira, alguém cantarola. | [intimate, low, campfire storytelling] O Rei-Javali desaba sobre os espinhos. Naquela noite, junto à fogueira... alguém cantarola. | 6 s |
| 2 | Seraphine | Hm, hm-hm... hm-hm, hmm... | [hums softly, a slow four-note melody] Hm, hm-hm... hm-hm, hmm... | 3 s |
| 3 | Vex | Essa melodia. Onde você aprendeu? | [serious, no irony at all] Essa melodia. Onde você aprendeu? | 2,5 s |
| 4 | Seraphine | A Árvore canta para mim, quando estou sozinha. Por quê? | [surprised, gentle] A Árvore canta para mim, quando estou sozinha. [curious] Por quê? | 5 s |
| 5 | Vex | Porque eu já ouvi essa canção. Num lugar onde nada canta. | [low, slow, unsettled] Porque eu já ouvi essa canção. [pause] Num lugar onde nada canta. | 4,5 s |
| 6 | Seraphine | Você deve estar enganado. Durma, Vex. Amanhã será longo. | [too quick, closing the subject] Você deve estar enganado. Durma, Vex. Amanhã será longo. | 4,5 s |
| 7 | Narrador | Vex não dormiu. E, pela primeira vez, Seraphine também não. | [whispers, mysterious] Vex não dormiu. E, pela primeira vez... Seraphine também não. | 5 s |

**Duração total:** ~30 s

### Capítulo 5 — depois da Coruja Áurea, Guardiã da Seiva (fim do ato 1)

| # | Personagem | Legenda | Texto para o Eleven v4 | Duração |
|---|---|---|---|---|
| 1 | Narrador | A Coruja Áurea, guardiã da seiva por mil anos, cai das alturas. A luz roxa deixa seus olhos, e por um momento eles voltam a ser dourados. | [solemn, sad] A Coruja Áurea, guardiã da seiva por mil anos, cai das alturas. A luz roxa deixa seus olhos... e por um momento eles voltam a ser dourados. | 12 s |
| 2 | Coruja Áurea | Guardiões... obrigada. Vocês me libertaram. | [weak, breathy, old voice] Guardiões... [exhales] obrigada. Vocês me libertaram. | 3,5 s |
| 3 | Lyra | Ela está falando! Calma, calma, a gente vai cuidar de você! | [panicked, fast, near tears] Ela está falando! Calma, calma, a gente vai cuidar de você! | 4 s |
| 4 | Coruja Áurea | Não há tempo. Ouçam... A luz que vocês seguem... não nasceu da Árvore. | [urgent but fading, long pauses] Não há tempo. Ouçam... A luz que vocês seguem... não nasceu da Árvore. | 7,5 s |
| 5 | Kael | Que luz? Do que ela está falando? | [confused, sharp] Que luz? Do que ela está falando? | 3,5 s |
| 6 | Coruja Áurea | Desçam às raízes. Lá está a resposta... e a culpa. | [last breath, voice fading out] Desçam às raízes. Lá está a resposta... [whispers] e a culpa. | 6 s |
| 7 | Orina | Ela se foi. | [quiet, restrained grief] Ela se foi. | 1,5 s |
| 8 | Seraphine | Ela falava do Submundo. Só pode ser. Vamos às raízes. | [voice breaking] Ela falava do Submundo. [composes herself too quickly] Só pode ser. Vamos às raízes. | 5 s |
| 9 | Narrador | Assim termina o primeiro ato. Sob o Bosque Desperto, as Raízes Profundas esperam. | [epic, closing] Assim termina o primeiro ato. [pause] Sob o Bosque Desperto, as Raízes Profundas esperam. | 6 s |

**Duração total:** ~49 s

---

## Ato 2 — Raízes Profundas

### Capítulo 6 — depois da Rainha-Aranha do Abismo

| # | Personagem | Legenda | Texto para o Eleven v4 | Duração |
|---|---|---|---|---|
| 1 | Narrador | Sob o bosque, as raízes formam túneis maiores que catedrais. Ali, a Rainha-Aranha do Abismo teceu sua última teia. | [grave, slow, awed] Sob o bosque, as raízes formam túneis maiores que catedrais. Ali, a Rainha-Aranha do Abismo teceu sua última teia. | 9 s |
| 2 | Lyra | Eca, eca! Teia por todo lado! Vex, por que você nem piscou quando ela apareceu? | [disgusted, fast] Eca, eca! Teia por todo lado! [suspicious] Vex, por que você nem piscou quando ela apareceu? | 5,5 s |
| 3 | Vex | Porque eu já vi uma dessas. Elas guardam as passagens do Submundo. | [dry, flat] Porque eu já vi uma dessas. Elas guardam as passagens do Submundo. | 5 s |
| 4 | Kael | Guardam. Ou abrem caminho para quem sabe a senha, espião? | [cold, accusing] Guardam. Ou abrem caminho para quem sabe a senha, espião? | 5 s |
| 5 | Vex | Se eu soubesse a senha, guerreiro, não teria precisado matar a rainha. | [snorts] Se eu soubesse a senha, guerreiro, não teria precisado matar a rainha. | 5 s |
| 6 | Orina | Interessante... Teias do Submundo aqui embaixo significam que a passagem está perto. E aberta. | [curious, thoughtful] Interessante... Teias do Submundo aqui embaixo significam que a passagem está perto. [pause] E aberta. | 6 s |
| 7 | Seraphine | Então vamos encontrá-la antes que algo pior suba. Por aqui. | [calm, a little too sure] Então vamos encontrá-la antes que algo pior suba. Por aqui. | 5 s |
| 8 | Narrador | Ninguém percebeu que, no escuro dos túneis, Seraphine conhecia o caminho sem precisar de tocha. | [whispers, mysterious] Ninguém percebeu que, no escuro dos túneis, Seraphine conhecia o caminho... sem precisar de tocha. | 7 s |

**Duração total:** ~48 s

### Capítulo 7 — depois do Wyrm da Forja

| # | Personagem | Legenda | Texto para o Eleven v4 | Duração |
|---|---|---|---|---|
| 1 | Narrador | No coração quente das raízes, o Wyrm da Forja se apaga sobre uma bigorna antiga. | [epic, steady] No coração quente das raízes, o Wyrm da Forja se apaga sobre uma bigorna antiga. | 7 s |
| 2 | Kael | Eu conheço este lugar. Foi aqui que meu mestre forjou a minha espada. | [quiet, moved, voice dropping] Eu conheço este lugar. Foi aqui que meu mestre forjou a minha espada. | 6,5 s |
| 3 | Lyra | Aqui? Tipo, aqui embaixo, com esse bicho? | [surprised, fast] Aqui? Tipo, aqui embaixo, com esse bicho? | 3 s |
| 4 | Kael | Antes dele. Os guardiões das raízes vigiavam o Selo. Eu era um deles. | [firm, wounded pride] Antes dele. Os guardiões das raízes vigiavam o Selo. Eu era um deles. | 6,5 s |
| 5 | Orina | O Selo entre Eldora e o Submundo. Sempre achei que fosse lenda. | [intrigued] O Selo entre Eldora e o Submundo. Sempre achei que fosse lenda. | 5,5 s |
| 6 | Vex | Guardião do Selo, é? Então quem estava de guarda quando tudo isso subiu, guerreiro? | [sarcastic, slow, cutting] Guardião do Selo, é? Então quem estava de guarda quando tudo isso subiu, guerreiro? | 6 s |
| 7 | Kael | Eu não estava. Fui chamado ao templo naquela noite. Uma prece pela colheita. | [very low, guilty] Eu não estava. [pause] Fui chamado ao templo naquela noite. [pause] Uma prece pela colheita. | 6,5 s |
| 8 | Seraphine | Eu me lembro. Foi uma noite bonita. Vamos, a forja não é lugar para lembranças. | [too quick, cutting in] Eu me lembro. Foi uma noite bonita. Vamos, a forja não é lugar para lembranças. | 7,5 s |

**Duração total:** ~48 s

### Capítulo 8 — depois do Leviatã do Lago Cego

| # | Personagem | Legenda | Texto para o Eleven v4 | Duração |
|---|---|---|---|---|
| 1 | Narrador | O Leviatã afunda no Lago Cego. As águas tremem, e do fundo sobe um som. | [mysterious, slowing down] O Leviatã afunda no Lago Cego. As águas tremem... e do fundo sobe um som. | 7 s |
| 2 | Lyra | Vocês ouviram isso? Parecia um sino! Um sino, debaixo d'água! | [startled, fast] Vocês ouviram isso? Parecia um sino! Um sino, debaixo d'água! | 4 s |
| 3 | Orina | Impossível. O som não atravessa a água assim... a não ser que o sino seja mágico. | [analytical] Impossível. O som não atravessa a água assim... [pause] a não ser que o sino seja mágico. | 7 s |
| 4 | Vex | Sacerdotisa. Você está pálida. | [serious, quiet] Sacerdotisa. Você está pálida. | 2 s |
| 5 | Seraphine | É o frio do lago. Só isso. | [shaky, short] É o frio do lago. Só isso. | 3,5 s |
| 6 | Vex | Claro. O frio. | [dry, unconvinced] Claro. O frio. | 1,5 s |
| 7 | A Voz | Não pare agora, criança. Estamos quase juntos. | [whispers, sweet and airy] Não pare agora, criança. Estamos quase... juntos. | 4,5 s |
| 8 | Seraphine | Vamos. Por favor... vamos. | [whispers, pleading] Vamos. Por favor... vamos. | 2,5 s |

**Duração total:** ~32 s

### Capítulo 9 — depois da Toupeira-Titã Soterrada

| # | Personagem | Legenda | Texto para o Eleven v4 | Duração |
|---|---|---|---|---|
| 1 | Narrador | A Toupeira-Titã desmorona, e atrás dela surge uma parede de pedra viva, coberta de runas douradas. O Selo. | [solemn, awed] A Toupeira-Titã desmorona, e atrás dela surge uma parede de pedra viva, coberta de runas douradas. [pause] O Selo. | 8,5 s |
| 2 | Orina | Uma rachadura de ponta a ponta. Olhem as bordas... estão viradas para baixo. | [focused, slow] Uma rachadura de ponta a ponta. Olhem as bordas... estão viradas para baixo. | 5,5 s |
| 3 | Lyra | E isso quer dizer o quê, Orina? | [anxious, fast] E isso quer dizer o quê, Orina? | 3 s |
| 4 | Orina | Que ninguém forçou o Selo vindo de baixo. Ele foi quebrado daqui. Do nosso lado. | [slow, each sentence heavier] Que ninguém forçou o Selo vindo de baixo. Ele foi quebrado daqui. [pause] Do NOSSO lado. | 6,5 s |
| 5 | Kael | Do nosso lado? Só sacerdotes entram no santuário das raízes. E quem já serviu o Submundo. | [cold, low] Do nosso lado? Só sacerdotes entram no santuário das raízes. [pointed] E quem já serviu o Submundo. | 8 s |
| 6 | Vex | Fala logo, guerreiro. Você acha que fui eu. | [tired, no irony] Fala logo, guerreiro. Você acha que fui eu. | 3,5 s |
| 7 | Kael | Acho que alguém aqui mentiu. E você é quem tem mais prática. | [hard, low] Acho que alguém aqui mentiu. E você é quem tem mais prática. | 6 s |
| 8 | Narrador | Seraphine não disse nada. Sob o manto, suas mãos apertavam algo pequeno e frio. | [whispers, slow] Seraphine não disse nada. Sob o manto, suas mãos apertavam algo pequeno... e frio. | 6,5 s |

**Duração total:** ~48 s

### Capítulo 10 — depois do Morcego Prismático (fim do ato 2)

| # | Personagem | Legenda | Texto para o Eleven v4 | Duração |
|---|---|---|---|---|
| 1 | Narrador | O Morcego Prismático se estilhaça em mil luzes falsas. E o Selo, enfim, se abre por inteiro. | [epic, intense] O Morcego Prismático se estilhaça em mil luzes falsas. E o Selo, enfim... se abre por inteiro. | 8 s |
| 2 | Lyra | Está aberto! Aberto! Tem coisa subindo lá de baixo, muita coisa! | [panicked, very fast] Está aberto! Aberto! Tem coisa subindo lá de baixo, muita coisa! | 4 s |
| 3 | Kael | E você, espião. Ou diz agora o que sabe, ou eu arranco de você. | [restrained rage, low and slow] E você, espião. Ou diz agora o que sabe... ou eu arranco de você. | 7 s |
| 4 | Vex | Eu digo o que sei. Quem abriu isso não precisou de força. Precisou de uma chave. | [completely serious, slow] Eu digo o que sei. Quem abriu isso não precisou de força. [pause] Precisou de uma CHAVE. | 6,5 s |
| 5 | Orina | Uma chave... Que tipo de chave? | [intrigued, suspicious] Uma chave... Que tipo de chave? | 3 s |
| 6 | Seraphine | A Árvore diz para subirmos até a Copa. Se reacendermos o coração dela, o Selo se fecha. | [quick, taking charge, too firm] A Árvore diz para subirmos até a Copa. Se reacendermos o coração dela, o Selo se fecha. | 8 s |
| 7 | A Voz | Isso, criança. Traga-os até mim. | [whispers, pleased] Isso, criança. Traga-os até mim. | 3,5 s |
| 8 | Narrador | Assim termina o segundo ato. O caminho agora é para cima, até a Copa Celeste. E alguém, entre os cinco, já não dorme em paz. | [epic, then fading to a whisper] Assim termina o segundo ato. O caminho agora é para cima, até a Copa Celeste. [whispers] E alguém, entre os cinco, já não dorme em paz. | 11,5 s |

**Duração total:** ~52 s
