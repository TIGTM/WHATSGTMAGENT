# GTM Alimentos - Agente WhatsApp (Baileys)

Bot de WhatsApp com IA, integrado ao Sankhya ERP, pronto para rodar em VPS 24/7.

## Principais capacidades

- Atendimento por persona (cliente, colaborador, fornecedor, parceiro e diretoria).
- Respostas com IA usando:
	- Gemini (API)
	- Ollama (modelo local gratuito na VPS)
- Consulta no Sankhya (query e SQL).
- Execucao de comandos no Sankhya (save, delete, execute e REST mutavel), com trava por ambiente.

## Requisitos

- Node.js 18+
- Conta de WhatsApp para autenticar via QR Code
- Para IA gratuita local:
	- Ollama instalado na VPS
	- Um modelo local carregado (ex: llama3.2)

## Instalacao local

1. Instale dependencias:

	 npm install

2. Copie o ambiente:

	 cp .env.example .env

3. Preencha o .env:

- Credenciais Sankhya:
	- SANKHYA_CLIENT_ID
	- SANKHYA_CLIENT_SECRET
	- SANKHYA_APPKEY
- PIN da diretoria:
	- DIRECTOR_PIN
- IA:
	- LLM_PROVIDER=ollama (gratuito local) ou gemini
	- OLLAMA_BASE_URL
	- OLLAMA_MODEL
	- GEMINI_API_KEY (somente se usar Gemini)
- Escrita no ERP:
	- ERP_WRITE_ENABLED=false (padrao)
	- ERP_WRITE_ENABLED=true para liberar comandos de escrita

## Execucao

- Desenvolvimento:

	npm run dev

- Producao:

	npm start

No primeiro start, escaneie o QR code no terminal.

## Gemini API (recomendado para assertividade)

Para usar Gemini como provedor principal:

1. Gere sua chave no Google AI Studio.
2. Configure no .env:

	LLM_PROVIDER=gemini
	GEMINI_API_KEY=SUA_CHAVE_AQUI
	GEMINI_MODEL=gemini-2.5-flash
	ERP_DIRECT_FASTPATH=true
	MAX_GLOBAL_CONTEXT_CHARS=4000
	WA_FIRE_INIT_QUERIES=false
	WA_QUERY_TIMEOUT_MS=240000
	WA_CONNECT_TIMEOUT_MS=90000
	WA_KEEPALIVE_INTERVAL_MS=15000
	WA_RECONNECT_BASE_DELAY_MS=2000
	WA_RECONNECT_MAX_DELAY_MS=30000

Bloco Ollama (opcional, mantenha comentado se nao for usar):

	# OLLAMA_BASE_URL=http://127.0.0.1:11434
	# OLLAMA_MODEL=llama3.2
	# OLLAMA_TIMEOUT_MS=180000
	# OLLAMA_NUM_CTX=2048
	# OLLAMA_NUM_PREDICT=256

Se aparecer "init queries" com status 408 no Baileys, mantenha WA_FIRE_INIT_QUERIES=false e use WA_QUERY_TIMEOUT_MS entre 240000 e 300000.

## Operacoes no Sankhya

Ferramentas disponiveis no motor de IA:

- sankhya_query
- sankhya_sql
- sankhya_save
- sankhya_delete
- sankhya_execute
- sankhya_rest

Importante:

- Escrita no ERP so executa quando ERP_WRITE_ENABLED=true.
- Com ERP_WRITE_ENABLED=false, qualquer tentativa de escrita retorna erro controlado.

## Deploy VPS 24/7 com PM2

1. Clone projeto na VPS:

	 git clone <repo-url>
	 cd whatsAppGTM
	 npm install

2. Configure .env (mesmas variaveis citadas acima).

3. Inicie com PM2:

	 npm install -g pm2
	 pm2 start ecosystem.config.cjs
	 pm2 save
	 pm2 startup

4. Logs:

	 pm2 logs whatsapp-gtm

5. Atualizacao via Git:

	 git pull
	 npm install
	 pm2 restart whatsapp-gtm

## Estrutura principal

- src/index.js - bootstrap
- src/whatsapp.js - conexao/eventos WhatsApp
- src/agent.js - regras de conversa e prompt
- src/gemini.js - camada de IA (Gemini + Ollama + tools ERP)
- src/sankhya/auth.js - OAuth Sankhya
- src/sankhya/sankhya-api.js - cliente ERP (query, sql, save, delete, execute, rest)
- ecosystem.config.cjs - execucao com PM2

## Observacoes

- API nao oficial do WhatsApp pode sofrer bloqueios/limitacoes.
- Para escala critica, considerar migracao para WhatsApp Business API oficial.
- Nunca commitar o .env.
