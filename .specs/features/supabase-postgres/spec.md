# Supabase Postgres Specification

> Spec escrita em português a pedido do orquestrador (AD-007 cobre o texto do jogador; as specs anteriores estão em inglês). Os títulos de seção e as palavras-chave EARS (WHEN, THEN, IF, WHILE, WHERE, SHALL, The) ficam em inglês porque o validador `validate_spec.py` as lê.
>
> **Revisão 3 (2026-11-16).** O dono tirou o Fly.io do plano e escolheu o **Google Cloud Run** para o backend. O banco continua indo para o Supabase nesta mesma feature. T1, T2 e T3 já estão feitos (`afccf64`, `ea5014f`, `f407d25`). Saíram da revisão 2: o `backend/fly.toml`, os requisitos FLY-xx (renomeados para RUN-xx, com o conteúdo do Cloud Run) e todo passo com `fly`. O app `infinity-grove-phaser` do Fly e o branch `origin/flyio-new-files` são apagados pelo dono (passo O1 do design). Saíram já na revisão 2: a antiga US-2 (o deploy local lê o `.env`), SUPA-03, SUPA-04 e SUPA-05.

## Perguntas em aberto (responder antes da aprovação)

As perguntas Q1 a Q8 estão respondidas (Assumptions), e Q12 foi respondida pelo dono em 2026-11-16 (janela de cerca de 15 minutos com a imagem pré-construída). As outras, Q9 a Q11 e Q13 a Q15, têm um padrão recomendado, e as tarefas foram escritas sobre ele.

| # | Pergunta | Padrão recomendado | O que muda se a resposta for outra |
| --- | --- | --- | --- |
| Q9 | O serviço do Cloud Run escala a zero quando ninguém joga? | Sim: `--min-instances=0`, cobrança por requisição. Uma instância ociosa fica no ar até 15 minutos e depois some; a próxima visita paga uma partida a frio da JVM (com `--cpu-boost`), e a tela inicial espera por ela (RUN-06). Custo esperado: US$ 0 de computação (design, "Cost"). | Sempre ligada (`--min-instances=1`): sem partida a frio; a instância ociosa paga a tarifa "idle" de `southamerica-east1` (US$ 0,0000035 por vCPU-s e por GiB-s), cerca de US$ 18,40 por mês para 1 vCPU e 1 GiB, ou uns US$ 13 depois do desconto do free tier. Muda só uma flag do workflow (T9) e o teste dela. |
| Q10 | Quem faz o deploy no Cloud Run a cada push? | Só o workflow do GitHub Actions (`.github/workflows/deploy.yml`): testes do backend, regressão num banco descartável, imagem no Artifact Registry, revisão sem tráfego, `/health` e regressão na URL da tag, e só então o tráfego. Nenhum gatilho do Cloud Build nem "deploy contínuo" do console. | Cloud Build ou "deploy contínuo" do console: um commit que sobe mas quebra regras do jogo recebe tráfego sem regressão. Não recomendado. |
| Q11 | A regressão roda contra a produção a cada deploy de backend? | Sim, na URL da tag da revisão nova, antes de ela receber tráfego. Ela usa o banco de produção: cria um usuário `regression-<commit>-<hex>` e o apaga no fim, como o watcher já fazia no banco local. Depois da troca, o `/health` do serviço confere o commit, e o tráfego volta para a revisão anterior se não conferir. | Sem a regressão contra a produção, uma migração que quebra dados reais só aparece quando um jogador reclama. |
| Q12 | Quanto tempo de janela para a virada? | **Respondida pelo dono (2026-11-16):** cerca de 15 minutos fora do ar, do passo 3 (parar o `publish.sh`) ao passo 12 (a conta no site), com a imagem do commit que vai para o ar construída e enviada antes da janela (O15, `mode=build-only`). Estimativa por passo no design ("Cutover runbook"). Se `backend/` mudou depois do pré-build, o run da janela constrói a imagem e a janela cresce pelo tempo de build medido no O15. | Os gatilhos de volta atrás não mudam. |
| Q13 | Por quanto tempo o `publish.sh` e o stack local ficam como volta atrás? | 30 dias depois da virada (o mesmo prazo do banco local, Q3). Depois, uma feature própria remove o stack local de deploy (TD-005). | Remover já: a volta atrás B deixa de existir. |
| Q14 | Em que projeto do Google Cloud? | Um projeto novo, só deste jogo, `infinity-grove-prod` (o ID é global; se estiver tomado, o dono acrescenta um sufixo e usa o mesmo valor em `PROJECT_ID` e na variável `GCP_PROJECT_ID`), na conta Google pessoal do dono, ligado a uma conta de faturamento com cartão. | Um projeto que já existe: só os comandos O4 do design mudam. O `roles/secretmanager.secretAccessor` no nível do projeto (O7) passaria a valer para os secrets de outros sistemas; nesse caso o acesso vira por secret. |
| Q15 | Qual orçamento e quais alertas? | Orçamento `infinity-grove` de 5 na moeda da conta de faturamento, só deste projeto, com e-mail aos administradores da conta em 10 %, 50 % e 100 % do gasto. Um orçamento só avisa; ele não corta o serviço. | Outro valor ou limiar: só o comando O12. |

## Problem Statement

O backend e o banco do jogo rodam só na máquina do dono: os slots blue-green do Docker, o Postgres local, o Traefik e o túnel `cloudflared`. O site só funciona enquanto o `publish.sh` está rodando. Esta feature tira os dois da máquina. O banco vai para o Postgres do projeto Supabase `jnqlrdnwwqslihncszej` pelo Session pooler `aws-1-sa-east-1.pooler.supabase.com:5432`, com os dados atuais (jogadores, progresso, histórico do Flyway). O backend vai para o serviço `infinity-grove-backend` do Google Cloud Run em `southamerica-east1` (São Paulo), ao lado do Supabase `sa-east-1`, construído do mesmo `backend/Dockerfile`. Um workflow do GitHub Actions publica cada commit de `main` depois dos testes e da regressão, autenticado por Workload Identity Federation (sem chave JSON), e o Worker do jogo passa a chamar a URL do serviço (`https://infinity-grove-backend-<número do projeto>.southamerica-east1.run.app`, variável `BACKEND_URL`).

## Goals

- [ ] Depois da virada, o site `https://infinity-grove.yan-tapajos.workers.dev/` funciona sem o `publish.sh`: o Worker encaminha `/api` para o serviço do Cloud Run, e o serviço usa o Postgres do Supabase.
- [ ] Cada linha de cada tabela de `public` do banco local está no Supabase. A contagem por tabela, o valor das sequências e o histórico do Flyway são iguais dos dois lados (`Verificação OK`).
- [ ] Uma revisão que falha nos testes do backend, na regressão sobre um banco descartável, na sonda de inicialização, no `/health` ou na regressão da sua URL de tag nunca recebe tráfego. Uma revisão que recebe tráfego e não responde o commit no `/health` do serviço volta para a revisão anterior sem ninguém digitar nada.
- [ ] A senha do banco, o `JWT_SECRET` e o token da Cloudflare não aparecem em nenhum arquivo versionado, argumento de comando, log ou relatório, e nenhuma chave de conta de serviço do Google existe.
- [ ] Os testes do backend continuam num Postgres descartável e nunca abrem conexão com o Supabase.
- [ ] Um jogador que abre o site com o serviço escalado a zero vê `Acordando o servidor, aguarde...` e chega ao formulário ou à tela de boas-vindas sem erro.
- [ ] Com o tráfego esperado (design, "Cost"), a conta do Google Cloud fica em US$ 0 de computação, requisições, imagens e secrets; o único gasto é a saída de rede, abaixo de US$ 1 por mês, e um orçamento avisa por e-mail.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Supabase Auth, RLS, Edge Functions, `supabase-js` no jogo, chaves `anon`/`service_role` no código | Pedido do dono. O backend continua o único cliente do banco. |
| Fly.io e Render | Saíram do plano (dono, 2026-11-16). O app do Fly é apagado (O1). |
| Cloud Build, "deploy contínuo" do console do Cloud Run, Cloud SQL, VPC, IP de saída fixo, domínio próprio | O runner do GitHub constrói e testa a imagem (Q10); o banco é o Supabase; o Session pooler aceita IPv4 da internet. |
| Mais de uma instância, outras regiões, `--min-instances` acima de 0 | O pool de 15 conexões do Supabase Free comporta uma instância servindo mais a da revisão nova (design, "Connection budget"); Q9. |
| Copiar de volta para o banco local o que foi gravado no Supabase depois da virada | A volta usa o banco local como estava na virada (Q3). |
| Fallback automático para o banco local quando o Supabase cai | Dois bancos recebendo escrita dividem os dados. |
| Backup periódico do Supabase | Dívida TD-003. A virada guarda um dump em `backups/`. |
| Verificar o certificado do servidor (`sslmode=verify-full`) | Dívida TD-004. |
| Remover `publish.sh`, `deploy.sh`, `deploy/watcher.mjs`, Traefik, Dozzle e o profile `deploy` do compose | Eles são a volta atrás por 30 dias (Q13). Dívida TD-005. |
| Espera do servidor dentro da partida | Só a tela inicial espera (RUN-06). Uma chamada da partida com o serviço a frio pode passar dos 10 s do cliente. Dívida TD-006. |
| CORS no backend | O Worker encaminha `/api` na mesma origem do site (`game/worker/index.js`); o navegador nunca chama o Cloud Run direto. |
| Testes do jogo no workflow | O watcher também não os rodava. Os testes do jogo seguem no fluxo de cada feature. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Tipo de conexão | Session pooler `aws-1-sa-east-1.pooler.supabase.com:5432`, usuário `postgres.jnqlrdnwwqslihncszej`, banco `postgres`, `sslmode=require`. O host fica fora do repositório (no `.env` da raiz e no secret `spring-datasource-url`). | A conexão direta só tem IPv6. O Transaction pooler (6543) quebra o Flyway e os prepared statements. `aws-0-sa-east-1` responde "tenant/user not found" para este projeto. | y (dono, Q1; host conferido pelo orquestrador) |
| Plano do Supabase | Free, pool size 15 | Q2 | y (dono) |
| Banco local de reserva | O volume `backend_postgres_data` fica intacto por 30 dias depois da virada. Voltar perde o que foi gravado no Supabase depois da virada. | Q3 | y (dono) |
| Data API do Supabase | Desligada no dashboard, e a cópia revoga os grants de `anon`, `authenticated` e `service_role` em `public` | Q5; as tabelas não têm RLS | y (dono) |
| Senha do banco | Só letras e números (24) | Q6; o `.env` recusa espaço, `#`, `$`, aspas e `\` (SUPA-02) | y (dono) |
| Responsáveis | `kotlin-backend-dev`: `backend/`, scripts de deploy e o workflow. `game-dev`: `game/`. `test-engineer`: tarefas de teste. `gitops`: virada e checagens de produção, com o dono no teclado. `ui-artist`: revisão da tela que muda. | Q7 e pedido do orquestrador | y (dono) |
| Texto do `CLAUDE.md` e do agente `gitops` | O design traz o texto sugerido; o orquestrador aplica. Os agentes não editam o `CLAUDE.md`. | Q8 | y (dono) |
| Onde o backend roda | Google Cloud Run, serviço `infinity-grove-backend`, região `southamerica-east1`, imagem do `backend/Dockerfile` sem mudança no Artifact Registry `southamerica-east1-docker.pkg.dev/<projeto>/infinity-grove/backend:<commit>` | Escolha do dono (2026-11-16). São Paulo fica ao lado do Supabase `sa-east-1`. | y (dono, Cloud Run e região); nomes n |
| Tamanho da instância | `--cpu=1`, `--memory=1Gi`, `--cpu-boost`, `--concurrency=80`, `--timeout=120`, cobrança por requisição | Uma JVM do Spring Boot em 512 MiB corre risco de OOM; acima de 512 MiB o Cloud Run pede pelo menos 0,5 vCPU, e com menos de 1 vCPU a concorrência tem de ser 1. O `--cpu-boost` dá 2 vCPU na partida e 10 s depois. O `--timeout=120` cobre a partida a frio mais a resposta (o Cloud Run conta a partida dentro do timeout). | n |
| Memória da JVM | `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=60` (cerca de 600 MiB de heap em 1 GiB) | O padrão da JVM em contêiner é 25 % (256 MiB); 60 % deixa cerca de 400 MiB para metaspace, threads e code cache | n |
| Porta | O deploy fixa `--port=8080`, e o `application.yaml` ganha `server.port: ${PORT:8080}` | O Cloud Run injeta `PORT` (8080 por padrão) e manda as requisições para ela. O Spring Boot lê `SERVER_PORT`, não `PORT`, então sem a linha ele fica em 8080 de qualquer jeito; a linha faz o contêiner seguir o contrato se a porta mudar. Sem `PORT` (local, compose) continua 8080. | n |
| Quantidade de instâncias | `--max=1` no serviço e `--max-instances=1` em cada revisão; `--min-instances=0` (Q9) | Revisões com tag e sem tráfego não contam no máximo do serviço; com 1 servindo e 1 candidata, o pico é 2 x 5 = 10 conexões (design, "Connection budget") | n |
| Sondas | Startup `httpGet.path=/health,initialDelaySeconds=5,periodSeconds=5,timeoutSeconds=4,failureThreshold=36` (até 185 s, abaixo dos 4 min que o Cloud Run dá para a partida). Liveness `httpGet.path=/health,periodSeconds=60,timeoutSeconds=5,failureThreshold=3`. | O deploy só termina quando uma instância da revisão nova passa na sonda de inicialização (`--deploy-health-check`, padrão). O `/health` roda `select 1`, então a sonda prova que o Flyway terminou e o banco responde. A liveness reinicia uma instância travada depois de 3 minutos. | n |
| Health check | `GET /health`, público, responde 200 `{"status":"UP","commit":"<APP_COMMIT>"}` quando `select 1` funciona e 503 `{"status":"DOWN","commit":...}` quando não | O backend não tinha rota GET pública. O `select 1` faz a sonda e o workflow provarem que o banco responde, e a chamada de espera do jogo renova as conexões depois de um tempo parado. | n |
| Acesso público | O serviço aceita chamadas sem autenticação (`--allow-unauthenticated` na criação, O10); o workflow não mexe no IAM do serviço | A API do jogo é pública; a autenticação é o JWT do próprio backend | y (dono) |
| Estratégia de deploy | `deploy-cloudrun` com `no_traffic: true` e a tag `c-<7 do commit>`; depois `/health` e regressão na URL da tag; depois `gcloud run services update-traffic --to-revisions <revisão>=100 --clear-tags`; depois o `/health` do serviço. Voltar é mandar 100 % para a revisão anterior. | Pedido do dono. A revisão nova não recebe tráfego até passar em tudo, e a anterior continua servindo. | y (dono) |
| Flyway | Roda no boot da aplicação, como hoje. A primeira instância da revisão nova migra o banco de produção durante o `--deploy-health-check`, enquanto a revisão anterior serve. | Igual aos slots locais; a regra expand/contract de AD-016 continua, porque uma revisão que falha não desfaz a migração | n |
| Pool de conexões | Hikari `maximum-pool-size: 5` e `minimum-idle: 1` por processo | Pico de um deploy: a instância que serve e a da revisão nova, 2 x 5 = 10, mais 1 do dashboard = 11, abaixo de 15 | n |
| Deploy contínuo | Workflow `.github/workflows/deploy.yml` em todo push a `main` que toca o backend, o jogo, `deploy/cloudrun/**`, `deploy/regression.mjs` ou o próprio workflow. Jobs `backend` e depois `game`, num grupo de concorrência `production` que nunca cancela um run no meio. | Q10 | n |
| O que o job `backend` publica | O commit mais novo que tocou `backend/` (`git log -1 --format=%H -- backend`), só quando ele é diferente do `commit` que o `/health` do serviço responde | Um run pendente que o GitHub cancela (só o mais novo do grupo fica na fila) não perde nada: o run seguinte compara de novo com o que está no ar | n |
| O que o job `game` publica | O Worker da árvore inteira do commit do run, sempre que o job `backend` termina com sucesso | Uma mudança de jogo segurada por um backend que falhou sai no próximo run que passa (a mesma regra do watcher). Publicar um Worker igual não faz mal. | n |
| Ensaio antes da virada | `workflow_dispatch` com `mode=rehearsal` roda o plano, o login por Workload Identity Federation, a busca da imagem, os testes, a regressão sobre um banco descartável, o envio da imagem ao Artifact Registry e o `inspect` do serviço, sem criar revisão e sem publicar o Worker | Prova no runner do GitHub, antes da janela, o login sem chave, a escrita no registro e a leitura do serviço | n |
| Imagem pré-construída | `workflow_dispatch` com `mode=build-only` testa, constrói e envia a imagem do commit mais novo de `backend/` com a tag do commit (40 hex), sem deploy e sem Worker (O15, no máximo 7 dias antes da janela e depois do último commit de `backend/`). Todo run procura primeiro essa tag no Artifact Registry (`image <commit>`): se ela existe, pula testes, build, regressão do runner e push e faz o deploy dela; se falta, constrói. | Pedido do dono: a janela fica só com cópia, secrets, revisão, regressão na tag e Worker. A imagem só chega ao registro depois dos testes e da regressão do mesmo commit, e só o workflow envia imagens, então a tag existir prova os gates. Uma imagem velha nunca vai para o ar: a tag procurada é sempre a do commit mais novo de `backend/` na hora do run. | y (dono, Q12); detalhes n |
| Congelamento do backend | Nenhum commit em `backend/` entre o O15 e a janela. Se houver, o passo 1 do runbook acusa e o dono escolhe: rodar o O15 de novo antes da janela, ou aceitar a janela maior (o run da janela constrói). | Sem congelamento a imagem pré-construída fica velha e o ganho de tempo some, mas nada errado vai para o ar | n |
| Ligar o workflow | Variável do repositório `CLOUD_RUN_PRODUCTION`. Enquanto não for `true`, os dois jobs pulam (exceto o ensaio). O dono a liga na virada. | O workflow entra em `main` antes da virada, e o watcher local continua sendo a produção até lá | n |
| Autenticação do CI no Google | Workload Identity Federation: pool `github`, provedor `infinity-grove-phaser` aceito só para `assertion.repository == 'woodriveer/infinity-grove-phaser' && assertion.ref == 'refs/heads/main'`, conta `github-deployer@<projeto>.iam.gserviceaccount.com` com `roles/run.admin`, `roles/artifactregistry.writer` no repositório e `roles/iam.serviceAccountUser` na conta de runtime | Pedido do dono (sem chave JSON de longa duração). Papéis da documentação do `deploy-cloudrun`; a condição limita o pool a este repositório e ao `main`. | y (dono, WIF); papéis n |
| Conta de runtime | `infinity-grove-run@<projeto>.iam.gserviceaccount.com`, só com `roles/secretmanager.secretAccessor` no projeto | O projeto é só deste jogo (Q14); o acesso no projeto evita um passo de IAM por secret na janela | n |
| Secrets | Secret Manager: `jwt-secret`, `spring-datasource-url`, `spring-datasource-username`, `spring-datasource-password`, replicação automática, montados como variáveis `JWT_SECRET` e `SPRING_DATASOURCE_*` na versão `latest`. Criados só pelo dono com `gcloud secrets create <nome> --replication-policy=automatic --data-file=-`, lendo da entrada padrão. | Pedido do dono. Variáveis de secret são lidas quando a instância sobe; com `latest`, uma versão nova chega nas instâncias seguintes sem novo deploy. | y (dono, Secret Manager); `latest` n |
| Quando o datasource entra no Secret Manager | Os três `spring-datasource-*` só são criados depois que a cópia imprime `Verificação OK` (runbook, passo 8). Antes disso o projeto não tem nenhum deles. O `jwt-secret` pode ser criado antes (O9). | O Flyway roda no boot: uma revisão com o datasource certo antes da cópia criaria o schema no `public` vazio do Supabase, e o `check` da cópia recusaria o banco. Sem os secrets, o Cloud Run recusa o deploy na checagem de secrets, então nem uma revisão sobe. | y (pedido do orquestrador) |
| `JWT_SECRET` do Cloud Run diferente do local | Aceito. Os tokens de acesso emitidos pelo backend local deixam de valer, o jogo recebe 401 e renova a sessão com o refresh token (que fica no banco copiado). Ninguém precisa entrar de novo. | O refresh token é opaco e guardado como hash SHA-256 em `refresh_tokens` (AD-001); não depende do `JWT_SECRET` | n |
| Variáveis e secrets do GitHub | Variáveis (não secretas): `GCP_PROJECT_ID`, `GCP_WIF_PROVIDER`, `GCP_DEPLOY_SA`, `GCP_RUNTIME_SA`, `BACKEND_URL`, `CLOUD_RUN_PRODUCTION`. Secrets: `CLOUDFLARE_API_TOKEN` (modelo "Edit Cloudflare Workers") e `CLOUDFLARE_ACCOUNT_ID`. Criados só pelo dono (`gh variable set`, `gh secret set`, que pede o valor sem eco). | Com WIF, nenhuma credencial do Google fica no GitHub | n |
| Custos | Request-based billing; free tier mensal da conta de faturamento: 180.000 vCPU-s, 360.000 GiB-s e 2 milhões de requisições, aplicado como desconto em dinheiro com o preço do Tier 1. `southamerica-east1` é Tier 2 (US$ 0,0000336 por vCPU-s e US$ 0,0000035 por GiB-s ativos), então o free tier cobre cerca de 128.500 vCPU-s e 257.000 GiB-s ali. Artifact Registry: 0,5 GiB grátis. Secret Manager: 6 versões ativas e 10.000 acessos grátis. Saída de rede para a América do Sul: US$ 0,19 por GiB, sem franquia. | Páginas de preço do Cloud Run, Artifact Registry, Secret Manager e VPC network pricing, lidas em 2026-11-16 | n |
| Limpeza de imagens | Política `deploy/cloudrun/artifact-cleanup.json` no repositório `infinity-grove`: apaga versões com mais de 30 dias e sempre mantém as 3 mais novas (a que serve e duas para voltar) | Mantém o registro abaixo de 0,5 GiB; a regra de manter vence a de apagar. A imagem do O15 está a salvo até a janela: a regra de apagar só alcança versões com mais de 30 dias que não estão entre as 3 mais novas, o O15 roda no máximo 7 dias antes, e só um commit novo de `backend/` (que já tornaria a imagem velha) empurra outra versão. | n |
| Formato do `.env` | Uma linha `NOME=valor` por variável, sem aspas. Linhas vazias e linhas que começam com `#` são ignoradas. | T1, feito | y (T1) |
| Para que serve o `.env` da raiz agora | Só para a cópia (`deploy/db/copyToSupabase.mjs`) e para o dono alimentar `gcloud secrets create`. Os slots locais não o leem: eles continuam com o `postgres` local no `backend/docker-compose.yml`. | Sem slot local na produção, o `env_file`, o `dbcheck.mjs` e a pausa do watcher (antigas T4 a T7) não têm função | n |
| `loadDatabaseEnv` | Continua em `deploy/lib/databaseEnv.mjs`, testado, sem chamador em produção | Remover código testado e pronto não traz ganho; a cópia usa `readDotenv` + `checkDatabaseEnv` | n |
| Postgres local | Fica como está no compose (sem profile novo), para o dev local, para a fonte da cópia e para a volta atrás | A mudança de profile só existia para o deploy local rodar no Supabase | n |
| Schema do jogo | Fica em `public` | Flyway, Hibernate, Testcontainers e o dump já usam `public`. A exposição pela Data API se fecha com o REVOKE e com a Data API desligada. | n |
| Schemas do Supabase | A cópia lê só `public` do banco local e escreve só em `public` do Supabase | Pedido do dono | y (dono) |
| Ferramenta da cópia | `pg_dump --format=custom` do `public` local e `pg_restore --single-transaction --exit-on-error` no Supabase, em containers `postgres:<versão principal do Supabase>` na rede `backend_default` | Uma falha desfaz tudo e o `public` volta a ficar vazio | n |
| Parar as escritas | Parar o `publish.sh` e remover os containers dos slots antes da cópia | Sem slot rodando, ninguém grava | n |
| Voltar atrás | A: a cópia falhou → `./publish.sh` (o stack local nunca leu o Supabase, e os secrets do datasource não existem). B: o Cloud Run falhou depois da virada → `CLOUD_RUN_PRODUCTION=false` e `./publish.sh --way-back` (depois da T22) ou `./publish.sh` (antes), que republica o Worker apontando para o túnel | O banco local está como estava na virada | n |
| Migração de um commit que falha | Continua valendo AD-016: a migração roda no Supabase de produção no boot da revisão nova e não é desfeita quando a revisão falha ou o tráfego volta | Flyway não tem down migration; voltar o tráfego troca a revisão, não o banco | y (AD-016) |
| Onde fica o dump | `backups/infinity_grove-<AAAAMMDD>T<HHMMSS>Z.dump` e `.list`, com `backups/` no `.gitignore` | T3, feito | y (T3) |
| Idioma das mensagens | Mensagens dos módulos Node (`deploy/lib`, `deploy/db`, `deploy/cloudrun`) em português, como os logs do watcher. As linhas `echo` do `publish.sh` e os nomes do workflow em inglês, como o resto desses arquivos. O texto novo do jogo em português (AD-007). | Segue o idioma de cada arquivo | n |
| Texto de espera do jogo | `Acordando o servidor, aguarde...`, no lugar da mensagem da tela inicial (`.auth-message`), depois de 2 s de espera | Uma linha de 340 px; o `...` atual continua nos primeiros 2 s, então quem não espera não vê nada novo (L-010) | n |
| Quanto o jogo espera | Uma única chamada `GET /api/health` com 60 s de timeout, antes de restaurar a sessão. Qualquer erro segue para a restauração, que mostra a mensagem de servidor fora do ar como hoje. | Uma requisição espera na fila do Cloud Run até 3,5 vezes a partida média da instância (no mínimo 10 s); 60 s cobre uma partida da JVM com folga. Sem nova tentativa, o caso "servidor fora" não espera 60 s. | n |
| Testes de integração | Continuam no `PostgreSQLContainer("postgres:17")` com `@ServiceConnection` | Pedido do dono. Um teste prova isso (SUPA-10). | y (dono) |
| Limpeza do Fly | O dono apaga o app `infinity-grove-phaser` do Fly (dashboard ou `fly apps destroy`) e o branch `origin/flyio-new-files` antes da janela (O1). Nenhum arquivo do Fly entra em `main`. | O app tem secrets com o host errado `aws-0` e nunca chegou ao Supabase (o `public` tem 0 tabelas); o deploy dele pelo GitHub publicava sem teste | y (dono) |

**Open questions:** Q9 a Q11 e Q13 a Q15, no topo, cada uma com o padrão escolhido. Nenhuma bloqueia o código; Q14 e Q15 só mudam comandos do dono. Q12 está respondida (janela de cerca de 15 minutos).

### Dívidas registradas

- **TD-003**: no plano Free o Supabase não faz backup gerenciado. A única cópia de segurança é o dump da virada em `backups/`.
- **TD-004**: `sslmode=require` cifra a conexão mas não verifica o certificado do servidor.
- **TD-005**: `publish.sh`, `deploy.sh`, `deploy/watcher.mjs`, `deploy/deploy.mjs`, `deploy/lib/{backendDeploy,proxy,slots,previous,regressionRun,state,workerPublish,changes}.mjs`, o profile `deploy` do compose (slots, Traefik, Dozzle) e o volume local ficam só como volta atrás. Remover numa feature própria depois dos 30 dias de Q13.
- **TD-006**: só a tela inicial espera o servidor acordar. Uma chamada feita no meio da partida, com o serviço escalado a zero, falha depois de 10 s (`VITE_API_TIMEOUT_MS`).

---

## User Stories

As histórias são citadas pela ordem: US-1 Session pooler, US-2 checagem de saúde, US-3 serviço do Cloud Run, US-4 revisão que falha, US-5 o jogo espera, US-6 segredos, US-7 dados, US-8 testes, US-9 virada, US-10 `publish.sh`, US-11 documentação, US-12 custo.

### P1: O backend fala com o Supabase pelo Session pooler ⭐ MVP

**User Story**: Como dono, quero que o backend use o Postgres do Supabase sem mudar o código das regras, para que o banco saia da minha máquina.

**Why P1**: É a feature.

**Acceptance Criteria**:

1. The backend SHALL abrir no máximo 5 conexões de banco por processo (`spring.datasource.hikari.maximum-pool-size: 5` no `application.yaml`).
2. The backend SHALL manter no mínimo 1 conexão ociosa por processo (`spring.datasource.hikari.minimum-idle: 1`).
3. The backend SHALL ler URL, usuário e senha do banco de `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` e `SPRING_DATASOURCE_PASSWORD`. Os padrões `localhost:5432/infinity_grove` e `infinity`/`infinity` do `application.yaml` continuam para o `bootRun` local.
4. WHEN `checkDatabaseEnv` recebe `SPRING_DATASOURCE_URL=jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require`, `SPRING_DATASOURCE_USERNAME=postgres.jnqlrdnwwqslihncszej` e uma senha sem caractere recusado THEN it SHALL devolver `{ ok: true, mode: 'supabase', errors: [] }`.
5. WHEN `checkDatabaseEnv` recebe `jdbc:postgresql://postgres:5432/infinity_grove` com `infinity`/`infinity` THEN it SHALL devolver `{ ok: true, mode: 'local', errors: [] }`.
6. WHEN o host do pooler tem outro índice ou região (`aws-1-sa-east-1.pooler.supabase.com`, `aws-1-us-east-1.pooler.supabase.com`) ou `sslmode` é `verify-ca` ou `verify-full` THEN `checkDatabaseEnv` SHALL aceitar a configuração.
7. IF uma das três variáveis falta ou está vazia THEN `checkDatabaseEnv` SHALL incluir `falta <NOME> no .env` para cada uma, na ordem URL, USERNAME, PASSWORD.
8. IF um dos três valores contém espaço, tab, `#`, `$`, `"`, `'`, `` ` `` ou `\` THEN `checkDatabaseEnv` SHALL incluir `<NOME> contém espaço, #, $, aspas ou barra invertida`.
9. IF a URL não tem a forma `jdbc:postgresql://<host>:<porta>/<banco>[?parâmetros]` THEN `checkDatabaseEnv` SHALL incluir `SPRING_DATASOURCE_URL não é jdbc:postgresql://<host>:<porta>/<banco>` e devolver `mode: null`.
10. IF a URL traz o parâmetro `user` ou `password` THEN `checkDatabaseEnv` SHALL incluir `SPRING_DATASOURCE_URL não pode trazer usuário ou senha; use SPRING_DATASOURCE_USERNAME e SPRING_DATASOURCE_PASSWORD`.
11. IF o host é `db.<ref>.supabase.co` THEN `checkDatabaseEnv` SHALL incluir `a conexão direta do Supabase (db.<ref>.supabase.co) é só IPv6; use o Session pooler (aws-N-<região>.pooler.supabase.com:5432)` e devolver `mode: null`.
12. IF o host é do pooler e a porta é 6543 THEN `checkDatabaseEnv` SHALL incluir `a porta 6543 é o Transaction pooler, que quebra o Flyway; use a porta 5432 (Session pooler)`; IF a porta é outra, diferente de 5432, THEN it SHALL incluir `o Session pooler do Supabase usa a porta 5432, não <porta>`.
13. IF o host é do pooler e o banco não é `postgres` THEN `checkDatabaseEnv` SHALL incluir `o banco do Supabase se chama postgres, não <banco>`.
14. IF o host é do pooler e `sslmode` falta ou não é `require`, `verify-ca` ou `verify-full` THEN `checkDatabaseEnv` SHALL incluir `SPRING_DATASOURCE_URL precisa de sslmode=require`.
15. IF o host é do pooler e o usuário não é `postgres.jnqlrdnwwqslihncszej` THEN `checkDatabaseEnv` SHALL incluir `SPRING_DATASOURCE_USERNAME do Session pooler é postgres.jnqlrdnwwqslihncszej`.
16. IF o host não é `postgres`, nem `db.<ref>.supabase.co`, nem `aws-<N>-<região>.pooler.supabase.com` THEN `checkDatabaseEnv` SHALL incluir `o host <host> não é o Session pooler do Supabase nem o postgres local` e devolver `mode: null`.
17. IF o arquivo `.env` não existe na raiz THEN `loadDatabaseEnv` SHALL devolver `{ ok: false, mode: null, errors: ['arquivo .env não encontrado na raiz do repositório'] }`.
18. The `checkDatabaseEnv` SHALL nunca pôr o valor de `SPRING_DATASOURCE_PASSWORD` em uma mensagem.

**Independent Test**: `node --test deploy/lib/databaseEnv.test.mjs` passa (T2, feito). `cd backend && ./gradlew test --tests '*DatabasePoolConfigIT'` lê `maximumPoolSize` 5 e `minimumIdle` 1.

---

### P1: O backend responde à checagem de saúde ⭐ MVP

**User Story**: Como dono, quero uma rota pública que diga se o backend e o banco respondem e qual commit está no ar, para que o Cloud Run só mande tráfego para uma revisão pronta e o workflow saiba o que já foi publicado.

**Why P1**: As sondas do Cloud Run e o workflow precisam de uma rota, e o backend não tinha nenhuma rota GET pública.

**Acceptance Criteria**:

1. WHEN `GET /health` chega sem `Authorization` e `select 1` responde no banco THEN the backend SHALL responder 200 com `{"status":"UP","commit":"<valor de app.commit>"}` (`Content-Type: application/json`).
2. IF `select 1` falha no banco THEN the backend SHALL responder 503 com `{"status":"DOWN","commit":"<valor de app.commit>"}`.
3. The `app.commit` SHALL vir da variável de ambiente `APP_COMMIT`, com `unknown` quando ela falta (`app.commit: ${APP_COMMIT:unknown}`).
4. WHEN `POST /health` chega sem token THEN the backend SHALL responder 401 com `code` `AUTH_UNAUTHENTICATED`, como qualquer rota protegida.
5. The rotas que já existiam SHALL manter o status e o corpo de hoje (o `SecurityIT` existente passa sem mudança).

**Independent Test**: `cd backend && ./gradlew test --tests '*Health*'` e `--tests '*SecurityIT'` passam.

---

### P1: O Cloud Run roda o backend ⭐ MVP

**User Story**: Como dono, quero o serviço do Cloud Run descrito no workflow versionado e nos comandos do design, para que tamanho, sondas, escala e secrets sejam revisados como código.

**Why P1**: Sem tamanho e sondas certos, uma JVM do Spring Boot morre por memória ou recebe tráfego antes de o banco responder.

**Acceptance Criteria**:

1. The serviço SHALL se chamar `infinity-grove-backend`, na região `southamerica-east1`, com a imagem `southamerica-east1-docker.pkg.dev/<GCP_PROJECT_ID>/infinity-grove/backend:<commit de 40>` construída do `backend/Dockerfile` sem mudança.
2. The deploy do workflow SHALL passar `--port=8080`, `--cpu=1`, `--memory=1Gi`, `--cpu-boost`, `--concurrency=80`, `--timeout=120`, `--min-instances=0`, `--max-instances=1`, `--max=1` e `--service-account=${{ vars.GCP_RUNTIME_SA }}`.
3. The deploy SHALL configurar a sonda de inicialização `--startup-probe=httpGet.path=/health,initialDelaySeconds=5,periodSeconds=5,timeoutSeconds=4,failureThreshold=36` e a sonda de vida `--liveness-probe=httpGet.path=/health,periodSeconds=60,timeoutSeconds=5,failureThreshold=3`.
4. The deploy SHALL definir exatamente as variáveis `APP_COMMIT=<commit de 40>` e `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=60` (`env_vars_update_strategy: overwrite`).
5. The backend SHALL escutar na porta de `PORT`, com 8080 quando ela falta (`server.port: ${PORT:8080}` no `application.yaml`).
6. The serviço SHALL aceitar chamadas sem autenticação: `gcloud run services get-iam-policy infinity-grove-backend --region southamerica-east1` mostra `allUsers` com `roles/run.invoker` (criação pelo dono, O10).
7. The serviço SHALL rodar com a conta `infinity-grove-run@<GCP_PROJECT_ID>.iam.gserviceaccount.com`, cujo único papel no projeto é `roles/secretmanager.secretAccessor`.

**Independent Test**: `node --test deploy/cloudrun/workflow.test.mjs` passa (AC 1 a 4). `cd backend && ./gradlew test --tests '*ServerPortConfigTest'` passa (AC 5). M11 confere AC 6 e 7 contra a produção.

---

### P1: Uma revisão que falha nunca fica com o tráfego ⭐ MVP

**User Story**: Como dono, quero que cada push a `main` publique o backend no Cloud Run e o Worker na Cloudflare só depois dos testes e da regressão, para que o deploy continue sem downtime e sem regressão como no blue-green local.

**Why P1**: Substitui o watcher, que só roda com o `publish.sh`.

**Acceptance Criteria**:

1. WHEN `node deploy/cloudrun/cloudRunRelease.mjs plan` roda THEN it SHALL ler o commit mais novo de `backend/` (`git log -1 --format=%H -- backend`), ler o `commit` de `GET <BACKEND_URL>/health` com 90 s de timeout e escrever `deploy`, `target`, `live` e `tag` (`name=valor`, um por linha) no arquivo de `GITHUB_OUTPUT`, com `tag=c-<7 primeiros do alvo>`.
2. WHEN o commit do serviço é igual ao commit mais novo de `backend/` THEN `plan` SHALL escrever `deploy=false` e imprimir `Backend <7 primeiros> já está no Cloud Run; nada a fazer`.
3. WHEN o commit do serviço é outro, ou o serviço não responde 2xx com JSON, ou o `commit` não é um hash de 40 caracteres hexadecimais THEN `plan` SHALL escrever `deploy=true` e imprimir `Backend <alvo 7> vai para o Cloud Run (no ar: <atual 7 | nenhum>)`, com `live=none` quando não há commit conhecido.
4. IF o `git log` falha THEN `plan` SHALL imprimir `ERRO: não foi possível ler o último commit de backend/`, não escrever saída e sair com 1.
5. IF a variável `BACKEND_URL` falta ou está vazia THEN `plan` e `release` SHALL imprimir `ERRO: falta a variável BACKEND_URL (URL do serviço do Cloud Run)` e sair com 1, sem rodar `git`, `gcloud` nem `node` e sem chamar a rede.
6. WHEN `node deploy/cloudrun/cloudRunRelease.mjs release <alvo>` roda THEN it SHALL ler o tráfego com `gcloud run services describe infinity-grove-backend --region southamerica-east1 --format json` e achar a revisão com a tag `c-<alvo 7>` (a candidata, com a URL da tag) e a revisão com 100 % do tráfego (a anterior).
7. IF o `describe` falha ou não traz `status.traffic` THEN `release` SHALL imprimir `ERRO: não foi possível ler o serviço infinity-grove-backend no Cloud Run (gcloud run services describe)` e sair com 1; IF a tag `c-<alvo 7>` não está no tráfego THEN it SHALL imprimir `ERRO: a revisão de <alvo 7> (tag c-<alvo 7>) não está no serviço; o tráfego continua em <anterior | nenhuma revisão>` e sair com 1.
8. IF `<URL da tag>/health` não responde 2xx com o `commit` igual ao alvo em 90 s THEN `release` SHALL remover a tag (`gcloud run services update-traffic infinity-grove-backend --region southamerica-east1 --remove-tags c-<alvo 7>`), imprimir `ERRO: a revisão <candidata> de <alvo 7> não respondeu UP com o commit em <URL da tag>/health; o tráfego continua em <anterior | nenhuma revisão>`, não rodar a regressão, não mudar o tráfego e sair com 1.
9. WHEN o `/health` da tag responde o alvo THEN `release` SHALL rodar `node deploy/regression.mjs <URL da tag>` com `REGRESSION_COMMIT=<alvo 7>` e imprimir a saída dela; IF ela falha THEN it SHALL remover a tag como no AC 8, imprimir `ERRO: a regressão falhou em <alvo 7>; o tráfego continua em <anterior | nenhuma revisão>`, não mudar o tráfego e sair com 1.
10. WHEN a regressão passa THEN `release` SHALL rodar `gcloud run services update-traffic infinity-grove-backend --region southamerica-east1 --to-revisions <candidata>=100 --clear-tags`; IF ele falha THEN it SHALL imprimir `ERRO: não foi possível mandar o tráfego para <candidata>; o tráfego continua em <anterior | nenhuma revisão>` e sair com 1; WHEN ele passa e `<BACKEND_URL>/health` responde o alvo THEN it SHALL imprimir `Backend <alvo 7> no ar no Cloud Run (<candidata>)` e sair com 0.
11. IF depois da troca `<BACKEND_URL>/health` não responde o alvo THEN `release` SHALL mandar o tráfego de volta (`--to-revisions <anterior>=100`) e imprimir `ERRO: o serviço não respondeu <alvo 7> no /health depois da troca; o tráfego voltou para <anterior>` quando a volta passa, `ERRO: o serviço não respondeu <alvo 7> no /health depois da troca e a volta para <anterior> falhou; rode gcloud run services update-traffic infinity-grove-backend --region southamerica-east1 --to-revisions <anterior>=100` quando não passa, ou `ERRO: o serviço não respondeu <alvo 7> no /health depois da troca e não há revisão anterior; veja gcloud run revisions list --service infinity-grove-backend --region southamerica-east1` quando não havia revisão com 100 %, e sair com 1.
12. WHEN `node deploy/cloudrun/cloudRunRelease.mjs inspect` roda THEN it SHALL imprimir `Tráfego: <revisão com 100 % | nenhuma revisão com 100%>` e uma linha `Tag <tag>: <revisão> <URL>` por tag e sair com 0; IF o `describe` falha THEN it SHALL imprimir a mensagem de erro do AC 7 e sair com 1.
13. WHEN `node deploy/cloudrun/cloudRunRelease.mjs image <alvo>` roda THEN it SHALL rodar `gcloud artifacts docker images describe <IMAGE>:<alvo> --format value(image_summary.digest)` e, quando ele sai com 0, escrever `prebuilt=true` no `GITHUB_OUTPUT` e imprimir `Imagem <alvo 7> já está no Artifact Registry; testes, build, regressão e push não rodam de novo`; quando ele sai com outro status (tag que falta ou qualquer erro), escrever `prebuilt=false` e imprimir `Imagem <alvo 7> não está no Artifact Registry; testes, build, regressão e push rodam agora`; nos dois casos sair com 0. IF a variável `IMAGE` falta ou está vazia THEN it SHALL imprimir `ERRO: falta a variável IMAGE (repositório do Artifact Registry)` e sair com 1 sem rodar `gcloud`.
14. WHEN o comando não é `plan`, `inspect`, `image <hash de 40>` nem `release <hash de 40>` THEN o script SHALL imprimir `Uso: node deploy/cloudrun/cloudRunRelease.mjs plan | inspect | image <commit> | release <commit>` e sair com 1.
15. The workflow `.github/workflows/deploy.yml` SHALL rodar em todo push a `main` que muda `backend/**`, `game/src/**`, `game/public/**`, `game/worker/**`, `game/index.html`, `game/vite.config.js`, `game/package.json`, `game/wrangler.jsonc`, `game/scripts/deploy.mjs`, `game/.env.pages`, `deploy/cloudrun/**`, `deploy/regression.mjs` ou o próprio workflow, e por `workflow_dispatch` com a entrada `mode` (`deploy`, o padrão; `build-only`; `rehearsal`). Um push roda como `deploy`.
16. The workflow SHALL rodar um run por vez no grupo `production`, sem cancelar o que está rodando (`cancel-in-progress: false`).
17. WHILE a variável `CLOUD_RUN_PRODUCTION` do repositório não é `true` the workflow SHALL pular os dois jobs, exceto o job `backend` de um run manual com `mode` `build-only` ou `rehearsal`.
18. WHEN `plan` escreve `deploy=true` THEN o job `backend` SHALL, nesta ordem: entrar no Google Cloud por Workload Identity Federation e rodar `image <alvo>`; quando `prebuilt=false`, rodar `./gradlew ktlintCheck test` em `backend/`, construir a imagem `<IMAGE>:<alvo>`, subi-la com um Postgres 16 descartável do runner, rodar `node deploy/regression.mjs http://127.0.0.1:8080` e enviá-la ao Artifact Registry; e, só no modo `deploy`, criar a revisão com `google-github-actions/deploy-cloudrun@v3` (`no_traffic: true`, `tag: c-<7>`, imagem `<IMAGE>:<alvo>`) e rodar `release`. Qualquer passo que falha para o job antes do seguinte.
19. WHEN `image` escreve `prebuilt=true` THEN o job `backend` SHALL não rodar os testes, o build, a regressão do runner nem o push, e o deploy SHALL usar a imagem que já está em `<IMAGE>:<alvo>`. Uma imagem só chega ao registro com a tag de um commit depois de passar nos testes e na regressão desse commit (AC 18), e só o workflow envia imagens.
20. The tag da imagem SHALL ser sempre o commit de 40 caracteres que `plan` escolheu (o commit mais novo de `backend/` na hora do run), e o workflow SHALL não usar a tag `latest` nem outra tag; por isso uma imagem pré-construída de um commit mais velho nunca vai para o ar: se `backend/` mudou depois do pré-build, a tag do commit novo falta e o run constrói.
21. WHERE o run é manual com `mode=build-only` the workflow SHALL rodar o plano, o login, `image` e, quando a imagem falta, os testes, o build, a regressão do runner e o push, e SHALL não rodar `inspect`, não criar revisão e não publicar o Worker.
22. WHERE o run é manual com `mode=rehearsal` the workflow SHALL fazer o mesmo que `build-only` e rodar `inspect` no fim.
23. WHEN o job `backend` de um run no modo `deploy` termina com sucesso THEN o job `game` SHALL publicar o Worker da árvore do commit do run com `BACKEND_URL=${{ vars.BACKEND_URL }}`; IF o job `backend` falha, ou o modo não é `deploy`, THEN o job `game` SHALL não rodar.
24. The imagem candidata SHALL rodar na regressão do runner com `SPRING_DATASOURCE_URL=jdbc:postgresql://ci-postgres:5432/infinity_grove`, nunca com um secret do Secret Manager.

**Independent Test**: `node --test deploy/cloudrun/cloudRunRelease.test.mjs deploy/cloudrun/workflow.test.mjs` passa. Antes da virada, o run manual com `mode=rehearsal` fica verde no GitHub (M9), e o run com `mode=build-only` do commit que vai para o ar deixa a imagem dele no Artifact Registry (M15).

---

### P1: O jogo espera o servidor acordar ⭐ MVP

**User Story**: Como jogador, quero que a tela inicial espere o servidor quando ele está dormindo e me diga que está acordando, para eu não ver um erro de servidor fora do ar na primeira visita do dia.

**Why P1**: Com o serviço escalado a zero, a primeira chamada paga a partida da JVM e pode passar dos 10 s do cliente.

**Acceptance Criteria**:

1. WHEN a tela inicial começa a restaurar a sessão THEN o jogo SHALL chamar `GET /api/health` uma vez, sem token e com 60 s de timeout, antes de qualquer chamada de sessão.
2. WHILE a chamada de saúde está pendente há menos de 2 s the tela inicial SHALL mostrar `...` na mensagem (como hoje).
3. WHILE a chamada de saúde está pendente há 2 s ou mais the tela inicial SHALL mostrar `Acordando o servidor, aguarde...` na mensagem, sem o estilo de erro.
4. WHEN a chamada de saúde termina com qualquer resultado THEN o jogo SHALL restaurar a sessão como hoje: formulário, boas-vindas ou `Cannot reach the server. Try again later.` com o estilo de erro.
5. IF a chamada de saúde falha (rede, timeout, 503) THEN o jogo SHALL seguir para a restauração sem nova tentativa.
6. IF a cena sai da tela enquanto a chamada de saúde está pendente THEN o jogo SHALL não restaurar a sessão nem mostrar `Acordando o servidor, aguarde...`.
7. WHEN a tela inicial abre com um usuário já no registro (volta da partida) THEN o jogo SHALL não chamar `/api/health`.
8. The `services` da composição SHALL ter a chave `backend` com `wake()`, que resolve `true` quando o backend responde 2xx e `false` em qualquer erro, e nunca rejeita.

**Independent Test**: `cd game && npx playwright test e2e/wake.spec.js` passa: com o `/api/health` falso atrasado 4 s, a mensagem mostra `Acordando o servidor, aguarde...` e depois o formulário aparece.

---

### P1: Os segredos nunca saem do lugar deles ⭐ MVP

**User Story**: Como dono, quero que a senha do banco, o `JWT_SECRET` e o token da Cloudflare vivam só no `.env` da minha máquina, no Secret Manager e nos secrets do GitHub, e que o CI entre no Google sem chave, para que um commit, um log ou um relatório nunca os exponha.

**Why P1**: Um vazamento dá acesso total ao banco de produção ou ao deploy.

**Acceptance Criteria**:

1. The `.gitignore` SHALL ignorar `.env` e `backups/` (T3, feito).
2. The repositório SHALL versionar `.env.example` com os valores do modo local e o modelo do Supabase em linhas de comentário, com a senha como `<database password: letters and digits only>` (T3, feito).
3. The arquivos `.env` versionados SHALL ser exatamente `.env.example`, `game/.env.development`, `game/.env.pages`, `game/.env.production` e `game/.env.staging`, e nenhum `game/.env.*` SHALL conter `SPRING_DATASOURCE` (T3, feito).
4. The scripts da cópia SHALL passar host, porta, banco, usuário, senha e sslmode aos containers só por nome (`-e PGPASSWORD`, com o valor no ambiente do processo), e nenhum argumento de comando SHALL conter um valor do `.env`.
5. The `.env.example` SHALL passar em `checkDatabaseEnv` no modo `local` (T3, feito).
6. The workflow SHALL entrar no Google Cloud só por Workload Identity Federation (`google-github-actions/auth@v3` com `workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}`, `service_account: ${{ vars.GCP_DEPLOY_SA }}` e `id-token: write`), SHALL ler `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` só de `${{ secrets.<nome> }}`, e SHALL não conter `credentials_json`, `private_key`, `supabase` nem uma URL `run.app`.
7. The serviço SHALL receber `JWT_SECRET`, `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` e `SPRING_DATASOURCE_PASSWORD` só do Secret Manager (`jwt-secret`, `spring-datasource-url`, `spring-datasource-username`, `spring-datasource-password`, versão `latest`), como variáveis de ambiente (`secrets_update_strategy: overwrite`).
8. The secrets do Secret Manager SHALL ser criados só pelo dono, no teclado, com `gcloud secrets create <nome> --replication-policy=automatic --data-file=-` lendo da entrada padrão (a linha do `.env` ou `openssl rand`); nenhum agente cria, lê, imprime ou roda `gcloud secrets versions access`.
9. WHILE a cópia não imprimiu `Verificação OK` the projeto SHALL não ter os secrets `spring-datasource-url`, `spring-datasource-username` e `spring-datasource-password`: `gcloud secrets list --filter="name~spring-datasource" --format="value(name)"` imprime nada.
10. The `.env.example` SHALL descrever o `.env` como a entrada da cópia e do `gcloud secrets create`, sem citar `env_file`, slots nem Fly.
11. The `.gitignore` SHALL ignorar `gha-creds-*.json`, o arquivo de credencial curta que `google-github-actions/auth` grava no workspace.
12. The projeto SHALL não ter nenhuma chave de conta de serviço criada pelo dono: `gcloud iam service-accounts keys list --iam-account=github-deployer@<projeto>.iam.gserviceaccount.com --managed-by=user` imprime nada.

**Independent Test**: `node --test deploy/lib/secrets.test.mjs deploy/cloudrun/workflow.test.mjs` passa. A varredura M8 imprime `senha fora do repositório` e `senha fora dos logs`. M11 confere AC 9 (antes da virada) e AC 12.

---

### P1: Os dados atuais vão para o Supabase ⭐ MVP

**User Story**: Como dono, quero copiar jogadores, progresso e histórico do Flyway do banco local para o Supabase e provar que nada se perdeu, para que ninguém recomece do zero.

**Why P1**: Pedido do dono: "migrar, não começar do zero".

**Acceptance Criteria**:

1. WHEN `node deploy/db/copyToSupabase.mjs check` roda e todas as condições de 2 a 7 valem THEN it SHALL imprimir `Supabase: Postgres <versão principal>, schema public vazio` e `Pronto para copiar` e sair com 0.
2. IF o `.env` não está no modo `supabase` THEN `check` e `copy` SHALL imprimir `ERRO: o .env aponta para o postgres local; ponha a conexão do Supabase (Session pooler) antes da cópia` (modo local), `ERRO: o .env não está pronto para o Supabase: <erros separados por "; ">` (`.env` inválido) ou `ERRO: arquivo .env não encontrado na raiz do repositório` (sem `.env`), não falar com o Supabase e sair com 1.
3. IF existe um container cujo nome contém `infinity-grove-backend-` THEN `check` e `copy` SHALL imprimir `ERRO: pare o publish.sh antes da cópia: <nome> está rodando` (estado `running`) ou `ERRO: remova o container parado <nome> antes da cópia (docker rm <nome>): um rollback o ligaria no banco antigo` (qualquer outro estado), e sair com 1.
4. IF o container `infinity-grove-postgres` não está rodando THEN `check`, `copy` e `verify` SHALL imprimir `ERRO: o Postgres local não está rodando: docker compose -f backend/docker-compose.yml up -d --wait postgres` e sair com 1.
5. IF o Supabase não responde a `show server_version_num` THEN `check`, `copy` e `verify` SHALL imprimir `ERRO: não foi possível conectar ao Supabase pelo Session pooler; confira host, usuário e senha no .env` e sair com 1.
6. IF a versão principal do Supabase é menor que 16 THEN `check`, `copy` e `verify` SHALL imprimir `ERRO: o Supabase roda Postgres <versão>; a cópia precisa de 16 ou mais` e sair com 1.
7. IF o schema `public` do Supabase já tem tabelas THEN `check` e `copy` SHALL imprimir `ERRO: o schema public do Supabase já tem <n> tabelas; a cópia só roda num banco vazio` e sair com 1.
8. WHEN `copy` passa nas condições THEN it SHALL, nesta ordem: gravar o dump do schema `public` local (`pg_dump --format=custom --schema=public --no-owner --no-privileges`) em `backups/infinity_grove-<AAAAMMDD>T<HHMMSS>Z.dump`, imprimir `Dump salvo em backups/<arquivo>.dump`, gravar ao lado a lista de restauração sem a entrada `SCHEMA - public` nem a entrada `COMMENT - SCHEMA public`, revogar os privilégios padrão do role `postgres` em `public` para `anon`, `authenticated` e `service_role`, restaurar com `pg_restore --no-owner --no-privileges --exit-on-error --single-transaction --use-list=<lista> --dbname=postgres`, revogar todo grant desses três roles nas tabelas, sequências e funções de `public`, imprimir `Restaurado no Supabase (Postgres <versão principal>)` e rodar o `verify`.
9. IF o `pg_dump` falha THEN `copy` SHALL imprimir `ERRO: pg_dump falhou; nada foi escrito no Supabase` e sair com 1 sem outro comando no Supabase.
10. IF `pg_restore --list` falha THEN `copy` SHALL imprimir `ERRO: pg_restore --list falhou; nada foi escrito no Supabase` e sair com 1.
11. IF a revogação dos privilégios padrão falha THEN `copy` SHALL imprimir `ERRO: não foi possível revogar as permissões padrão do Data API; nada foi restaurado` e sair com 1 sem restaurar.
12. IF o `pg_restore` falha THEN `copy` SHALL imprimir `ERRO: pg_restore falhou; a transação foi desfeita e o schema public do Supabase continua vazio` e sair com 1.
13. IF a revogação dos grants das tabelas copiadas falha THEN `copy` SHALL imprimir `ERRO: não foi possível revogar as permissões do Data API nas tabelas copiadas` e sair com 1.
14. WHEN `verify` roda THEN it SHALL imprimir uma linha `<tabela>: local <n>, supabase <m> OK|DIFERENTE` por tabela de `public` dos dois lados, em ordem alfabética, com `-` no lado que não tem a tabela. Depois, uma linha `sequência <nome>: local <a>, supabase <b> OK|DIFERENTE` por sequência; `Histórico do Flyway: <k> migrações, última <versão> OK` ou `Histórico do Flyway: local <k> migrações, supabase <j> DIFERENTE`; e `Permissões do Data API: 0 OK` ou `Permissões do Data API: <n> concessões para anon, authenticated ou service_role DIFERENTE`.
15. WHEN nenhuma linha do `verify` é `DIFERENTE` THEN it SHALL terminar com `Verificação OK: <tabelas> tabela(s), <soma das contagens locais> linha(s)` e sair com 0; IF alguma é THEN it SHALL terminar com `Verificação FALHOU: <número de linhas DIFERENTE> diferença(s)` e sair com 1.
16. IF o `verify` não consegue ler um dos lados THEN it SHALL imprimir `ERRO: não foi possível ler o Postgres local` ou `ERRO: não foi possível ler o Supabase` e sair com 1.
17. The `verify` SHALL rodar com os slots ou o Cloud Run no ar (não checa containers) e não escrever nada em nenhum dos dois bancos.
18. WHEN o comando não é `check`, `copy` nem `verify` THEN o script SHALL imprimir `Uso: node deploy/db/copyToSupabase.mjs check | copy | verify` e sair com 1.
19. The comandos SQL da cópia SHALL citar só o schema `public` (nenhum `auth.`, `storage.`, `extensions.`, `realtime.`, `graphql.`, `graphql_public.`, `vault.`, `supabase_*.`).
20. The ferramentas da cópia SHALL rodar na imagem `postgres:<versão principal do Supabase>`, e a leitura da versão SHALL usar `postgres:17`.

**Independent Test**: `node --test deploy/db` passa com máquinas falsas para cada caminho. Na virada (T20), `copy` termina com `Verificação OK` e o mesmo jogador entra no jogo com o mesmo capítulo e o mesmo cobre de antes.

---

### P1: Os testes nunca tocam no Supabase ⭐ MVP

**User Story**: Como dono, quero que `./gradlew test` use sempre um Postgres descartável, para que um teste nunca apague ou crie dados de produção.

**Why P1**: Os testes de integração apagam todas as tabelas no `@BeforeEach`, e agora rodam também no runner do GitHub.

**Acceptance Criteria**:

1. WHILE `spring.datasource.url` aponta para um host do Supabase (propriedade de teste com precedência sobre as variáveis de ambiente), the contexto dos testes de integração SHALL conectar no `PostgreSQLContainer` do Testcontainers: a `jdbcUrl` do `HikariDataSource` é a do `JdbcConnectionDetails` e contém a porta mapeada do container.
2. The `jdbcUrl` usada pelos testes de integração SHALL não conter `supabase`.

**Independent Test**: `cd backend && ./gradlew test --tests '*TestDatabaseIsolationIT'` passa, sem acesso à rede do Supabase (o host do teste termina em `.invalid`).

---

### P1: Virada e volta ⭐ MVP

**User Story**: Como dono, quero um roteiro de virada com pontos de decisão e volta atrás, para trocar banco e backend de produção numa janela curta e voltar ao stack local se algo der errado.

**Why P1**: É a operação que põe a feature no ar.

**Acceptance Criteria**:

1. WHEN a virada começa THEN o `gitops`, com o dono, SHALL conferir os passos do dono de antes da janela (design, "Owner steps"), conferir que a imagem do commit mais novo de `backend/` em `origin/main` está no Artifact Registry, anotar capítulo, etapa e cobre de uma conta existente, parar o `publish.sh`, remover os containers dos slots e conferir o `postgres` local rodando, nessa ordem.
2. WHEN `check` imprime `Pronto para copiar` e `copy` imprime `Verificação OK` THEN o dono SHALL criar `spring-datasource-url`, `spring-datasource-username` e `spring-datasource-password` a partir do `.env` (runbook, passo 8), ligar `CLOUD_RUN_PRODUCTION=true` e disparar o workflow.
3. IF `check` ou `copy` falha THEN o `gitops` SHALL voltar com `./publish.sh` (volta A), com o jogo de novo no stack local e nenhum dado perdido, e os três secrets do datasource SHALL continuar sem existir.
4. WHEN o workflow da virada termina THEN o job `backend` SHALL imprimir `Backend <7> no ar no Cloud Run (<revisão>)`, o job `game` SHALL ter publicado o Worker, `GET <BACKEND_URL>/health` SHALL responder `{"status":"UP","commit":"<commit mais novo de backend/>"}`, e a conta anotada SHALL mostrar o mesmo capítulo, etapa e cobre no site.
5. IF um passo depois da criação dos secrets do datasource falha THEN o `gitops` SHALL pôr `CLOUD_RUN_PRODUCTION=false`, subir `./publish.sh` (volta B) e registrar no relatório que o que foi gravado no Supabase desde a virada não está no banco local.
6. The app `infinity-grove-phaser` do Fly SHALL não existir e o branch `flyio-new-files` SHALL não existir em `origin` antes da janela (O1).
7. The volume `backend_postgres_data` SHALL continuar intacto (sem `docker compose down -v`) por 30 dias depois da virada (Q3).
8. WHEN a virada passa THEN `node deploy/cloudrun/cloudRunRelease.mjs inspect` SHALL imprimir `Tráfego: <revisão do commit da virada>` e nenhuma linha `Tag`.
9. WHEN o run da virada começa e a imagem do commit mais novo de `backend/` já está no Artifact Registry THEN o job `backend` SHALL imprimir `Imagem <7> já está no Artifact Registry; testes, build, regressão e push não rodam de novo` e o site SHALL ficar fora do ar no máximo cerca de 15 minutos (do passo 3 ao passo 12 do runbook).
10. IF `backend/` mudou em `origin/main` depois do pré-build (O15) THEN o passo 1 do runbook SHALL acusar a falta da imagem, o run da virada SHALL construí-la (`Imagem <7> não está no Artifact Registry; testes, build, regressão e push rodam agora`), e o relatório SHALL registrar a janela maior (mais o tempo de build medido no O15); os gatilhos de volta atrás A e B SHALL continuar os mesmos.

**Independent Test**: o roteiro da T20 roda do começo ao fim na janela, e as checagens da T21 passam.

---

### P2: O `publish.sh` vira só a volta atrás

**User Story**: Como dono, quero que o `publish.sh` não suba o stack local por engano depois da virada, para que o Worker nunca volte a apontar para um túnel com o banco local enquanto a produção está no Cloud Run.

**Why P2**: O `CLAUDE.md` e o agente `gitops` mandam subir o `publish.sh`; um engano dividiria os jogadores entre dois bancos.

**Acceptance Criteria**:

1. IF o `publish.sh` roda sem `--way-back` THEN it SHALL imprimir `Production runs on Google Cloud Run since the cutover of spec supabase-postgres. publish.sh only brings back the local stack as the way back: ./publish.sh --way-back` e sair com 1 antes de subir qualquer container.
2. WHEN o `publish.sh` roda com `--way-back` THEN it SHALL imprimir `Way back: set the GitHub variable CLOUD_RUN_PRODUCTION to false first, or the next push republishes the Worker to Cloud Run.` e seguir como antes da feature.

**Independent Test**: `./publish.sh` sem argumento termina com a linha de AC 1 e nenhum container novo aparece em `docker ps`.

---

### P2: Documentação

**User Story**: Como dono, quero a ADR, os READMEs e o `.env.example` descrevendo a produção nova, para que eu e os agentes saibamos onde estão o banco e o backend e como voltar.

**Why P2**: O código funciona sem ela, mas os textos atuais mandam usar o `publish.sh` e o `docker compose down -v`.

**Acceptance Criteria**:

1. The `backend/docs/adr/0012-production-on-cloud-run-and-supabase.md` SHALL registrar a decisão (Cloud Run `southamerica-east1`, escala a zero, no máximo uma instância servindo, revisão sem tráfego com tag, `/health` e regressão antes do tráfego, volta por tráfego, Flyway no boot, Session pooler, pool 5, Workload Identity Federation, Secret Manager, REVOKE, `public`) e as alternativas recusadas (Fly.io, Render, conexão direta, Transaction pooler, Cloud Build, chave JSON, `--min-instances=1`).
2. The `backend/readme.md` SHALL descrever a produção no Cloud Run (deploy pelo workflow, `gcloud run services logs read`, volta com `gcloud run services update-traffic --to-revisions`), a cópia, e SHALL avisar que `docker compose down -v` apaga o banco local de reserva.
3. The `game/readme.md` SHALL dizer que o workflow publica o Worker com `BACKEND_URL` igual à variável `BACKEND_URL` do repositório (a URL do serviço do Cloud Run) depois do backend, e que `BACKEND_URL=<url> npm run deploy` publica à mão.

**Independent Test**: os três arquivos existem com as seções das T18 e T19.

---

### P2: O custo fica no free tier e avisa quando sai

**User Story**: Como dono, quero que o Cloud Run, o registro de imagens e os secrets fiquem dentro das franquias grátis e que um alerta me avise de qualquer gasto, para que o jogo não gere uma fatura surpresa.

**Why P2**: O serviço funciona sem isso, mas imagens acumuladas e uma instância sempre ligada geram cobrança.

**Acceptance Criteria**:

1. The arquivo `deploy/cloudrun/artifact-cleanup.json` SHALL ter exatamente duas políticas: `delete-older-than-30-days` (`Delete`, `tagState: any`, `olderThan: 30d`) e `keep-3-most-recent` (`Keep`, `mostRecentVersions.keepCount: 3`).
2. The repositório `infinity-grove` do Artifact Registry SHALL ter essa política ativa (`gcloud artifacts repositories describe infinity-grove --location southamerica-east1` mostra as duas regras), aplicada pelo dono com `--no-dry-run` (O6).
3. The conta de faturamento SHALL ter o orçamento `infinity-grove`, filtrado para o projeto, com limiares de 10 %, 50 % e 100 % (O12, Q15).
4. The Secret Manager SHALL ter no máximo 6 versões ativas (habilitadas ou desabilitadas); WHEN o dono troca o valor de um secret THEN ele SHALL destruir a versão anterior (`gcloud secrets versions destroy <n> --secret <nome>`).
5. WHEN o primeiro mês cheio depois da virada fecha THEN o relatório de faturamento do projeto SHALL mostrar no máximo US$ 1, ou a diferença SHALL virar uma revisão de Q9 com o dono.
6. WHILE a imagem pré-construída do O15 espera a janela the política de limpeza SHALL não apagá-la: ela tem menos de 30 dias (o O15 roda no máximo 7 dias antes da janela) e fica entre as 3 versões mais novas (só um commit novo de `backend/` envia outra versão, e um run do mesmo commit encontra a tag e não envia nada).

**Independent Test**: `node --test deploy/cloudrun/workflow.test.mjs` passa (AC 1). M12 e M13 conferem AC 2 a 5 contra a produção.

---

## Edge Cases

- WHEN `copy` roda de novo depois de uma cópia que deu certo THEN it SHALL parar em `ERRO: o schema public do Supabase já tem <n> tabelas; a cópia só roda num banco vazio` (US-7, AC 7). A mesma regra recusa a cópia se uma revisão do Cloud Run tiver migrado o Supabase vazio por engano.
- IF o `pg_restore` falha no meio THEN o `public` do Supabase SHALL ficar sem tabelas, porque a restauração é uma transação só (US-7, AC 12).
- IF a revisão nova não passa na sonda de inicialização (boot, Flyway, senha errada, OOM) THEN o passo `deploy-cloudrun` SHALL falhar, a revisão SHALL não receber tráfego nem tag que funcione, e o `release` SHALL não rodar (US-4, AC 17). A migração que rodou não é desfeita (AD-016).
- IF um deploy roda antes de os secrets `spring-datasource-*` existirem THEN o Cloud Run SHALL recusá-lo na checagem de secrets, e nenhuma instância SHALL subir contra o Supabase (US-6, AC 9).
- IF dois pushes chegam enquanto um run está rodando THEN o GitHub SHALL manter só o mais novo na fila, e esse run SHALL publicar o commit mais novo de `backend/` e o Worker da árvore dele (US-4, AC 1 e 19).
- IF um commit de `backend/` chega a `main` depois do pré-build THEN o run seguinte SHALL procurar a tag do commit novo, não achar e construir; a imagem pré-construída SHALL nunca ir para o ar (US-4, AC 20; US-9, AC 10).
- WHEN um run `build-only` ou `rehearsal` roda de novo para o mesmo commit THEN `image` SHALL achar a tag e o run SHALL não testar, construir nem enviar de novo (US-4, AC 19).
- WHEN um push muda só o jogo THEN `plan` SHALL escrever `deploy=false` (o backend do serviço já é o mais novo) e o job `game` SHALL publicar o Worker.
- WHEN um push muda o backend e o jogo THEN o job `game` SHALL esperar o job `backend` e publicar só depois de `Backend <7> no ar no Cloud Run (<revisão>)`; nada espera o job `game`, então não há espera circular.
- WHEN o serviço ainda serve a revisão de exemplo do O10 (`us-docker.pkg.dev/cloudrun/container/hello`, que responde HTML) THEN `plan` SHALL tratar o `/health` como sem commit e escrever `live=none` (US-4, AC 3).
- IF a chamada de saúde do jogo falha na hora (servidor fora) THEN a mensagem `Cannot reach the server. Try again later.` SHALL aparecer sem esperar os 60 s (US-5, AC 5).
- IF o Supabase cai com o serviço no ar THEN o `/health` SHALL responder 503, a sonda de vida SHALL reiniciar a instância depois de 3 falhas seguidas (3 minutos), e as requisições SHALL falhar até o Supabase voltar; não há fallback.

---

## Mensagens

Todas as mensagens novas, exatamente como aparecem. `<...>` é o valor do caso. As de `checkDatabaseEnv` e `loadDatabaseEnv` já existem (T2).

| Onde | Texto |
| --- | --- |
| `GET /health` | `{"status":"UP","commit":"<commit>"}` · `{"status":"DOWN","commit":"<commit>"}` |
| `deploy/cloudrun/cloudRunRelease.mjs` (`plan`, `inspect`, `image`) | `Backend <7> vai para o Cloud Run (no ar: <7 \| nenhum>)` · `Backend <7> já está no Cloud Run; nada a fazer` · `ERRO: não foi possível ler o último commit de backend/` · `ERRO: falta a variável BACKEND_URL (URL do serviço do Cloud Run)` · `Tráfego: <revisão \| nenhuma revisão com 100%>` · `Tag <tag>: <revisão> <url>` · `ERRO: não foi possível ler o serviço infinity-grove-backend no Cloud Run (gcloud run services describe)` · `Imagem <7> já está no Artifact Registry; testes, build, regressão e push não rodam de novo` · `Imagem <7> não está no Artifact Registry; testes, build, regressão e push rodam agora` · `ERRO: falta a variável IMAGE (repositório do Artifact Registry)` · `Uso: node deploy/cloudrun/cloudRunRelease.mjs plan \| inspect \| image <commit> \| release <commit>` |
| `deploy/cloudrun/cloudRunRelease.mjs` (`release`) | `ERRO: a revisão de <7> (tag c-<7>) não está no serviço; o tráfego continua em <revisão \| nenhuma revisão>` · `ERRO: a revisão <revisão> de <7> não respondeu UP com o commit em <url>/health; o tráfego continua em <revisão \| nenhuma revisão>` · `ERRO: a regressão falhou em <7>; o tráfego continua em <revisão \| nenhuma revisão>` · `ERRO: não foi possível mandar o tráfego para <revisão>; o tráfego continua em <revisão \| nenhuma revisão>` · `Backend <7> no ar no Cloud Run (<revisão>)` · `ERRO: o serviço não respondeu <7> no /health depois da troca; o tráfego voltou para <revisão>` · `ERRO: o serviço não respondeu <7> no /health depois da troca e a volta para <revisão> falhou; rode gcloud run services update-traffic infinity-grove-backend --region southamerica-east1 --to-revisions <revisão>=100` · `ERRO: o serviço não respondeu <7> no /health depois da troca e não há revisão anterior; veja gcloud run revisions list --service infinity-grove-backend --region southamerica-east1` |
| Jogo, tela inicial | `Acordando o servidor, aguarde...` |
| `publish.sh` | `Production runs on Google Cloud Run since the cutover of spec supabase-postgres. publish.sh only brings back the local stack as the way back: ./publish.sh --way-back` · `Way back: set the GitHub variable CLOUD_RUN_PRODUCTION to false first, or the next push republishes the Worker to Cloud Run.` |
| `copyToSupabase.mjs` | `Supabase: Postgres <n>, schema public vazio` · `Pronto para copiar` · `Dump salvo em backups/<arquivo>.dump` · `Restaurado no Supabase (Postgres <n>)` · as linhas do `verify` (US-7, AC 14 e 15) · cada `ERRO: ...` de US-7 · `Uso: node deploy/db/copyToSupabase.mjs check \| copy \| verify` |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| SUPA-01 | P1: Session pooler - AC 1, 2, 3 (pool 5, ociosa 1, variáveis do Spring) | Tasks | Pending |
| SUPA-02 | P1: Session pooler - AC 4 a 18 (checagem do `.env`) | Tasks | Implementing (T1, T2 feitos) |
| SUPA-06 | P1: Segredos - AC 1 a 5 | Tasks | Implementing (T3 feito) |
| SUPA-07 | P1: Dados - AC 1 a 7, 18, 20 (pré-checagem e `check`) | Tasks | Pending |
| SUPA-08 | P1: Dados - AC 8 a 13, 19 (`copy`) | Tasks | Pending |
| SUPA-09 | P1: Dados - AC 14 a 17 (`verify`) | Tasks | Pending |
| SUPA-10 | P1: Testes nunca tocam no Supabase - AC 1, 2 | Tasks | Pending |
| SUPA-11 | P1: Virada e volta - AC 1 a 10 | Tasks | Pending |
| SUPA-12 | P2: Documentação - AC 1, 2, 3 | Tasks | Pending |
| RUN-01 | P1: Checagem de saúde - AC 1 a 5 | Tasks | Pending |
| RUN-02 | P1: Cloud Run roda o backend - AC 1 a 7 | Tasks | Pending |
| RUN-03 | P1: Revisão que falha - AC 1 a 5, 12, 13, 14 (`plan`, `inspect`, `image`) | Tasks | Pending |
| RUN-04 | P1: Revisão que falha - AC 6 a 11 (`release`, troca e volta) | Tasks | Pending |
| RUN-05 | P1: Revisão que falha - AC 15 a 24 (workflow, modos `build-only` e `rehearsal`, reuso da imagem) | Tasks | Pending |
| RUN-06 | P1: O jogo espera o servidor - AC 1 a 8 | Tasks | Pending |
| RUN-07 | P1: Segredos - AC 6 a 12 | Tasks | Pending |
| RUN-08 | P2: `publish.sh` só como volta - AC 1, 2 | Tasks | Pending |
| RUN-09 | P2: Custo - AC 1 a 6 | Tasks | Pending |

Renomeados na revisão 3: FLY-01 → RUN-01, FLY-03 → RUN-03, FLY-04 → RUN-04, FLY-05 → RUN-05, FLY-06 → RUN-06, FLY-07 → RUN-07, FLY-08 → RUN-08. FLY-02 (`backend/fly.toml`) saiu; RUN-02 é a configuração do serviço do Cloud Run. RUN-09 é novo. Removidos na revisão 2: SUPA-03, SUPA-04, SUPA-05.

**Coverage:** 18 total, 18 mapped to tasks, 0 unmapped

---

## Checagens

### O que o Verifier confere sem secrets

- `node --test "deploy/**/*.test.mjs"`: SUPA-02, 06, 07, 08, 09, RUN-02 (AC 1 a 4), RUN-03, 04, 05, 07 (AC 6, 7, 10, 11), RUN-09 (AC 1), com máquinas e arquivos falsos.
- `cd backend && ./gradlew ktlintCheck test`: SUPA-01, SUPA-10, RUN-01, RUN-02 (AC 5).
- `cd game && npm test` e `npx playwright test`: RUN-06.
- A revisão do `ui-artist` (`ui-review.html`): RUN-06 AC 3.

### O que só se confere contra a produção (T20 e T21, `gitops` com o dono)

- M1: `node deploy/db/copyToSupabase.mjs check` imprime `Pronto para copiar`.
- M2: `copy` termina com `Verificação OK`, e `Permissões do Data API: 0 OK` aparece.
- M3: `gcloud run services logs read infinity-grove-backend --region southamerica-east1 --limit 500` mostra, no boot da revisão da virada, `Schema "public" is up to date. No migration necessary.` e nenhum `HikariPool-1 - Exception during pool initialization`.
- M4: o job `backend` da virada imprime `Regressão OK` e `Backend <7> no ar no Cloud Run (<revisão>)`; `curl -s "<BACKEND_URL>/health"` imprime `{"status":"UP","commit":"<commit mais novo de backend/>"}`.
- M5: a conta anotada mostra no site o mesmo capítulo, etapa e cobre de antes da virada, com o `publish.sh` parado.
- M6: Supabase Dashboard > Observability > Shared Pooler client connections mostra no máximo 5 com o serviço no ar, e no máximo 10 durante o próximo deploy de backend.
- M7: Dashboard > Integrations > Data API mostra a Data API desligada.
- M8: a varredura de segredo da T21 imprime `senha fora do repositório` e `senha fora dos logs`.
- M9: antes da janela, o run manual com `mode=rehearsal` fica verde no GitHub Actions e o passo `inspect` imprime `Tráfego: <revisão de exemplo>` e `Tag probe: ...`.
- M10: com ninguém jogando por 20 minutos, Console > Cloud Run > `infinity-grove-backend` > Metrics > "Container instance count" chega a 0, e a primeira visita seguinte chega ao formulário em menos de 60 s.
- M11: `gcloud secrets list --format="value(name)"` mostra exatamente `jwt-secret`, `spring-datasource-password`, `spring-datasource-url` e `spring-datasource-username` depois da virada e só `jwt-secret` antes dela; `gcloud run services get-iam-policy infinity-grove-backend --region southamerica-east1` mostra `allUsers` com `roles/run.invoker`; `gcloud projects get-iam-policy <projeto> --flatten=bindings --filter="bindings.members:infinity-grove-run@" --format="value(bindings.role)"` imprime só `roles/secretmanager.secretAccessor`; a lista de chaves de usuário do `github-deployer` está vazia.
- M12: `gcloud artifacts repositories describe infinity-grove --location southamerica-east1` mostra as políticas `delete-older-than-30-days` e `keep-3-most-recent`; `gcloud billing budgets list --billing-account=<conta>` mostra `infinity-grove`; `gcloud secrets versions list <nome>` dos quatro secrets soma no máximo 6 versões `enabled` ou `disabled`.
- M13: um mês depois da virada, Console > Billing > Reports do projeto mostra no máximo US$ 1.
- M14: antes da janela, `git ls-remote --heads origin flyio-new-files` imprime nada e o dashboard do Fly não lista `infinity-grove-phaser`.
- M15: depois do O15 e de novo no passo 1 do runbook, `gcloud artifacts docker images list southamerica-east1-docker.pkg.dev/<projeto>/infinity-grove/backend --include-tags --format="value(tags)" | grep -c "$(git log -1 --format=%H origin/main -- backend)"` imprime `1`; no run da virada, o job `backend` imprime `Imagem <7> já está no Artifact Registry; testes, build, regressão e push não rodam de novo`, e o tempo do passo 3 ao passo 12 fica registrado no relatório.

---

## Success Criteria

- [ ] `Verificação OK` na virada, com o número de tabelas e de linhas do banco local.
- [ ] Um jogador existente continua de onde parou depois da virada, com o `publish.sh` parado.
- [ ] Zero ocorrência da senha em arquivo versionado, nos logs do Cloud Run e nos logs do workflow, e nenhuma chave de conta de serviço.
- [ ] O próximo push de backend depois da virada passa pelo workflow, cria uma revisão sem tráfego, passa no `/health` e na regressão da tag e imprime `Backend <7> no ar no Cloud Run (<revisão>)`.
- [ ] A primeira visita com o serviço escalado a zero chega ao formulário sem `Cannot reach the server`.
- [ ] O primeiro mês depois da virada fecha em no máximo US$ 1.
- [ ] Com a imagem pré-construída, o site fica fora do ar cerca de 15 minutos na virada.
