#!/usr/bin/env bash
# Uso: ./teste_crud.sh [PORTA] [URL_BASE]
PORT="${1:-3000}"
HOST="${2:-http://localhost}"
BASE="${HOST}:${PORT}/api/v1"
TMP="$(mktemp)"
FALHAS=0
SUCESSOS=0
trap 'rm -f "$TMP"' EXIT

command -v jq >/dev/null 2>&1 || { echo "ERRO: jq nao instalado (sudo apt install -y jq)"; exit 1; }

passo() {
    local titulo="$1" esperado="$2" metodo="$3" url="$4" corpo="$5" codigo
    if [ -n "$corpo" ]; then
        codigo=$(curl -s -o "$TMP" -w '%{http_code}' -X "$metodo" "$url" \
            -H 'Content-Type: application/json' -d "$corpo")
    else
        codigo=$(curl -s -o "$TMP" -w '%{http_code}' -X "$metodo" "$url")
    fi
    if [ "$codigo" = "$esperado" ]; then
        echo "[OK   $codigo] $titulo ($metodo ${url#$HOST})"
        SUCESSOS=$((SUCESSOS + 1))
    else
        echo "[FALHA $codigo, esperado $esperado] $titulo ($metodo ${url#$HOST})"
        FALHAS=$((FALHAS + 1))
    fi
    jq -c . "$TMP" 2>/dev/null || cat "$TMP"
}

echo "=== AUDITORIA FINAL | $(date '+%d/%m/%Y %H:%M:%S') | API em ${HOST}:${PORT} ==="

passo "Health check" 200 GET "$BASE/health"
if [ "$FALHAS" -gt 0 ]; then
    echo "API fora do ar em ${HOST}:${PORT}. Suba com: PORT=${PORT} node frota_api.js &"
    exit 1
fi

passo "Cadastrar veiculo A" 201 POST "$BASE/veiculos" \
    '{"placa":"VWX-5555","montadora":"Volkswagen","modelo":"Delivery"}'
ID_A=$(jq -r '.id' "$TMP")

passo "Cadastrar veiculo B" 201 POST "$BASE/veiculos" \
    '{"placa":"KLL-9090","montadora":"Volvo","modelo":"FH 540"}'
ID_B=$(jq -r '.id' "$TMP")
echo ">> IDs capturados via jq: A=$ID_A | B=$ID_B"

passo "POST invalido (sem placa)" 400 POST "$BASE/veiculos" \
    '{"montadora":"Volvo","modelo":"FH 540"}'

passo "PATCH status do A" 200 PATCH "$BASE/veiculos/$ID_A/status" \
    '{"status":"MANUTENCAO"}'

passo "PUT substitui A por completo" 200 PUT "$BASE/veiculos/$ID_A" \
    '{"placa":"NEW-0001","montadora":"Scania","modelo":"G410","status":"EM_ROTA"}'

passo "DELETE do B" 200 DELETE "$BASE/veiculos/$ID_B"

passo "GET do B deletado (tem que dar 404)" 404 GET "$BASE/veiculos/$ID_B"

passo "Listagem final" 200 GET "$BASE/veiculos"

echo "=== RESUMO: $SUCESSOS ok | $FALHAS falha(s) ==="
[ "$FALHAS" -eq 0 ]
