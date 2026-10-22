#!/bin/bash

LOG_FILE="crud_result.log"
echo "=== LOG DE EXECUCAO DO TESTE CRUD ===" > $LOG_FILE

echo -e "\n1. Cadastrando primeiro veiculo..." >> $LOG_FILE
curl -s -X POST http://localhost:3009/api/v1/veiculos \
  -H "Content-Type: application/json" \
  -d '{"placa":"AAA-1111","montadora":"Volvo","modelo":"VM"}' >> $LOG_FILE
echo "" >> $LOG_FILE

echo -e "\n2. Cadastrando segundo veiculo..." >> $LOG_FILE
curl -s -X POST http://localhost:3009/api/v1/veiculos \
  -H "Content-Type: application/json" \
  -d '{"placa":"BBB-2222","montadora":"Scania","modelo":"R450"}' >> $LOG_FILE
echo "" >> $LOG_FILE

echo -e "\n3. Atualizando status do veiculo ID 3..." >> $LOG_FILE
curl -s -X PATCH http://localhost:3009/api/v1/veiculos/3/status \
  -H "Content-Type: application/json" \
  -d '{"status":"EM_ROTA"}' >> $LOG_FILE
echo "" >> $LOG_FILE

echo -e "\n4. Removendo veiculo ID 4..." >> $LOG_FILE
curl -s -X DELETE http://localhost:3009/api/v1/veiculos/4 >> $LOG_FILE
echo "" >> $LOG_FILE

echo -e "\n=== FIM DOS TESTES ===" >> $LOG_FILE
