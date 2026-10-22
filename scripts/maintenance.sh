#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="${ROOT_DIR}/maintenance.json"

usage() {
  echo "Uso: $0 on [mensagem] [previsao] | $0 off"
  echo "Exemplo: $0 on 'Sistema em atualização. Aguarde.' '10 minutos'"
}

if [[ "${1:-}" != "on" && "${1:-}" != "off" ]]; then
  usage
  exit 1
fi

if [[ "$1" == "off" ]]; then
  enabled=false
  message="O sistema está em atualização. Aguarde alguns minutos para acessar novamente."
  eta=""
else
  enabled=true
  message="${2:-O sistema está em atualização. Aguarde alguns minutos para acessar novamente.}"
  eta="${3:-}"
fi

TEMP_FILE="$(mktemp "${FILE}.XXXXXX")"
trap 'rm -f "$TEMP_FILE"' EXIT

python3 - "$TEMP_FILE" "$enabled" "$message" "$eta" <<'PY'
import json
import sys

path, enabled, message, eta = sys.argv[1:]
payload = {
    "enabled": enabled.lower() == "true",
    "message": message,
    "eta": eta,
}
with open(path, "w", encoding="utf-8") as handle:
    json.dump(payload, handle, ensure_ascii=False, indent=2)
    handle.write("\n")
PY

chmod 644 "$TEMP_FILE"

mv "$TEMP_FILE" "$FILE"
trap - EXIT

if [[ "$enabled" == "true" ]]; then
  echo "Aviso de manutenção ativado."
else
  echo "Aviso de manutenção desativado."
fi
