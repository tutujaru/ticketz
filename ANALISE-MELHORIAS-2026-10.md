# Análise do Ticketz e sugestões de melhorias

## Estado analisado

- Repositório: `tutujaru/ticketz`
- Branch analisada: `main`
- O remoto possuía dois commits adicionais de correção de transferência de tickets, que devem ser incorporados antes do próximo desenvolvimento:
  - `06dac32 fix(tickets): validate transfer identifiers`
  - `e9e02a7 fix(tickets): list all user queues on transfer`
- O projeto é dividido em `backend` (Node.js + TypeScript + Express + Sequelize) e `frontend` (React + Material UI).
- O backend já possui Bull/Redis para processamento assíncrono e Socket.IO para atualização em tempo real.

## Pontos positivos

1. **Separação razoável por serviços**: filas, tickets, conexões e chatbot possuem services/controllers próprios.
2. **Relacionamento de filas bem modelado**: `Whatsapp` e `Queue` usam a tabela associativa `WhatsappQueues`.
3. **Chatbot hierárquico existente**: `QueueOption` suporta opções filhas, fila de encaminhamento e saída do chatbot.
4. **Auditoria de transferência**: existe `TicketTransferLog`, incluindo usuário, empresa, conexão e fila de origem/destino.
5. **Atualização em tempo real**: Socket.IO já é usado para eventos de tickets, filas e mensagens.
6. **Teste de transferência**: foi criado teste unitário para transferência entre conexões/empresas.

## Problemas e riscos encontrados

### 1. Typebot e n8n ainda não estão integrados
Não foram encontrados modelos, telas, services ou rotas específicas para Typebot ou n8n. Hoje, o fluxo automático está implementado internamente com `QueueOption` e `startQueue`.

### 2. Integrações externas ainda não possuem uma camada comum
Há chamadas externas pontuais, mas não existe um `IntegrationService` com:

- timeout;
- retry com backoff;
- idempotência;
- assinatura/autenticação;
- registro de sucesso e falha;
- fila de reprocessamento.

### 3. Eventos e efeitos colaterais misturados na atualização de ticket
`UpdateTicketService` atualiza banco, tracking, Socket.IO, chatbot e mensagens WhatsApp no mesmo fluxo. Isso dificulta testes e pode causar inconsistência quando uma operação externa falha depois da gravação do ticket.

### 4. Segurança de logs
O código gerava logs contendo os segredos JWT. Isso foi corrigido nesta revisão: agora os logs informam apenas o nome da chave, nunca o valor.

Ainda é recomendável revisar o logger de requisições para garantir que `Authorization`, cookies, senhas, tokens e corpos sensíveis nunca sejam registrados em produção.

### 5. Testes de integração insuficientes
Existem poucos testes de serviço. Recomenda-se adicionar:

- teste HTTP da rota `PUT /tickets/:ticketId`;
- teste de autorização entre empresas;
- teste de conexão sem fila;
- teste de fila que não pertence à conexão;
- teste de ticket duplicado no destino;
- teste de eventos Socket.IO;
- teste de retry de integração externa.

### 6. Consultas potencialmente pesadas
O endpoint de destinos de transferência carrega empresas, conexões, usuários e filas. Em ambientes com muitas empresas, isso pode gerar resposta grande. Recomenda-se paginação, busca por empresa e carregamento sob demanda.

## Melhorias aplicadas nesta revisão

### Scripts de teste compatíveis com Windows
Foi adicionada a dependência `cross-env` e os scripts de teste foram ajustados para funcionar em Windows, Git Bash e Linux:

```json
"pretest": "cross-env NODE_ENV=test sequelize db:migrate && cross-env NODE_ENV=test sequelize db:seed:all",
"test": "cross-env NODE_ENV=test jest",
"posttest": "cross-env NODE_ENV=test sequelize db:migrate:undo:all"
```

No Windows, a execução deve ser feita dentro de `backend`:

```bash
cd backend
npm test -- --runInBand
```

## Proposta para usar Typebot ou n8n na fila

A implementação precisa de uma escolha funcional, porque Typebot e n8n têm papéis diferentes.

### Opção A — Typebot por fila

Ao selecionar uma fila, o Ticketz inicia ou continua uma sessão Typebot para o contato.

Configurações sugeridas por fila:

- `automationType`: `none` ou `typebot`;
- `typebotUrl`;
- `typebotId`;
- `typebotApiKey` armazenada com proteção;
- mensagem inicial;
- comportamento ao concluir o bot.

Fluxo:

1. mensagem recebida cria/atualiza o ticket;
2. Ticketz envia a mensagem ao Typebot;
3. Typebot retorna texto, mídia ou comando;
4. Ticketz envia a resposta pelo WhatsApp;
5. ao concluir, o ticket vai para fila/usuário humano.

### Opção B — n8n por fila

Ao entrar em uma fila, o Ticketz envia um evento para um webhook do n8n.

Payload recomendado:

```json
{
  "event": "ticket.message.received",
  "ticketId": 123,
  "companyId": 10,
  "queueId": 20,
  "whatsappId": 30,
  "contact": {
    "id": 40,
    "name": "Contato",
    "number": "5511999999999"
  },
  "message": {
    "id": "abc",
    "body": "Mensagem recebida",
    "fromMe": false
  },
  "callbackUrl": "https://ticketz.example/api/integrations/n8n/callback"
}
```

O n8n poderia responder por callback para:

- enviar mensagem;
- escolher fila;
- atribuir usuário;
- fechar ticket;
- transferir para outra empresa/conexão.

### Recomendação

Começar pela **Opção B (n8n)**, porque é mais flexível e não obriga o Ticketz a implementar todo o protocolo de sessão do Typebot. A primeira versão deve ser assíncrona e ter:

1. webhook configurável por fila;
2. segredo/HMAC por integração;
3. timeout de 5–10 segundos;
4. retry com backoff;
5. tabela de eventos de integração;
6. idempotency key baseada em `messageId` ou `ticketId + updatedAt`;
7. callback autenticado para ações no ticket;
8. opção de falha silenciosa ou transferência para atendimento humano.

Depois, Typebot pode ser adicionado usando a mesma camada de integração.

## Próximas melhorias prioritárias

1. Implementar a camada de integrações assíncronas.
2. Adicionar configuração de automação por fila.
3. Criar callback seguro para o n8n.
4. Adicionar Typebot como provider da mesma camada.
5. Separar atualização do ticket e efeitos externos usando eventos/outbox.
6. Adicionar testes HTTP e de autorização multiempresa.
7. Revisar logs para remover headers/cookies e dados sensíveis.
8. Paginar o endpoint de destinos de transferência.
9. Adicionar índices para consultas de tickets por empresa, status, fila e conexão.
10. Atualizar documentação de instalação, migrations e testes para Windows.

## Decisão necessária para a implementação da fila

Antes de adicionar campos e comportamento à tela de filas, é necessário escolher:

- **Typebot**: a fila inicia uma conversa automatizada diretamente no Typebot;
- **n8n**: a fila dispara um webhook e o workflow externo decide as ações;
- **ambos**: a fila possui um seletor de provider (`Nenhum`, `Typebot`, `n8n`).

A recomendação técnica é implementar primeiro `n8n` e deixar a arquitetura preparada para Typebot.
