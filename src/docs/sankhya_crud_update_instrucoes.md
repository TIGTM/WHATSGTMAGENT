# UPDATE de campos no Sankhya Om — Método Definitivo

## ⚠️ REGRA ABSOLUTA
**NUNCA use** `sankhya_execute`, `sankhya_rest`, `sankhya_save`, `sankhya_sql` ou qualquer MCP tool para fazer UPDATE.
**SEMPRE use** `mcp__Claude_in_Chrome__javascript_tool` no tab do Sankhya (porta 9745) com `XMLHttpRequest` e `Content-Type: text/xml`.

---

## Fluxo obrigatório (3 passos)

### Passo 1 — Buscar os registros via `sankhya_sql`
```sql
SELECT FIN.NUFIN, CONVERT(VARCHAR(10), CAB.DTMOV, 103) AS DTMOV_FMT
FROM TGFFIN FIN
INNER JOIN TGFCAB CAB ON FIN.NUNOTA = CAB.NUNOTA
WHERE FIN.DTVENC = '{YYYYMMDD}'
  AND FIN.AD_DTCOP IS NULL
```

### Passo 2 — Executar o UPDATE via `javascript_tool` no browser

Usar o tab do Sankhya (porta 9745, já autenticado). Rodar este código JavaScript:

```javascript
var records = [
  {nufin: 123290, dt: "18/01/2026"},
  // ... todos os registros do passo 1
];

var mgeSession = 'HDIQP2fNTxRUekid1R3arMEo5BpdjUqkRNfraciV'; // session do tab ativo
var url = 'http://gtm.nuvemdatacom.com.br:9745/mge/service.sbr?serviceName=CRUDServiceProvider.saveRecord&outputType=xml&mgeSession=' + mgeSession;
var success = 0, errors = [];

for (var i = 0; i < records.length; i++) {
  var r = records[i];
  var xml = '<serviceRequest serviceName="CRUDServiceProvider.saveRecord"><requestBody>' +
    '<dataSet rootEntity="Financeiro" includePresentationFields="S" parallelFields="false">' +
    '<entity path=""><fieldset list="NUFIN,AD_DTCOP"/></entity>' +
    '<dataRow><localFields><NUFIN>' + r.nufin + '</NUFIN><AD_DTCOP>' + r.dt + ' 00:00:00</AD_DTCOP></localFields>' +
    '<key><NUFIN>' + r.nufin + '</NUFIN></key></dataRow></dataSet></requestBody></serviceRequest>';

  var xhr = new XMLHttpRequest();
  xhr.open('POST', url, false);
  xhr.setRequestHeader('Content-Type', 'text/xml');
  xhr.send(xml);

  if (xhr.responseText.indexOf('status="1"') >= 0) success++;
  else errors.push({nufin: r.nufin, resp: xhr.responseText.substring(0, 200)});
}

JSON.stringify({total: records.length, success: success, errors: errors});
```

### Passo 3 — Verificar via `sankhya_sql`
```sql
SELECT COUNT(*) AS RESTAM_NULOS
FROM TGFFIN
WHERE DTVENC = '{YYYYMMDD}' AND AD_DTCOP IS NULL
```
Deve retornar 0.

---

## Por que os outros métodos não funcionam

| Método | Erro |
|--------|------|
| `DbExplorerSP.executeQuery` com UPDATE | "Expected EOF at line 1 column 17" — rejeita DML |
| `DatasetSP.save` / `sankhya_save` | Erro de validação DTVENC ou muda para INSERT |
| `CRUDServiceProvider.saveRecord` via JSON (`outputType=json`) | "Expected EOF" |
| `CRUDServiceProvider.saveRecord` com atributos XML (`value=""`) | "EntityPrimaryKey não pode ser null" |
| Cloud gateway (`api.sankhya.com.br`) | Retorna "JsonObject" silencioso — não executa DML |

---

## Formato XML correto (crítico)

✅ **Correto — text content:**
```xml
<NUFIN>123290</NUFIN>
```

❌ **Errado — atributo:**
```xml
<NUFIN value="123290"/>
```

---

## Comando para solicitar

> "Preencha o AD_DTCOP dos financeiros com DTVENC = 'DD/MM/YYYY' que estão nulos, usando o DTMOV da TGFCAB pelo NUNOTA. Use `javascript_tool` no browser com `CRUDServiceProvider.saveRecord` via XML."
