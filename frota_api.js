const express = require('express');
const app = express();

// MISSAO 2: porta dinamica via variavel de ambiente
const PORT = process.env.PORT || 3000;

// MISSAO 1: middleware global ANTES de qualquer rota
app.use(express.json());

// Banco de dados em memoria
let veiculos = [
    { id: 1, placa: "ABC-1234", montadora: "Scania", modelo: "R450", status: "DISPONIVEL" },
    { id: 2, placa: "XYZ-9876", montadora: "Mercedes-Benz", modelo: "Actros", status: "EM_ROTA" }
];

// Contador de ID: nunca repete, mesmo depois de DELETE
let proximoId = Math.max(...veiculos.map(v => v.id)) + 1;

const mb = (bytes) => Math.round((bytes / 1024 / 1024) * 100) / 100;

// GET /api/v1/health - Status da API
app.get('/api/v1/health', (req, res) => {
    const mem = process.memoryUsage();
    res.status(200).json({
        status: "ok",
        uptime_segundos: Math.round(process.uptime()),
        memoria_mb: { rss: mb(mem.rss), heapTotal: mb(mem.heapTotal), heapUsed: mb(mem.heapUsed) },
        timestamp: new Date().toISOString()
    });
});

// GET /api/v1/veiculos - Listar (filtro opcional ?status=)
app.get('/api/v1/veiculos', (req, res) => {
    const { status } = req.query;
    if (status) {
        const filtrados = veiculos.filter(v => v.status.toUpperCase() === status.toUpperCase());
        return res.status(200).json(filtrados);
    }
    res.status(200).json(veiculos);
});

// GET /api/v1/veiculos/:id - Buscar por ID
app.get('/api/v1/veiculos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const veiculo = veiculos.find(v => v.id === id);
    if (!veiculo) {
        return res.status(404).json({ erro: "Veiculo nao encontrado na base de dados." });
    }
    res.status(200).json(veiculo);
});

// POST /api/v1/veiculos - Cadastrar
app.post('/api/v1/veiculos', (req, res) => {
    const { placa, montadora, modelo } = req.body || {};
    if (!placa || !montadora || !modelo) {
        return res.status(400).json({ erro: "Campos 'placa', 'montadora' e 'modelo' sao obrigatorios." });
    }
    const novoVeiculo = { id: proximoId++, placa, montadora, modelo, status: "DISPONIVEL" };
    veiculos.push(novoVeiculo);
    res.status(201).json(novoVeiculo);
});

// PUT /api/v1/veiculos/:id - Substituicao total
app.put('/api/v1/veiculos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = veiculos.findIndex(v => v.id === id);
    if (index === -1) {
        return res.status(404).json({ erro: "Veiculo nao encontrado." });
    }
    const { placa, montadora, modelo, status } = req.body || {};
    if (!placa || !montadora || !modelo || !status) {
        return res.status(400).json({ erro: "PUT exige 'placa', 'montadora', 'modelo' e 'status'." });
    }
    veiculos[index] = { id, placa, montadora, modelo, status: status.toUpperCase() };
    res.status(200).json(veiculos[index]);
});

// PATCH /api/v1/veiculos/:id/status - Atualizacao parcial
app.patch('/api/v1/veiculos/:id/status', (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body || {};
    const veiculo = veiculos.find(v => v.id === id);
    if (!veiculo) {
        return res.status(404).json({ erro: "Veiculo nao encontrado." });
    }
    if (!status) {
        return res.status(400).json({ erro: "O campo 'status' e obrigatorio." });
    }
    veiculo.status = status.toUpperCase();
    res.status(200).json({ mensagem: "Status atualizado com sucesso!", veiculo });
});

// DELETE /api/v1/veiculos/:id - Remover
app.delete('/api/v1/veiculos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = veiculos.findIndex(v => v.id === id);
    if (index === -1) {
        return res.status(404).json({ erro: "Veiculo nao encontrado." });
    }
    veiculos.splice(index, 1);
    res.status(200).json({ mensagem: `Veiculo ID ${id} removido com sucesso.` });
});

// Rota inexistente -> 404 em JSON
app.use((req, res) => {
    res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} nao existe.` });
});

// JSON invalido no body -> 400 em vez de stack trace
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ erro: "JSON invalido no corpo da requisicao." });
    }
    res.status(500).json({ erro: "Erro interno do servidor." });
});

// app.listen SEMPRE por ultimo
const server = app.listen(PORT, () => {
    console.log(`[Binario Tech] API de Frotas rodando em http://localhost:${PORT}`);
});

// Porta ocupada (EADDRINUSE) com mensagem decente
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`ERRO: porta ${PORT} ja esta em uso. Tente: PORT=${Number(PORT) + 1} node frota_api.js`);
        process.exit(1);
    }
    throw err;
});
