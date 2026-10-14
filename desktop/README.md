# Ticketz para Windows

Aplicativo Electron que abre o Ticketz da VPS em uma janela própria. O backend, banco, Redis e WhatsApp continuam na VPS.

## URL da VPS

Edite `config.json` antes de gerar o instalador:

```json
{
  "appUrl": "https://chat.camponovo.ro.gov.br"
}
```

## Desenvolvimento

```bash
npm install
npm start
```

## Gerar instalador

```bash
npm install
npm run dist:win
```

Os arquivos serão gerados em `desktop/dist/`:

- `Ticketz-Setup-1.0.0.exe`: instalador Windows;
- `Ticketz-Setup-1.0.0.exe` ou pacote portátil conforme o alvo produzido pelo electron-builder.

O aplicativo precisa de acesso à internet para conectar ao backend da VPS.
