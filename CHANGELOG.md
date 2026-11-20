# Changelog

Todas as mudanças notáveis do Infinity Grove ficam neste arquivo.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e as versões seguem o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [0.8.0] - 2026-11-20

Cajado da Consciência Negra (`black-awareness-staff`): presente do Dia da Consciência Negra para quem entra no jogo em 20 de novembro.

### Adicionado

- Toda conta que entra no jogo em 20 de novembro (horário de São Paulo) recebe, uma única vez, um **Cajado da Consciência Negra** na mochila, com um aviso na tela. O cajado vem mesmo com a mochila cheia.
- É uma arma lendária de verdade, com atributos sorteados, e pode ser refinada, sorteada de novo e vendida como qualquer outra.
- Enquanto um herói usa o cajado, cada golpe dele contra monstros de TREVAS causa o triplo do dano (+200%): clique, clique automático, habilidades, sangramento e tiro mirado. Aliados que usam o cajado também ganham o bônus.
- O cajado tem ícone, nome e a linha do efeito em todas as telas de equipamento.

## [0.7.0] - 2026-11-20

Lacaios dos minichefes (`miniboss-adds`): a partir do capítulo 11, cada minichefe luta ao lado de dois lacaios, e agora você escolhe quem atacar.

### Adicionado

- Do capítulo 11 ao 15, todo minichefe (na campanha e no Rever chefes) entra em campo com 2 **Lacaios**. Cada lacaio vivo aumenta a defesa do minichefe (+30 no capítulo 11, +35, +40, +45 e +50 até o capítulo 15, no máximo 90 de defesa).
- Escolha o alvo com um clique no monstro. O clique automático e os golpes dos aliados atingem o alvo escolhido; o alvo marcado aparece na ficha do inimigo. Se o lacaio alvo morre, o alvo volta para o minichefe.
- Cada lacaio tem sua barra de vida e some com um esmaecer rápido ao morrer.

### Alterado

- Toda habilidade de dano, efeito enfraquecedor, dano por tempo e tiro mirado atinge todos os monstros vivos da luta, e os números aparecem em cada um. Um efeito em um monstro não termina quando você acerta outro.
- Vencer o minichefe termina a luta mesmo com lacaios vivos; lacaios não dão recompensa. O tempo limite continua valendo como antes.
- Capítulos 1 a 10, monstros comuns e chefes de capítulo continuam exatamente como antes.

## [0.6.0] - 2026-11-19

Equipe de heróis (`hero-team`): do capítulo 5 em diante, seus heróis lutam ao seu lado.

### Adicionado

- Botão **Equipe** no menu lateral e tela **Equipe**: o líder mais até 4 aliados, escolhidos entre os heróis que você já tem. Escolha, troque, remova um aliado ou torne-o líder.
- Aliados golpeiam sozinhos uma vez por segundo, com o elemento do líder. O dano deles cresce com as estrelas e o equipamento de cada herói, e aparece como um número azul no campo de batalha.
- Os aliados aparecem no campo ao lado do líder e atacam a cada golpe.
- Quatro vagas de aliado, compradas com ouro (1, 2, 3 e 4 de ouro). Cada vaga é liberada ao vencer o chefe dos capítulos 5, 6, 7 e 8.
- Cada herói traz uma passiva enquanto luta como aliado: **Guarda do Baluarte** (Kael, +5 s no tempo dos chefes), **Olho do Falcão** (Lyra, +10 de chance de crítico), **Erosão Arcana** (Orina, -15 de defesa dos inimigos), **Lâminas Sombrias** (Vex, -15 de resistência a crítico dos inimigos) e **Graça da Aurora** (Seraphine, +25% de dano da equipe).
- O painel de atributos do Equipamento e a linha do inimigo já contam as passivas ativas.

### Alterado

- Trocar de líder coloca o líder anterior no lugar do novo líder dentro da equipe.
- Quem ainda não chegou ao capítulo 5 joga exatamente como antes.

## [0.5.0] - 2026-11-19

Dano unificado (`unified-damage`): um só tipo de dano e uma só defesa.

### Adicionado

- A linha do inimigo mostra uma única ficha **Defesa** no lugar de "Defesa física" e "Defesa mágica".

### Alterado

- Todo golpe (clique, habilidade, tiro mirado e dano por tempo) enfrenta a mesma defesa do inimigo e recebe os mesmos bônus.
- **Prisão de Espinhos** agora aumenta todo o dano que o inimigo recebe em 25% (cresce com o nível da habilidade); um clique de Orina sob a Prisão causa 25% a mais.
- **Bênção da Grande Árvore** multiplica todo o dano por 1,3 enquanto dura, inclusive as habilidades de Orina e Seraphine; o bônus de +25% no clique continua.
- Os talentos de quebra de defesa viraram um só talento, **Quebra de defesa**, em cada grau (27 talentos no total).
- O bônus de líder de Orina passou a dizer "+20% de dano total." (ainda sem efeito no jogo, marcado como "em breve").
- Textos de dano não falam mais em físico, mágico, "Poder Arcano" ou "Força".

### Removido

- Os talentos de quebra de defesa mágica. Os pontos de talento gastos neles voltam para você.

## [0.4.1] - 2026-11-18

Versão do jogo na tela (`game-version`).

### Adicionado

- Um rótulo discreto no canto inferior direito da janela mostra a versão do jogo (por exemplo `v0.4.1`) na tela de carregamento, na abertura, no login e na batalha. Ele não cobre botões nem textos, não aceita cliques e fica fora da área do jogo, também no celular.

## [0.4.0] - 2026-11-18

Mochila com cartas de herói e **Fundir tudo** (`hero-bag-cards`).

### Adicionado

- A **Mochila** mostra uma carta por herói, com moldura de madeira, prata ou ouro conforme a melhor estrela, selo **Fundir** quando há fusão possível e fichas com as camadas que você tem. Heróis ainda não encontrados aparecem em cinza.
- Ao abrir uma carta, a escada de fusão mostra cada camada com a barra de progresso e o botão da fusão, e o botão **Fundir tudo** funde todas as camadas de uma vez, com prévia do antes e do depois e a lista das habilidades que subiram.
- Tela inicial animada no lugar da tela preta de clique para começar.

### Alterado

- A fusão de heróis saiu do trilho lateral e passou para a Mochila; o trilho agora tem seis botões.
- As gemas de raridade das peças ficam centradas na borda superior e maiores, com as pontas das lendárias sem se tocar.

## [0.3.1] - 2026-11-17

Correção em **Rever chefes** (`boss-replay-chapters`).

### Corrigido

- Em **Rever chefes**, fechar a janela enquanto um capítulo ainda carrega não deixa mais as fichas de capítulo desativadas ao reabrir: a janela volta no capítulo atual com todas as fichas ativas, e a resposta atrasada do capítulo anterior é ignorada.

## [0.3.0] - 2026-11-17

Visual novo em todo o jogo, o tema Grove (`ui-redesign`), e a escolha do capítulo em **Rever chefes** (`boss-replay-chapters`).

### Adicionado

- Tema Grove em todas as telas, no computador e no celular: pergaminho e madeira, títulos em fonte Cinzel, botões em madeira e brasa, moedas metálicas, carregamento em dourado e brasa, janelas de heróis, fusão, equipamento, talentos e mapa no mesmo estilo.
- Botão redondo de auto clique ao lado do botão de fazenda, com uma janela própria, e a tecla **A** para abri-la. A tecla é ignorada enquanto você digita em campos de texto.
- Anel que mostra o tempo que resta do chefe, barra de vida emoldurada e números de dano dourados.
- Fichas dos inimigos com o elemento e o atributo, o aviso do elemento que vence o inimigo e, ao passar o mouse sobre uma peça, a comparação com a peça que o líder usa.
- Ícones novos para os talentos de clique direto e de combo, e para os graus 2 e 3.
- Em **Rever chefes**, uma fileira **Capítulo** com uma ficha por capítulo alcançado (1 até o 15). A ficha do capítulo atual tem um ponto. Escolher outro capítulo mostra o mapa dele, todo concluído.
- Dá para rever o miniboss e o chefe de um capítulo anterior com a vida, a defesa, o elemento e o tempo daquele capítulo. As cartas e as peças vêm com a raridade desse capítulo, e as 10 vitórias diárias valem para todos os capítulos.
- A placa da luta de um capítulo anterior mostra o capítulo em uma segunda linha, e o relógio do chefe fica ao lado dela.
- Servidor: `GET /farm` e `POST /farm/outcome` aceitam o parâmetro `chapter` (capítulos acima do atual são recusados com 409).

### Alterado

- Todas as telas foram redesenhadas no tema Grove; o jogo em si (regras, números e fluxo) não mudou.
- Em **Rever chefes**, a fileira de fichas se mantém em uma linha no celular.

### Corrigido

- As paradas do mapa de chefes agora ficam sobre as pedras pintadas.
- O nome do líder na carta de batalha quebra a linha em vez de vazar; a arte e o texto da dica de habilidade ficam dentro dela; as cinco cartas de herói têm o mesmo tamanho; as miniaturas das habilidades não têm mais borda magenta.
- Textos de talentos e botões ficam legíveis sobre o pergaminho (tinta escura nos ramos).

### Interno (sem mudança para o jogador)

- Correções só de teste, sem nova versão: o teste do limite do COMBO 2 não depende mais da velocidade da máquina (`caa2490`) e os testes do tempo limite do chefe do capítulo 2 e do miniboss fixam o limite, não o relógio na tela (`6ff9ee8`, `6f69802`).

## [0.2.0] - 2026-11-14

A campanha vai até o capítulo 15 (`campaign-chapters`). A feature foi aceita pelo dono com uma lacuna de teste em aberto, depois fechada sem nova versão (ver "Alterado"): as definições dos capítulos 1 a 5 agora estão fixadas em teste.

### Adicionado

- Capítulos 6 a 15 na campanha: a vida dos monstros dobra a cada capítulo a partir do 6, e as defesas sobem 3 por capítulo, até o limite de 80. Os capítulos 1 a 5 mantêm os números de antes.
- Números grandes abreviados na tela: o texto de vida e os números de dano passam a usar K, M, B e T a partir de 1000 (por exemplo `1.5B/3B`).
- Novas faixas de moedas dos monstros, que sobem a cada capítulo, para que uma primeira jornada normal pague as vagas de aliados (1, 2, 3 e 4 de ouro).

### Alterado

- A vida dos monstros agora é guardada em 64 bits, então os capítulos altos não estouram mais o limite.
- As colunas antigas de vida de 32 bits foram apagadas do banco (migração V10): o servidor usa só as colunas de 64 bits. Depois disso não dá mais para voltar a um servidor anterior a esta mudança.
- O botão **Resetar conta** paga cristais pelo capítulo alcançado, sem o limite de 5: até 15 cristais (`Resetar conta (+15 cristais)`).
- As moedas dos capítulos 1 a 5 foram movidas para as novas faixas.
- Reforço de testes, sem mudança para o jogador: todas as fases e o elemento do chefe dos capítulos 1 a 5 agora têm teste que falha se mudarem. Feito depois da versão, sem nova tag, porque só tocou testes e documentação.

### Corrigido

- A fazenda de um jogador que já completou o capítulo 5 não falha mais: o próximo capítulo é aberto antes de a fazenda ler o jogador.

## [0.1.0] - 2026-10-31

Primeira versão marcada. Traz a venda de equipamentos em lote (`bulk-sell`).

### Adicionado

- Botão **Vender várias** ao lado de **Mochila** na tela Equipamento: o jogador marca várias peças da mochila e vende todas de uma vez. Vender N peças custa N + 3 cliques, em vez de cerca de 3 cliques por peça.
- Modo de seleção com barra fixa que mostra `Selecionadas: <k> · Total: <valor>`, os botões **Vender selecionadas** e **Cancelar**, e uma marca de seleção (✓) em cada peça escolhida. As peças que estão equipadas ficam bloqueadas no modo de seleção.
- Cinco botões de raridade (**Comum**, **Incomum**, **Raro**, **Épico**, **Lendário**) que marcam de uma vez todas as peças da mochila daquela raridade, e desmarcam quando todas já estavam marcadas. Vender todas as peças comuns custa 4 cliques, qualquer que seja o número delas.
- Confirmação antes de vender (`Vender <k> peças por <valor>?`, com **Sim, vender** e **Não**) e um aviso com o recibo depois da venda (`<n> peças vendidas por <valor>`).
- Nova rota do servidor `POST /equipment/sell`, que vende o lote inteiro em uma única operação: ou todas as peças são vendidas e pagas uma vez, ou nada muda.

### Alterado

- Quando uma venda em lote falha, a mochila é lida de novo, a mensagem de erro aparece e o modo de seleção continua, só com as peças escolhidas que ainda existem. Assim o jogador tenta de novo sem marcar tudo outra vez.
- Fechar a janela durante o modo de seleção encerra o modo; uma resposta de venda que chega depois do fechamento atualiza só a carteira e não desenha nada.

### Corrigido

- A dica da peça não aparece mais no modo de seleção.
- Os blocos dos heróis não se mexem mais quando o modo de seleção abre.
- Os contornos das peças marcadas ficam separados uns dos outros no modo de seleção.

[0.6.0]: https://github.com/woodriveer/infinity-grove-phaser/releases/tag/v0.6.0
[0.5.0]: https://github.com/woodriveer/infinity-grove-phaser/releases/tag/v0.5.0
[0.3.1]: https://github.com/woodriveer/infinity-grove-phaser/releases/tag/v0.3.1
[0.3.0]: https://github.com/woodriveer/infinity-grove-phaser/releases/tag/v0.3.0
[0.2.0]: https://github.com/woodriveer/infinity-grove-phaser/releases/tag/v0.2.0
[0.1.0]: https://github.com/woodriveer/infinity-grove-phaser/releases/tag/v0.1.0
