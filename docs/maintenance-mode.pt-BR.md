# Modo de manutenção

O aviso é controlado pelo arquivo `maintenance.json`, montado no frontend por volume. Por isso, o banner continua visível mesmo quando o backend está sendo reiniciado.

No Bitvise, dentro da pasta do projeto:

```bash
cd /root/ticketz-custom
chmod +x scripts/maintenance.sh
./scripts/maintenance.sh on "O sistema está em atualização. Aguarde." "10 minutos"
```

Depois execute os comandos normais de atualização. Por exemplo:

```bash
git pull --ff-only origin main
docker compose -p ticketz-docker-acme \
  -f /root/ticketz-custom/docker-compose-acme.yaml \
  up -d --build backend frontend
```

Quando terminar e confirmar que o sistema está funcionando:

```bash
./scripts/maintenance.sh off
```

O frontend consulta o arquivo a cada 15 segundos. Assim, normalmente não é necessário reiniciar o container frontend para ligar ou desligar o aviso.

Também é possível alterar somente a mensagem:

```bash
./scripts/maintenance.sh on "Estamos aplicando uma atualização. Tente novamente em instantes." "5 minutos"
```

Não remova o volume abaixo dos arquivos Compose:

```yaml
- ./maintenance.json:/var/www/public/maintenance.json:ro
```
