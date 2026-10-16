# Webchat no WordPress — CRM - CNRO

O Webchat público fica disponível no endereço:

```text
https://SEU-DOMINIO/webchat.html
```

Substitua `SEU-DOMINIO` pelo domínio onde o frontend do CRM está publicado.

## Antes de divulgar

1. No CRM, verifique se cada conexão possui um valor preenchido no campo `channel`.
2. Vincule as filas desejadas a cada conexão.
3. Publique/recrie o container do frontend e do backend.
4. Teste diretamente no navegador:

```text
https://SEU-DOMINIO/webchat.html
```

O visitante verá as conexões públicas e, depois de escolher uma, somente as filas vinculadas àquela conexão.

## Opção recomendada: bloco HTML no WordPress

No painel do WordPress:

1. Abra **Páginas** → **Adicionar nova** ou edite a página de atendimento.
2. Adicione o bloco **HTML personalizado**.
3. Cole:

```html
<div style="width:100%;max-width:480px;margin:0 auto;">
  <iframe
    src="https://SEU-DOMINIO/webchat.html"
    title="Atendimento online"
    style="display:block;width:100%;height:760px;border:0;border-radius:18px;overflow:hidden;"
    loading="lazy"
    allow="clipboard-write"
  ></iframe>
</div>
```

4. Troque `SEU-DOMINIO` pelo endereço real do CRM.
5. Publique a página.

## Usar uma conexão específica

Para abrir o Webchat já filtrado para uma conexão específica, utilize o parâmetro `channel` quando o valor for configurado para esse comportamento na implantação. Para a versão com seleção de conexão, use o endereço sem esse filtro:

```html
<iframe
  src="https://SEU-DOMINIO/webchat.html"
  title="Webchat CRM - CNRO"
  style="width:100%;height:760px;border:0;"
></iframe>
```

## Botão que abre o Webchat

Se preferir um botão no site:

```html
<a
  href="https://SEU-DOMINIO/webchat.html"
  target="_blank"
  rel="noopener"
  style="display:inline-block;padding:12px 20px;border-radius:8px;background:#12633f;color:#fff;text-decoration:none;font-weight:700;"
>
  Falar com atendimento
</a>
```

## Página em tela cheia

Para usar o Webchat como página própria do WordPress:

```html
<iframe
  src="https://SEU-DOMINIO/webchat.html"
  title="Atendimento online"
  style="position:fixed;inset:0;width:100%;height:100%;border:0;"
></iframe>
```

## Fluxo para o cidadão

1. Escolher o setor/conexão;
2. Escolher a fila de atendimento;
3. Informar o nome;
4. Informar o telefone, opcionalmente;
5. Escrever a mensagem inicial;
6. Receber o protocolo;
7. Conversar com o atendente pelo Webchat.

As respostas enviadas pelo atendente no CRM aparecem no Webchat automaticamente por atualização periódica.

## Teste rápido

Depois de publicar:

1. Abra a página em uma janela anônima;
2. Escolha um setor;
3. Confirme se as filas mudam conforme a conexão;
4. Inicie um atendimento;
5. Confirme se o ticket apareceu na fila no CRM;
6. Responda pelo CRM;
7. Confirme se a resposta aparece no Webchat.

## Observações de segurança

- Não cole tokens internos do CRM no WordPress.
- Use sempre HTTPS.
- Não remova a validação de fila no backend.
- O visitante recebe somente um token temporário da sessão pública.
- O iframe deve apontar para o domínio real do CRM, não para `localhost`.
