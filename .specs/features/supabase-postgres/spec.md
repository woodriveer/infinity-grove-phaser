# Supabase Postgres Specification

> Spec escrita em português a pedido do orquestrador (AD-007 cobre o texto do jogador; as specs anteriores estão em inglês). Os títulos de seção e as palavras-chave EARS (WHEN, THEN, IF, WHILE, WHERE, SHALL, The) ficam em inglês porque o validador `validate_spec.py` as lê.

## Perguntas em aberto (responder antes da aprovação)

Cada pergunta tem um padrão recomendado. As tarefas foram escritas sobre esse padrão. As perguntas Q1 e Q2 bloqueiam só a virada (Fase 6), não o código.

| # | Pergunta | Padrão recomendado | O que muda se a resposta for outra |
| --- | --- | --- | --- |
| Q1 | Qual é o host exato do Session pooler do projeto `jnqlrdnwwqslihncszej` (Dashboard > Connect > Session pooler, `aws-<N>-<região>.pooler.supabase.com`)? A região foi escolhida quando o projeto foi criado e não muda depois. | O dono copia o host do dashboard para o `.env` na virada. Ninguém escreve o host no repositório. | Nada no código. Se a região ficar longe do Brasil, cada consulta fica mais lenta (ver Riscos no design). |
| Q2 | Em que plano o projeto está (Free/Nano ou pago/Micro)? Qual é o "Pool Size" em Database Settings > Connection pooling? | Free/Nano com pool size 15 (o padrão do Nano e do Micro). Hikari com 5 conexões por slot: no pior caso, 2 slots x 5 = 10. | Com um pool size abaixo de 12, o Hikari cai para `floor((pool size - 2) / 2)` por slot (T8). No Free, o projeto pausa depois de 7 dias sem atividade e não tem backup gerenciado (TD-003). |
| Q3 | O banco local fica como reserva para voltar atrás? Por quanto tempo? | Sim. O volume `backend_postgres_data` fica intacto por 30 dias depois da virada. O `postgres` e o `pgadmin` passam para o profile `local-db`. Voltar perde o que foi gravado no Supabase depois da virada. | Se não ficar: a volta (US-6, AC 5) deixa de existir e o volume pode ser apagado depois do PASS. |
| Q4 | Quando é a janela de manutenção? O jogo fica fora do ar enquanto o `publish.sh` está parado. | Uma janela de 30 minutos escolhida e avisada pelo dono. A cópia de um banco pequeno leva poucos minutos. | Nada no código; só a data da T15. |
| Q5 | Desligamos a Data API (REST/GraphQL) do projeto e revogamos os grants de `anon`, `authenticated` e `service_role` nas tabelas do jogo? | Sim às duas. Sem isso, qualquer pessoa com a chave pública do projeto lê `users` (hashes de senha) e `refresh_tokens` pela REST, porque as tabelas não têm RLS. | Se a Data API ficar ligada, o REVOKE (SUPA-08) continua sendo a única barreira. Não recomendado. |
| Q6 | A senha do banco no Supabase tem espaço, `#`, `$`, aspas ou `\`? | Trocar a senha no dashboard por uma de 24 letras e números antes da virada. O `env_file` do Compose interpola `$` e corta em `#`, então o `.env` recusa esses caracteres (SUPA-02). | Aceitar esses caracteres exigiria outro jeito de entregar a senha ao container. Fora do escopo. |
| Q7 | Quem executa as tarefas dos scripts de deploy (`deploy/**`, `publish.sh`, `start.sh`, `docker-compose.yml`)? O `CLAUDE.md` só fala de `backend/`, `game/` e testes. | `kotlin-backend-dev`, porque esses scripts sobem o backend e o compose fica em `backend/`. A virada (T15, T16) fica com o `gitops`, com o dono no teclado. | Só o campo Owner das tarefas. |
| Q8 | A seção "Deploy" do `CLAUDE.md` diz que o `publish.sh` sobe o Postgres. Quem atualiza? Os agentes não editam o `CLAUDE.md`. | O dono edita depois da virada, com o texto sugerido no design (seção "CLAUDE.md"). | Nada no código. |

## Problem Statement

O banco do jogo é o Postgres local do Docker (`backend/docker-compose.yml`, serviço `postgres`). Ele só existe na máquina do dono, e os dois slots do blue-green dependem dele (`depends_on: postgres`). Mais tarde (outra feature) o backend vai para o Render, que só sai por IPv4. Por isso o banco precisa antes ir para um Postgres gerenciado que o Render alcance. Esta feature leva o banco para o Postgres do projeto Supabase `jnqlrdnwwqslihncszej` pelo Session pooler (IPv4, porta 5432), copia os dados atuais (jogadores, progresso, histórico do Flyway) e muda o deploy para ler as credenciais de um `.env` que nunca é versionado.

## Goals

- [ ] Depois da virada, os dois slots do blue-green usam o Postgres do Supabase pelo Session pooler. Nenhum serviço do deploy depende do `postgres` local.
- [ ] Cada linha de cada tabela de `public` do banco local está no Supabase. A contagem por tabela, o valor das sequências e o histórico do Flyway são iguais dos dois lados (`Verificação OK`).
- [ ] A senha do banco não aparece em nenhum arquivo versionado, argumento de comando, log ou relatório.
- [ ] Os testes do backend continuam num Postgres descartável do Testcontainers e nunca abrem conexão com o Supabase.
- [ ] Um `.env` errado nunca põe um backend no ar: o `publish.sh` não sobe e o watcher pausa com a mensagem do erro.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Supabase Auth, RLS, Edge Functions, `supabase-js` no jogo, chaves `anon`/`service_role` no código | Pedido do dono. O backend continua o único cliente do banco. |
| Levar o backend para o Render | Feature seguinte. Esta deixa o banco pronto para um host só com IPv4. |
| Copiar de volta para o banco local o que foi gravado no Supabase depois da virada | A volta (US-6) usa o banco local como estava na virada (Q3). |
| Fallback automático para o banco local quando o Supabase cai | Dois bancos recebendo escrita dividem os dados. O backend usa só o banco do `.env`. |
| Backup periódico do Supabase | Dívida TD-003. A virada guarda um dump em `backups/`. |
| Verificar o certificado do servidor (`sslmode=verify-full`) | Dívida TD-004. `sslmode=require` cifra a conexão, que é o pedido. |
| Mudança visível para o jogador | Nenhuma tela muda, então não há revisão do `ui-artist` nem e2e novo. |
| Schema próprio para o jogo (por exemplo `game`) | `public` fica (ver Assumptions). A exposição pela Data API se resolve com Q5. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Tipo de conexão | Session pooler `aws-<N>-<região>.pooler.supabase.com:5432`, usuário `postgres.jnqlrdnwwqslihncszej`, banco `postgres`, `sslmode=require` | A conexão direta só tem IPv6. O Transaction pooler (6543) quebra o Flyway e os prepared statements do JDBC. | y (dono) |
| Onde ficam os segredos | `.env` na raiz do repositório (já está no `.gitignore`), com `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` e `SPRING_DATASOURCE_PASSWORD`. Os scripts leem os valores pelo nome e nunca os imprimem. | Pedido do dono. O Spring já lê esses três nomes. | y (dono) |
| Formato do `.env` | Uma linha `NOME=valor` por variável, sem aspas. Linhas vazias e linhas que começam com `#` são ignoradas. O valor é o resto da linha depois do primeiro `=`, sem `trim` | É o formato que o `env_file` do Compose lê igual ao nosso parser quando o valor não tem espaço, `#`, `$`, aspas nem `\` | n |
| Caracteres recusados nos três valores | Espaço ou tab, `#`, `$`, `"`, `'`, `` ` ``, `\` | O Compose interpola `$` e trata `#` como comentário. Nesses casos o container receberia outro valor (Q6). | n |
| Pool de conexões | `spring.datasource.hikari.maximum-pool-size: 5` por slot. Durante a troca rodam 2 slots, total 10, abaixo do pool size 15 do Session pooler | No modo session, cada cliente ocupa uma conexão do servidor até fechar. Sobram 5 para o `psql` da virada e o dashboard (Q2). | n |
| Como o slot recebe o `.env` | `env_file: [{ path: ../.env, required: false }]` em `backend-blue` e `backend-green`. `SPRING_DATASOURCE_URL` sai de `environment` e o `depends_on: postgres` sai | O Compose lê o arquivo sem passar a senha pela linha de comando nem pela interpolação. `required: false` deixa `stop` e `rm` funcionarem sem `.env`; quem barra é a checagem (SUPA-02). | n |
| Postgres e pgAdmin locais | Ficam no profile `local-db`. O `start.sh` usa `--profile local-db`. O `publish.sh` só sobe o `postgres` quando o `.env` aponta para o host `postgres` | O dev local continua igual, a volta atrás continua possível e o deploy não sobe mais o banco local por engano | n |
| Modos aceitos pelo `.env` | `local` (host `postgres`, o serviço do compose) e `supabase` (host `aws-<N>-<região>.pooler.supabase.com`). Qualquer outro host é recusado | São os dois destinos desta feature. O Render ganha o seu na feature dele. | n |
| Erro no `.env` durante o watcher | O tick registra `Deploy pausado: ...` e não muda `handled`, então o mesmo commit é tentado de novo no próximo poll | Uma configuração errada não é culpa do commit, e um deploy falho nunca é retentado (blue-green-deploy) | n |
| Schema do jogo | Fica em `public` | Flyway, Hibernate, Testcontainers e o dump já usam `public`. A exposição pela Data API se fecha com o REVOKE (SUPA-08) e com a Data API desligada (Q5). | n |
| Schemas do Supabase | A cópia lê só `public` do banco local e escreve só em `public` do Supabase. Nenhum comando cita `auth`, `storage`, `extensions`, `realtime`, `graphql`, `vault` ou `supabase_*` | Pedido do dono | y (dono) |
| Ferramenta da cópia | `pg_dump --format=custom` do `public` local e `pg_restore --single-transaction --exit-on-error` no Supabase, as duas em containers `postgres:<versão principal do Supabase>` na rede `backend_default`, pelo Session pooler | O Session pooler aceita sessão completa e IPv4. O cliente na versão do servidor de destino lê um dump de 16. Uma falha desfaz tudo e o `public` volta a ficar vazio. | n |
| Versões | Local `postgres:16`. Os testes já usam `postgres:17`. A cópia exige Supabase 16 ou mais e para com uma mensagem se for menor | `pg_dump` mais novo lê um servidor mais antigo; restaurar num servidor mais antigo não é suportado | n |
| Parar as escritas | Parar o `publish.sh` (Ctrl+C para watcher, túnel, proxy e slots) e remover os containers dos slots antes da cópia | Sem slot rodando, ninguém grava. Um slot parado guarda o ambiente antigo, e um `./deploy.sh --rollback` o ligaria no banco local. | n |
| Voltar atrás | `cp .env.example .env` (modo local) e `./publish.sh`. O banco local está como estava na virada. | É o caminho mais curto e não toca o Supabase | n |
| Migração de um commit que falha | Continua valendo AD-016: a migração do Flyway roda no banco compartilhado (agora o Supabase de produção) antes da regressão e não é desfeita quando o deploy falha | Flyway não tem down migration. Com o banco gerenciado, o dano chega à produção igual. | y (AD-016) |
| Onde fica o dump | `backups/infinity_grove-<AAAAMMDD>T<HHMMSS>Z.dump` e `.list`, com `backups/` no `.gitignore`. O dono apaga quando quiser. | O dump tem hashes de senha e precisa ser a cópia de segurança da virada (TD-003) | n |
| Idioma das mensagens | As mensagens dos módulos Node (`deploy/lib`, `deploy/db`, `deploy/dbcheck.mjs`) ficam em português, como os logs do watcher. As linhas `echo` do `publish.sh` ficam em inglês, como o resto do arquivo. | Segue o idioma de cada arquivo | n |
| Testes de integração | Continuam no `PostgreSQLContainer("postgres:17")` com `@ServiceConnection`, que tem precedência sobre `spring.datasource.*` e sobre as variáveis de ambiente | Pedido do dono. Um teste prova isso (SUPA-10). | y (dono) |
| Responsáveis | Scripts e compose: `kotlin-backend-dev`. Backend: `kotlin-backend-dev`. Teste de isolamento: `test-engineer`. Virada: `gitops` com o dono | Q7 | n |

**Open questions:** Q1 a Q8 estão no topo, cada uma com o padrão escolhido. Q1 e Q2 bloqueiam só a Fase 6 (virada); o resto das tarefas roda sobre os padrões.

### Dívidas registradas

- **TD-003**: no plano Free o Supabase não faz backup gerenciado. A única cópia de segurança é o dump da virada em `backups/`. Fechar com backup periódico ou com o plano Pro.
- **TD-004**: `sslmode=require` cifra a conexão mas não verifica o certificado do servidor. Fechar com `sslmode=verify-full` e o certificado raiz do projeto.

---

## User Stories

### P1: O backend fala com o Supabase pelo Session pooler ⭐ MVP

**User Story**: Como dono, quero que o backend use o Postgres do Supabase sem mudar o código das regras, para que o banco saia da minha máquina e um host só com IPv4 consiga alcançá-lo.

**Why P1**: É a feature.

**Acceptance Criteria**:

1. The backend SHALL abrir no máximo 5 conexões de banco por processo (`spring.datasource.hikari.maximum-pool-size: 5` no `application.yaml`).
2. The backend SHALL ler URL, usuário e senha do banco de `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` e `SPRING_DATASOURCE_PASSWORD`. Os padrões `localhost:5432/infinity_grove` e `infinity`/`infinity` do `application.yaml` continuam para o `bootRun` local.
3. WHEN `checkDatabaseEnv` recebe `SPRING_DATASOURCE_URL=jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require`, `SPRING_DATASOURCE_USERNAME=postgres.jnqlrdnwwqslihncszej` e uma senha sem caractere recusado THEN it SHALL devolver `{ ok: true, mode: 'supabase', errors: [] }`.
4. WHEN `checkDatabaseEnv` recebe `jdbc:postgresql://postgres:5432/infinity_grove` com `infinity`/`infinity` THEN it SHALL devolver `{ ok: true, mode: 'local', errors: [] }`.
5. WHEN o host do pooler tem outro índice ou região (`aws-1-us-east-1.pooler.supabase.com`) ou `sslmode` é `verify-ca` ou `verify-full` THEN `checkDatabaseEnv` SHALL aceitar a configuração.
6. IF uma das três variáveis falta ou está vazia THEN `checkDatabaseEnv` SHALL incluir `falta <NOME> no .env` para cada uma, na ordem URL, USERNAME, PASSWORD.
7. IF um dos três valores contém espaço, tab, `#`, `$`, `"`, `'`, `` ` `` ou `\` THEN `checkDatabaseEnv` SHALL incluir `<NOME> contém espaço, #, $, aspas ou barra invertida`.
8. IF a URL não tem a forma `jdbc:postgresql://<host>:<porta>/<banco>[?parâmetros]` THEN `checkDatabaseEnv` SHALL incluir `SPRING_DATASOURCE_URL não é jdbc:postgresql://<host>:<porta>/<banco>` e devolver `mode: null`.
9. IF a URL traz o parâmetro `user` ou `password` THEN `checkDatabaseEnv` SHALL incluir `SPRING_DATASOURCE_URL não pode trazer usuário ou senha; use SPRING_DATASOURCE_USERNAME e SPRING_DATASOURCE_PASSWORD`.
10. IF o host é `db.<ref>.supabase.co` THEN `checkDatabaseEnv` SHALL incluir `a conexão direta do Supabase (db.<ref>.supabase.co) é só IPv6; use o Session pooler (aws-N-<região>.pooler.supabase.com:5432)` e devolver `mode: null`.
11. IF o host é do pooler e a porta é 6543 THEN `checkDatabaseEnv` SHALL incluir `a porta 6543 é o Transaction pooler, que quebra o Flyway; use a porta 5432 (Session pooler)`; IF a porta é outra, diferente de 5432, THEN it SHALL incluir `o Session pooler do Supabase usa a porta 5432, não <porta>`.
12. IF o host é do pooler e o banco não é `postgres` THEN `checkDatabaseEnv` SHALL incluir `o banco do Supabase se chama postgres, não <banco>`.
13. IF o host é do pooler e `sslmode` falta ou não é `require`, `verify-ca` ou `verify-full` THEN `checkDatabaseEnv` SHALL incluir `SPRING_DATASOURCE_URL precisa de sslmode=require`.
14. IF o host é do pooler e o usuário não é `postgres.jnqlrdnwwqslihncszej` THEN `checkDatabaseEnv` SHALL incluir `SPRING_DATASOURCE_USERNAME do Session pooler é postgres.jnqlrdnwwqslihncszej`.
15. IF o host não é `postgres`, nem `db.<ref>.supabase.co`, nem `aws-<N>-<região>.pooler.supabase.com` THEN `checkDatabaseEnv` SHALL incluir `o host <host> não é o Session pooler do Supabase nem o postgres local` e devolver `mode: null`.
16. IF o arquivo `.env` não existe na raiz THEN `loadDatabaseEnv` SHALL devolver `{ ok: false, mode: null, errors: ['arquivo .env não encontrado na raiz do repositório'] }`.
17. The `checkDatabaseEnv` SHALL nunca pôr o valor de `SPRING_DATASOURCE_PASSWORD` em uma mensagem. As mensagens citam só host, porta e banco.

**Independent Test**: `node --test deploy/lib/databaseEnv.test.mjs` passa com um caso por regra acima. `cd backend && ./gradlew test --tests '*DatabasePoolConfigIT'` lê `maximumPoolSize` 5.

---

### P1: O deploy lê o banco do `.env` ⭐ MVP

**User Story**: Como dono, quero que `publish.sh` e o watcher subam os slots com o banco do `.env` e se recusem a subir com um `.env` errado, para que um erro de configuração nunca ponha um backend no ar nem perca um commit.

**Why P1**: Sem isso os slots continuam presos ao `postgres` local.

**Acceptance Criteria**:

1. The serviços `backend-blue` e `backend-green` do `backend/docker-compose.yml` SHALL receber as variáveis do `.env` da raiz por `env_file` (`path: ../.env`, `required: false`), sem `SPRING_DATASOURCE_URL` em `environment` e sem `depends_on`.
2. The serviços `postgres` e `pgadmin` SHALL ficar só no profile `local-db`.
3. WHEN o `start.sh` roda THEN it SHALL subir e parar o compose com `--profile local-db` (`docker compose --profile local-db up -d --wait` e `docker compose --profile local-db stop`).
4. WHEN `node deploy/dbcheck.mjs` roda com um `.env` válido THEN it SHALL escrever só o modo (`local` ou `supabase`, sem quebra de linha) na saída padrão e sair com 0.
5. IF o `.env` é inválido ou falta THEN `node deploy/dbcheck.mjs` SHALL escrever `Configuração do banco inválida: <erros separados por "; ">` na saída de erro, nada na saída padrão, e sair com 1.
6. IF `deploy/dbcheck.mjs` sai com 1 THEN o `publish.sh` SHALL sair com 1 antes de subir container, túnel ou watcher.
7. WHERE o modo é `local`, o `publish.sh` SHALL subir o serviço `postgres` (profile `local-db`) antes do slot ativo; WHERE o modo é `supabase`, it SHALL subir só `dozzle` e o slot ativo, sem o `postgres`.
8. IF `loadDatabaseEnv` devolve `ok: false` num tick THEN o watcher SHALL registrar `Deploy pausado: <erros separados por "; ">; nova tentativa em 60 s`, sem `git fetch`, sem pegar o lock, sem deploy e sem mudar `.deploy-state`.
9. WHEN o `.env` volta a ser válido THEN o próximo tick do watcher SHALL fazer o deploy do commit que esperava, como antes desta feature.

**Independent Test**: com um `.env` de porta 6543, `./publish.sh` termina com `Configuração do banco inválida: a porta 6543 é o Transaction pooler, que quebra o Flyway; use a porta 5432 (Session pooler)` e nenhum container novo aparece em `docker ps`. Com o watcher no ar e o `.env` apagado, o log mostra `Deploy pausado: arquivo .env não encontrado na raiz do repositório; nova tentativa em 60 s` a cada minuto e o `.deploy-state` não muda.

---

### P1: Os segredos nunca saem da máquina ⭐ MVP

**User Story**: Como dono, quero que a senha do banco viva só no `.env` da minha máquina, para que um commit, um log ou um relatório nunca a exponha.

**Why P1**: Um vazamento dá acesso total ao banco de produção.

**Acceptance Criteria**:

1. The `.gitignore` SHALL ignorar `.env` e `backups/`.
2. The repositório SHALL versionar `.env.example` com os valores do modo local e o modelo do Supabase em linhas de comentário, com a senha como `<database password: letters and digits only>`.
3. The arquivos `.env` versionados SHALL ser exatamente `.env.example`, `game/.env.development`, `game/.env.pages`, `game/.env.production` e `game/.env.staging`, e nenhum `game/.env.*` SHALL conter `SPRING_DATASOURCE`.
4. The scripts da cópia SHALL passar host, porta, banco, usuário, senha e sslmode aos containers só por nome (`-e PGPASSWORD`, com o valor no ambiente do processo), e nenhum argumento de comando SHALL conter um valor do `.env`.
5. The `.env.example` SHALL passar em `checkDatabaseEnv` no modo `local`.

**Independent Test**: `node --test deploy/lib/secrets.test.mjs` passa. `git check-ignore .env backups/x.dump` lista os dois.

---

### P1: Os dados atuais vão para o Supabase ⭐ MVP

**User Story**: Como dono, quero copiar jogadores, progresso e histórico do Flyway do banco local para o Supabase e provar que nada se perdeu, para que ninguém recomece do zero.

**Why P1**: Pedido do dono: "migrar, não começar do zero".

**Acceptance Criteria**:

1. WHEN `node deploy/db/copyToSupabase.mjs check` roda e todas as condições de 2 a 7 valem THEN it SHALL imprimir `Supabase: Postgres <versão principal>, schema public vazio` e `Pronto para copiar` e sair com 0.
2. IF o `.env` não está no modo `supabase` THEN `check` e `copy` SHALL imprimir `ERRO: o .env aponta para o postgres local; ponha a conexão do Supabase (Session pooler) antes da cópia` (modo local), `ERRO: o .env não está pronto para o Supabase: <erros separados por "; ">` (`.env` inválido) ou `ERRO: arquivo .env não encontrado na raiz do repositório` (sem `.env`), não falar com o Supabase e sair com 1.
3. IF existe um container cujo nome contém `infinity-grove-backend-` THEN `check` e `copy` SHALL imprimir `ERRO: pare o publish.sh antes da cópia: <nome> está rodando` (estado `running`) ou `ERRO: remova o container parado <nome> antes da cópia (docker rm <nome>): um rollback o ligaria no banco antigo` (qualquer outro estado), e sair com 1.
4. IF o container `infinity-grove-postgres` não está rodando THEN `check`, `copy` e `verify` SHALL imprimir `ERRO: o Postgres local não está rodando: docker compose -f backend/docker-compose.yml --profile local-db up -d --wait postgres` e sair com 1.
5. IF o Supabase não responde a `show server_version_num` THEN `check`, `copy` e `verify` SHALL imprimir `ERRO: não foi possível conectar ao Supabase pelo Session pooler; confira host, usuário e senha no .env` e sair com 1.
6. IF a versão principal do Supabase é menor que 16 THEN `check`, `copy` e `verify` SHALL imprimir `ERRO: o Supabase roda Postgres <versão>; a cópia precisa de 16 ou mais` e sair com 1.
7. IF o schema `public` do Supabase já tem tabelas THEN `check` e `copy` SHALL imprimir `ERRO: o schema public do Supabase já tem <n> tabelas; a cópia só roda num banco vazio` e sair com 1.
8. WHEN `copy` passa nas condições THEN it SHALL, nesta ordem: gravar o dump do schema `public` local (`pg_dump --format=custom --schema=public --no-owner --no-privileges`) em `backups/infinity_grove-<AAAAMMDD>T<HHMMSS>Z.dump`, imprimir `Dump salvo em backups/<arquivo>.dump`, gravar ao lado a lista de restauração sem a entrada `SCHEMA - public` nem a entrada `COMMENT - SCHEMA public`, revogar os privilégios padrão do role `postgres` em `public` para `anon`, `authenticated` e `service_role`, restaurar com `pg_restore --no-owner --no-privileges --exit-on-error --single-transaction --use-list=<lista> --dbname=postgres`, revogar todo grant desses três roles nas tabelas, sequências e funções de `public`, imprimir `Restaurado no Supabase (Postgres <versão principal>)` e rodar o `verify`.
9. IF o `pg_dump` falha THEN `copy` SHALL imprimir `ERRO: pg_dump falhou; nada foi escrito no Supabase` e sair com 1 sem outro comando no Supabase.
10. IF `pg_restore --list` falha THEN `copy` SHALL imprimir `ERRO: pg_restore --list falhou; nada foi escrito no Supabase` e sair com 1.
11. IF a revogação dos privilégios padrão falha THEN `copy` SHALL imprimir `ERRO: não foi possível revogar as permissões padrão do Data API; nada foi restaurado` e sair com 1 sem restaurar.
12. IF o `pg_restore` falha THEN `copy` SHALL imprimir `ERRO: pg_restore falhou; a transação foi desfeita e o schema public do Supabase continua vazio` e sair com 1.
13. IF a revogação dos grants das tabelas copiadas falha THEN `copy` SHALL imprimir `ERRO: não foi possível revogar as permissões do Data API nas tabelas copiadas` e sair com 1.
14. WHEN `verify` roda THEN it SHALL imprimir uma linha `<tabela>: local <n>, supabase <m> OK|DIFERENTE` por tabela de `public` dos dois lados, em ordem alfabética, com `-` no lado que não tem a tabela. Depois, uma linha `sequência <nome>: local <a>, supabase <b> OK|DIFERENTE` por sequência; `Histórico do Flyway: <k> migrações, última <versão> OK` ou `Histórico do Flyway: local <k> migrações, supabase <j> DIFERENTE` (versão e checksum de cada migração aplicada); e `Permissões do Data API: 0 OK` ou `Permissões do Data API: <n> concessões para anon, authenticated ou service_role DIFERENTE`.
15. WHEN nenhuma linha do `verify` é `DIFERENTE` THEN it SHALL terminar com `Verificação OK: <tabelas> tabela(s), <soma das contagens locais> linha(s)` e sair com 0; IF alguma é THEN it SHALL terminar com `Verificação FALHOU: <número de linhas DIFERENTE> diferença(s)` e sair com 1.
16. IF o `verify` não consegue ler um dos lados THEN it SHALL imprimir `ERRO: não foi possível ler o Postgres local` ou `ERRO: não foi possível ler o Supabase` e sair com 1.
17. The `verify` SHALL rodar com os slots no ar (não checa containers) e não escrever nada em nenhum dos dois bancos.
18. WHEN o comando não é `check`, `copy` nem `verify` THEN o script SHALL imprimir `Uso: node deploy/db/copyToSupabase.mjs check | copy | verify` e sair com 1.
19. The comandos SQL da cópia SHALL citar só o schema `public` (nenhum `auth.`, `storage.`, `extensions.`, `realtime.`, `graphql.`, `graphql_public.`, `vault.`, `supabase_*.`).
20. The ferramentas da cópia SHALL rodar na imagem `postgres:<versão principal do Supabase>`, e a leitura da versão SHALL usar `postgres:17`.

**Independent Test**: `node --test deploy/db` passa com máquinas falsas para cada caminho. Na virada (T15), `copy` termina com `Verificação OK` e o mesmo jogador entra no jogo com o mesmo capítulo e o mesmo cobre de antes.

---

### P1: Os testes nunca tocam no Supabase ⭐ MVP

**User Story**: Como dono, quero que `./gradlew test` use sempre um Postgres descartável, para que um teste nunca apague ou crie dados de produção.

**Why P1**: Os testes de integração apagam todas as tabelas no `@BeforeEach`.

**Acceptance Criteria**:

1. WHILE `spring.datasource.url` aponta para um host do Supabase (propriedade de teste com precedência sobre as variáveis de ambiente), the contexto dos testes de integração SHALL conectar no `PostgreSQLContainer` do Testcontainers: a `jdbcUrl` do `HikariDataSource` é a do `JdbcConnectionDetails` e contém a porta mapeada do container.
2. The `jdbcUrl` usada pelos testes de integração SHALL não conter `supabase`.

**Independent Test**: `cd backend && ./gradlew test --tests '*TestDatabaseIsolationIT'` passa, sem acesso à rede do Supabase (o host do teste termina em `.invalid`).

---

### P1: Virada e volta ⭐ MVP

**User Story**: Como dono, quero um roteiro de virada com ponto de decisão e volta atrás, para trocar o banco de produção numa janela curta e voltar ao banco local se algo der errado.

**Why P1**: É a operação que põe a feature no ar.

**Acceptance Criteria**:

1. WHEN a virada começa THEN o `gitops`, com o dono, SHALL anotar capítulo, etapa e cobre de uma conta de jogador existente, parar o `publish.sh`, remover os containers dos slots e subir o `postgres` local, nessa ordem.
2. WHEN `check` imprime `Pronto para copiar` e `copy` imprime `Verificação OK` THEN o `gitops` SHALL subir o `./publish.sh`, e a linha de início SHALL dizer `on the supabase database`.
3. WHEN o backend sobe no Supabase THEN `node deploy/regression.mjs http://127.0.0.1:<porta do slot ativo>` SHALL imprimir `Regressão OK`, e a conta anotada SHALL mostrar o mesmo capítulo, etapa e cobre no site.
4. IF `check` ou `copy` falha THEN o `gitops` SHALL voltar com `cp .env.example .env` e `./publish.sh`, com o jogo de novo no banco local e nenhum dado perdido.
5. IF um passo depois do `publish.sh` no Supabase falha THEN o `gitops` SHALL parar o `publish.sh`, rodar `cp .env.example .env` e `./publish.sh`, e registrar no relatório que o que foi gravado no Supabase desde a virada não está no banco local.
6. The volume `backend_postgres_data` SHALL continuar intacto (sem `docker compose down -v`) pelo prazo de Q3.

**Independent Test**: o roteiro da T15 roda do começo ao fim na janela, e as checagens da T16 passam.

---

### P2: Documentação

**User Story**: Como dono, quero o README do backend e uma ADR descrevendo o banco novo, para que eu e os agentes saibamos onde está o banco e como voltar.

**Why P2**: O código funciona sem ela, mas o README atual manda rodar `docker compose down -v`, que apagaria a reserva.

**Acceptance Criteria**:

1. The `backend/readme.md` SHALL descrever os dois modos do `.env`, o profile `local-db` e a cópia, e SHALL avisar que `docker compose down -v` apaga o banco local de reserva.
2. The `backend/docs/adr/0012-supabase-postgres.md` SHALL registrar a decisão (Session pooler, pool 5, `.env`, profile `local-db`, REVOKE, `public`) e as alternativas recusadas (conexão direta, Transaction pooler, schema `game`).

**Independent Test**: os dois arquivos existem com as seções da T14.

---

## Edge Cases

- WHEN `copy` roda de novo depois de uma cópia que deu certo THEN it SHALL parar em `ERRO: o schema public do Supabase já tem <n> tabelas; a cópia só roda num banco vazio` (US-4, AC 7).
- IF o `pg_restore` falha no meio THEN o `public` do Supabase SHALL ficar sem tabelas, porque a restauração é uma transação só (US-4, AC 12).
- IF o `.env` some com o watcher no ar THEN o watcher SHALL pausar sem marcar commit nenhum como tratado (US-2, AC 8).
- WHEN o `.env` tem duas linhas com o mesmo nome THEN a última SHALL valer, como no Compose (T1).
- IF a senha do Supabase está errada THEN o slot novo SHALL não ficar pronto em 180 s, e o deploy SHALL falhar com `Deploy <hash> falhou: o backend não ficou pronto em 180 s` sem tirar o slot ativo do ar (caminho que já existe e é coberto por `backendDeploy.test.mjs`; checagem manual M8).

---

## Mensagens

Todas as mensagens novas, exatamente como aparecem. `<...>` é o valor do caso.

| Onde | Texto |
| --- | --- |
| `checkDatabaseEnv` | `falta <NOME> no .env` · `<NOME> contém espaço, #, $, aspas ou barra invertida` · `SPRING_DATASOURCE_URL não é jdbc:postgresql://<host>:<porta>/<banco>` · `SPRING_DATASOURCE_URL não pode trazer usuário ou senha; use SPRING_DATASOURCE_USERNAME e SPRING_DATASOURCE_PASSWORD` · `a conexão direta do Supabase (db.<ref>.supabase.co) é só IPv6; use o Session pooler (aws-N-<região>.pooler.supabase.com:5432)` (texto literal, `<ref>` e `<região>` não são trocados) · `a porta 6543 é o Transaction pooler, que quebra o Flyway; use a porta 5432 (Session pooler)` · `o Session pooler do Supabase usa a porta 5432, não <porta>` · `o banco do Supabase se chama postgres, não <banco>` · `SPRING_DATASOURCE_URL precisa de sslmode=require` · `SPRING_DATASOURCE_USERNAME do Session pooler é postgres.jnqlrdnwwqslihncszej` · `o host <host> não é o Session pooler do Supabase nem o postgres local` |
| `loadDatabaseEnv` | `arquivo .env não encontrado na raiz do repositório` |
| `deploy/dbcheck.mjs` (stderr) | `Configuração do banco inválida: <erros separados por "; ">` |
| watcher | `Deploy pausado: <erros separados por "; ">; nova tentativa em 60 s` |
| `publish.sh` | `Starting the local Postgres (profile local-db)...` · `Starting Dozzle and backend-<slot> (<imagem>) on the <local\|supabase> database...` |
| `copyToSupabase.mjs` | `Supabase: Postgres <n>, schema public vazio` · `Pronto para copiar` · `Dump salvo em backups/<arquivo>.dump` · `Restaurado no Supabase (Postgres <n>)` · as linhas do `verify` (US-4, AC 14 e 15) · cada `ERRO: ...` de US-4 · `Uso: node deploy/db/copyToSupabase.mjs check \| copy \| verify` |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| SUPA-01 | P1: Session pooler - AC 1, 2 (pool 5, variáveis do Spring) | Tasks | Pending |
| SUPA-02 | P1: Session pooler - AC 3 a 17 (checagem do `.env`) | Tasks | Pending |
| SUPA-03 | P1: Deploy - AC 1, 2, 3 (compose e `start.sh`) | Tasks | Pending |
| SUPA-04 | P1: Deploy - AC 4 a 7 (`dbcheck.mjs` e `publish.sh`) | Tasks | Pending |
| SUPA-05 | P1: Deploy - AC 8, 9 (watcher pausa) | Tasks | Pending |
| SUPA-06 | P1: Segredos - AC 1 a 5 | Tasks | Pending |
| SUPA-07 | P1: Dados - AC 1 a 7, 18, 20 (pré-checagem e `check`) | Tasks | Pending |
| SUPA-08 | P1: Dados - AC 8 a 13, 19 (`copy`) | Tasks | Pending |
| SUPA-09 | P1: Dados - AC 14 a 17 (`verify`) | Tasks | Pending |
| SUPA-10 | P1: Testes nunca tocam no Supabase - AC 1, 2 | Tasks | Pending |
| SUPA-11 | P1: Virada e volta - AC 1 a 6 | Tasks | Pending |
| SUPA-12 | P2: Documentação - AC 1, 2 | Tasks | Pending |

**Coverage:** 12 total, 12 mapped to tasks, 0 unmapped

---

## Checagens

### O que o Verifier confere sem a senha do Supabase

- `node --test "deploy/**/*.test.mjs"`: todas as regras e mensagens de SUPA-02, 04, 05, 06, 07, 08, 09, com máquinas falsas.
- `cd backend && ./gradlew ktlintCheck test`: SUPA-01 (`DatabasePoolConfigIT`) e SUPA-10 (`TestDatabaseIsolationIT`).
- SUPA-03 por `deploy/lib/compose.test.mjs` e, com o Docker no ar, por `docker compose -f backend/docker-compose.yml --profile deploy config backend-blue` com um `.env` falso numa cópia de trabalho temporária: o ambiente mostra as três variáveis e nenhum `depends_on`.
- `bash -n publish.sh` e a leitura do diff do `publish.sh` contra a T6.

### O que só se confere contra o projeto real (T16, `gitops` com o dono)

- M1: `node deploy/db/copyToSupabase.mjs check` imprime `Pronto para copiar`.
- M2: `copy` termina com `Verificação OK`, e `Permissões do Data API: 0 OK` aparece.
- M3: `./publish.sh` mostra `on the supabase database`, e o Dozzle mostra o Flyway do slot ativo com `Schema "public" is up to date. No migration necessary.`
- M4: `node deploy/regression.mjs http://127.0.0.1:<porta do slot ativo>` imprime `Regressão OK`.
- M5: a conta anotada mostra no site o mesmo capítulo, etapa e cobre de antes da virada.
- M6: Dashboard > Observability > Shared Pooler client connections mostra no máximo 5 com um slot, e no máximo 10 durante o próximo deploy de backend.
- M7: Dashboard > Integrations > Data API mostra a Data API desligada (Q5).
- M8: com uma senha errada num `.env` de teste, um deploy de backend falha em `não ficou pronto em 180 s` e o slot ativo continua servindo. Opcional, fora da janela.
- M9: a varredura de segredo da T16 imprime `senha fora do repositório` e `senha fora dos logs`.

---

## Success Criteria

- [ ] `Verificação OK` na virada, com o número de tabelas e de linhas do banco local.
- [ ] Um jogador existente continua de onde parou depois da virada.
- [ ] Zero ocorrência da senha em arquivo versionado e nos logs dos containers.
- [ ] O próximo deploy de backend depois da virada passa pela regressão e troca de slot sem erro no Supabase.
