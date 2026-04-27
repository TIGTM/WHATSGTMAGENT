# sankhya-mcp

Servidor MCP (Model Context Protocol) para integração com a API Sankhya.
Permite que o Claude consulte, insira, atualize e delete dados diretamente no Sankhya ERP.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- Credenciais de API do Sankhya (`client_id` e `client_secret`)

---

## Instalação

```bash
# Clone ou copie o projeto para uma pasta local
cd sankhya-mcp

# Instale as dependências
npm install
```

---

## Configuração do .env

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
SANKHYA_CLIENT_ID=seu_client_id_aqui
SANKHYA_CLIENT_SECRET=seu_client_secret_aqui
```

> As credenciais são obtidas no portal de desenvolvedores Sankhya: https://developer.sankhya.com.br

---

## Testando localmente

```bash
node index.js
```

O servidor ficará aguardando conexões via `stdio`. Você verá no terminal:

```
[sankhya-mcp] Servidor iniciado e aguardando conexões via stdio...
```

---

## Adicionando o MCP no Claude Desktop

1. Abra (ou crie) o arquivo de configuração do Claude Desktop:

   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

2. Adicione a entrada abaixo dentro da chave `mcpServers`:

```json
{
  "mcpServers": {
    "sankhya": {
      "command": "node",
      "args": ["C:/caminho/absoluto/para/sankhya-mcp/index.js"],
      "env": {
        "SANKHYA_CLIENT_ID": "seu_client_id_aqui",
        "SANKHYA_CLIENT_SECRET": "seu_client_secret_aqui"
      }
    }
  }
}
```

> Substitua `C:/caminho/absoluto/para/sankhya-mcp/index.js` pelo caminho real na sua máquina.
> Se preferir usar o `.env`, remova o bloco `"env"` e garanta que o `.env` está na pasta do projeto.

3. Reinicie o Claude Desktop. O MCP estará disponível.

---

## Adicionando o MCP no Claude Code (CLI)

Execute o comando abaixo na pasta do projeto ou de qualquer lugar (usando o caminho absoluto):

```bash
claude mcp add sankhya node /caminho/absoluto/para/sankhya-mcp/index.js
```

---

## Tools disponíveis

### `sankhya_query`
Busca registros de qualquer entidade via `DatasetSP.load`.

| Parâmetro       | Tipo       | Obrigatório | Descrição                                              |
|-----------------|------------|-------------|--------------------------------------------------------|
| `entidade`      | `string`   | Sim         | Nome da entidade (ex: `"Parceiro"`, `"Produto"`)       |
| `campos`        | `string[]` | Sim         | Campos a retornar (ex: `["CODPARC", "NOMEPARC"]`)      |
| `criteria`      | `string`   | Não         | Filtro (ex: `"CODPARC = 1"`)                           |
| `pagina`        | `number`   | Não         | Página de resultados (padrão: `1`)                     |
| `itensPorPagina`| `number`   | Não         | Itens por página (padrão: `50`)                        |

**Exemplo de prompt:**
> "Liste os 10 primeiros parceiros ativos com código, nome e CPF/CNPJ"

---

### `sankhya_save`
Insere ou atualiza registros via `DatasetSP.save`.

| Parâmetro   | Tipo       | Obrigatório | Descrição                                                       |
|-------------|------------|-------------|---------------------------------------------------------------- |
| `entidade`  | `string`   | Sim         | Nome da entidade (ex: `"Parceiro"`)                             |
| `registros` | `object[]` | Sim         | Array de objetos com campos e valores                           |

**Exemplo de prompt:**
> "Cadastre um novo parceiro com nome 'Empresa Teste', CNPJ '00.000.000/0001-00' e tipo Jurídica"

---

### `sankhya_delete`
Deleta registros via `DatasetSP.remove`.

| Parâmetro | Tipo       | Obrigatório | Descrição                                        |
|-----------|------------|-------------|--------------------------------------------------|
| `entidade`| `string`   | Sim         | Nome da entidade                                  |
| `chaves`  | `object[]` | Sim         | Array com as chaves primárias a excluir           |

**Exemplo de prompt:**
> "Delete o parceiro de código 999 da entidade Parceiro"

---

### `sankhya_execute`
Executa qualquer serviço genérico da API Sankhya.

| Parâmetro     | Tipo     | Obrigatório | Descrição                                                  |
|---------------|----------|-------------|------------------------------------------------------------|
| `serviceName` | `string` | Sim         | Nome do serviço (ex: `"FinanceiroSP.baixarTitulo"`)        |
| `outputType`  | `string` | Não         | Tipo de saída (padrão: `"json"`)                           |
| `requestBody` | `object` | Não         | Corpo da requisição específico do serviço                  |

---

## Estrutura do projeto

```
sankhya-mcp/
├── auth.js          # Autenticação e renovação automática do token Bearer
├── sankhya.js       # Cliente HTTP com funções query/save/delete/execute
├── index.js         # Servidor MCP com definição das tools
├── .env             # Credenciais (não versionado)
├── .env.example     # Modelo de configuração
├── .gitignore
├── package.json
└── README.md
```

---

## Renovação do token

O token da API Sankhya expira em **300 segundos**. O módulo `auth.js` renova automaticamente o token a cada **290 segundos**, garantindo que as requisições nunca falhem por expiração. Nenhuma ação manual é necessária.
