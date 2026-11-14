# Changelog

Todas as mudanças notáveis do Infinity Grove ficam neste arquivo.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e as versões seguem o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [0.2.0] - 2026-11-14

A campanha vai até o capítulo 15 (`campaign-chapters`). A feature foi aceita pelo dono com uma lacuna de teste em aberto: as definições por fase dos capítulos 2 a 5 não estão fixadas em teste (só teste, sem defeito conhecido). As tarefas T13 e T14 (colunas antigas de vida) não passaram por verificação independente.

### Adicionado

- Capítulos 6 a 15 na campanha: a vida dos monstros dobra a cada capítulo a partir do 6, e as defesas sobem 3 por capítulo, até o limite de 80. Os capítulos 1 a 5 mantêm os números de antes.
- Números grandes abreviados na tela: o texto de vida e os números de dano passam a usar K, M, B e T a partir de 1000 (por exemplo `1.5B/3B`).
- Novas faixas de moedas dos monstros, que sobem a cada capítulo, para que uma primeira jornada normal pague as vagas de aliados (1, 2, 3 e 4 de ouro).

### Alterado

- A vida dos monstros agora é guardada em 64 bits, então os capítulos altos não estouram mais o limite.
- As colunas antigas de vida de 32 bits foram apagadas do banco (migração V10): o servidor usa só as colunas de 64 bits. Depois disso não dá mais para voltar a um servidor anterior a esta mudança.
- O botão **Resetar conta** paga cristais pelo capítulo alcançado, sem o limite de 5: até 15 cristais (`Resetar conta (+15 cristais)`).
- As moedas dos capítulos 1 a 5 foram movidas para as novas faixas.

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

[0.2.0]: https://github.com/woodriveer/infinity-grove-phaser/releases/tag/v0.2.0
[0.1.0]: https://github.com/woodriveer/infinity-grove-phaser/releases/tag/v0.1.0
