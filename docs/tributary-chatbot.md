# Consulta de Dívida Ativa e IPTU no chatbot

A integração é controlada por variáveis de ambiente no backend. Os tokens não devem ser gravados no Git, no frontend, em páginas públicas ou em arquivos de cache.

## Variáveis do backend

```env
TRIBUTARY_ENABLED=false
TRIBUTARY_API_URL=https://transparencia.camponovo.ro.gov.br/transparencia/api/api.php
TRIBUTARY_API_TIMEOUT_MS=30000
TRIBUTARY_DIVIDA_API_ID=127
TRIBUTARY_DIVIDA_API_TOKEN=COLOQUE_O_TOKEN_DA_API_DE_DIVIDA_ATIVA
TRIBUTARY_IPTU_MAPPING_API_ID=342
TRIBUTARY_IPTU_MAPPING_API_TOKEN=COLOQUE_O_TOKEN_DA_API_DE_CONTRIBUINTES
TRIBUTARY_IPTU_API_ID=1004
TRIBUTARY_IPTU_API_TOKEN=COLOQUE_O_TOKEN_DA_API_DE_IPTU
```

Use os tokens oficiais fornecidos pela Prefeitura. Não reutilize credenciais que tenham sido publicadas no repositório externo; elas devem ser revogadas e substituídas.

## Configuração da fila

Crie uma fila, por exemplo:

```text
Dívida Ativa / IPTU
```

Depois crie duas opções de primeiro nível:

```text
1 - Consultar Dívida Ativa
2 - Consultar IPTU
3 - Falar com atendente
```

O backend reconhece automaticamente `Dívida Ativa` e `IPTU` no título ou na mensagem da opção. Também é possível usar os marcadores técnicos `[ticketz:divida-ativa]` e `[ticketz:iptu]` na mensagem da opção.

Após o usuário escolher uma dessas opções, o chatbot solicita CPF ou CNPJ, consulta a API da Prefeitura e envia um resumo dos registros encontrados. O ticket continua disponível para atendimento humano.

## Ativação

1. Configure as variáveis no `.env` do backend.
2. Comece com `TRIBUTARY_ENABLED=false` e valide os tokens separadamente.
3. Altere para `TRIBUTARY_ENABLED=true`.
4. Recrie o backend para carregar as variáveis.
5. Teste Baileys/WhatsApp Web e Cloud API separadamente.

O serviço usa cache em memória de cinco minutos para reduzir consultas repetidas à API externa. O cache não grava CPF, CNPJ ou dados tributários em disco.

## Limitações atuais

A integração consulta e resume débitos. Ela não emite boleto. A emissão de boleto exige uma API oficial da Prefeitura; nenhuma linha digitável fictícia deve ser apresentada como documento válido.
