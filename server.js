
/*POST http://localhost:3000/api/aulas 
  {
    "componenteCurricular": "Matemática",
    "professor": "Prof. João",
    "diaSemana": "Segunda",
    "ordem": 1
  }'*/
/*GET http://localhost:3000/api/aulas*/ 

/*DELETE http://localhost:3000/api/aulas/1*/







/*const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Caminhos dos arquivos
const AULAS_FILE = path.join(__dirname, 'data', 'aulas.json');
const ID_FILE = path.join(__dirname, 'data', 'ultimoId.json');

// ============ FUNÇÕES DE UTILITÁRIOS ============

// Função para ler o último ID
function lerUltimoId() {
    try {
        if (!fs.existsSync(ID_FILE)) {
            // Cria o arquivo se não existir
            fs.writeFileSync(ID_FILE, JSON.stringify({ ultimoId: 0 }));
            return 0;
        }
        const data = fs.readFileSync(ID_FILE, 'utf8');
        return JSON.parse(data).ultimoId || 0;
    } catch (error) {
        console.error('Erro ao ler ID:', error);
        return 0;
    }
}

// Função para salvar o último ID
function salvarUltimoId(id) {
    try {
        fs.writeFileSync(ID_FILE, JSON.stringify({ ultimoId: id }));
    } catch (error) {
        console.error('Erro ao salvar ID:', error);
    }
}

// Função para gerar novo ID
function gerarNovoId() {
    const ultimoId = lerUltimoId();
    const novoId = ultimoId + 1;
    salvarUltimoId(novoId);
    return novoId;
}

// Função para ler as aulas
function lerAulas() {
    try {
        if (!fs.existsSync(AULAS_FILE)) {
            fs.writeFileSync(AULAS_FILE, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(AULAS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao ler aulas:', error);
        return [];
    }
}

// Função para salvar as aulas
function salvarAulas(aulas) {
    try {
        fs.writeFileSync(AULAS_FILE, JSON.stringify(aulas, null, 2));
    } catch (error) {
        console.error('Erro ao salvar aulas:', error);
    }
}

// ============ FUNÇÕES PRINCIPAIS ============

// 1. Cadastrar nova aula (POST)
function cadastrarAula(dados) {
    const aulas = lerAulas();
    
    const novaAula = {
        id: gerarNovoId(),
        componenteCurricular: dados.componenteCurricular,
        professor: dados.professor,
        diaSemana: dados.diaSemana,
        ordem: dados.ordem
    };
    
    aulas.push(novaAula);
    salvarAulas(aulas);
    return novaAula;
}

// 2. Consultar todas as aulas (GET)
function consultarAulas() {
    return lerAulas();
}

// 3. Consultar aulas organizadas por dia (GET)
function consultarOrganizado() {
    const aulas = lerAulas();
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    
    const organizado = {};
    dias.forEach(dia => organizado[dia] = []);
    
    aulas.forEach(aula => {
        if (organizado[aula.diaSemana]) {
            organizado[aula.diaSemana].push({
                id: aula.id,
                componenteCurricular: aula.aula,
                professor: aula.professor,
                ordem: aula.ordem
            });
        }
    });
    
    // Ordena por ordem
    Object.keys(organizado).forEach(dia => {
        organizado[dia].sort((a, b) => a.ordem - b.ordem);
    });
    
    return organizado;
}

// 4. Buscar aula por ID (GET)
function buscarAulaPorId(id) {
    const aulas = lerAulas();
    return aulas.find(aula => aula.id === id);
}

// 5. Excluir aula por ID (DELETE)
function excluirAula(id) {
    const aulas = lerAulas();
    const index = aulas.findIndex(aula => aula.id === id);
    
    if (index === -1) return null;
    
    const aulaRemovida = aulas.splice(index, 1)[0];
    salvarAulas(aulas);
    return aulaRemovida;
}

// ============ ROTAS DA API ============

// Rota inicial
app.get('/', (req, res) => {
    res.json({
        mensagem: 'API de Horários de Aulas',
        rotas: {
            'POST /api/aulas': 'Cadastrar aula (body: aula, professor, dia, ordem)',
            'GET /api/aulas': 'Listar todas as aulas',
            'GET /api/aulas?organizado=true': 'Listar aulas organizadas por dia',
            'GET /api/aulas/:id': 'Buscar aula por ID',
            'DELETE /api/aulas/:id': 'Excluir aula por ID'
        },
        exemplo: {
            aula: 'Matemática',
            professor: 'Prof. João',
            dia: 'Segunda',
            ordem: 1
        }
    });
});

// POST - Cadastrar aula
app.post('/api/aulas', (req, res) => {
    try {
        const { aula, professor, ordem, dia } = req.body;
        
        // Validações
        if (!aula || !professor || !ordem|| dia === undefined) {
            return res.status(400).json({
                erro: 'Todos os campos são obrigatórios'
            });
        }
        
        const diasValidos = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
        if (!diasValidos.includes(diaSemana)) {
            return res.status(400).json({
                erro: 'Dia inválido. Use: Segunda, Terça, Quarta, Quinta ou Sexta'
            });
        }
        
        if (ordem < 1 || ordem > 5) {
            return res.status(400).json({
                erro: 'Ordem deve ser entre 1 e 5'
            });
        }
        
        const novaAula = cadastrarAula(req.body);
        res.status(201).json({
            mensagem: 'Aula cadastrada com sucesso!',
            aula: novaAula
        });
        
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao cadastrar aula' });
    }
});

// GET - Consultar aulas
app.get('/api/aulas', (req, res) => {
    try {
        const organizado = req.query.organizado === 'true';
        
        if (organizado) {
            const resultado = consultarOrganizado();
            res.json(resultado);
        } else {
            const resultado = consultarAulas();
            res.json(resultado);
        }
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao consultar aulas' });
    }
});

// GET - Buscar aula por ID
app.get('/api/aulas/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ erro: 'ID inválido' });
        }
        
        const aula = buscarAulaPorId(id);
        
        if (!aula) {
            return res.status(404).json({ erro: 'Aula não encontrada' });
        }
        
        res.json(aula);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar aula' });
    }
});

// DELETE - Excluir aula
app.delete('/api/aulas/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ erro: 'ID inválido' });
        }
        
        const aulaRemovida = excluirAula(id);
        
        if (!aulaRemovida) {
            return res.status(404).json({ erro: 'Aula não encontrada' });
        }
        
        res.json({
            mensagem: 'Aula excluída com sucesso!',
            aula: aulaRemovida
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao excluir aula' });
    }
});

// Rota não encontrada
app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
});

// ============ INICIAR SERVIDOR ============

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📚 API de Horários de Aulas`);
});*/






const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Caminhos dos arquivos
const AULAS_FILE = path.join(__dirname, 'data', 'aulas.json');
const ID_FILE = path.join(__dirname, 'data', 'ultimoId.json');

// ============ FUNÇÕES DE UTILITÁRIOS ============

// Função para ler o último ID
function lerUltimoId() {
    try {
        if (!fs.existsSync(ID_FILE)) {
            fs.writeFileSync(ID_FILE, JSON.stringify({ ultimoId: 0 }));
            return 0;
        }
        const data = fs.readFileSync(ID_FILE, 'utf8');
        return JSON.parse(data).ultimoId || 0;
    } catch (error) {
        console.error('Erro ao ler ID:', error);
        return 0;
    }
}

// Função para salvar o último ID
function salvarUltimoId(id) {
    try {
        fs.writeFileSync(ID_FILE, JSON.stringify({ ultimoId: id }));
    } catch (error) {
        console.error('Erro ao salvar ID:', error);
    }
}

// Função para gerar novo ID
function gerarNovoId() {
    const ultimoId = lerUltimoId();
    const novoId = ultimoId + 1;
    salvarUltimoId(novoId);
    return novoId;
}

// Função para ler as aulas
function lerAulas() {
    try {
        if (!fs.existsSync(AULAS_FILE)) {
            fs.writeFileSync(AULAS_FILE, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(AULAS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao ler aulas:', error);
        return [];
    }
}

// Função para salvar as aulas
function salvarAulas(aulas) {
    try {
        fs.writeFileSync(AULAS_FILE, JSON.stringify(aulas, null, 2));
    } catch (error) {
        console.error('Erro ao salvar aulas:', error);
    }
}

// ============ FUNÇÕES PRINCIPAIS ============

// 1. Cadastrar nova aula (POST)
function cadastrarAula(dados) {
    const aulas = lerAulas();
    
    const novaAula = {
        id: gerarNovoId(),
        Aula: dados.Aula || dados.componenteCurricular || dados.aula,
        Professor: dados.Professor || dados.professor,
        dia: dados.dia || dados.diaSemana,
        ordem: dados.ordem
    };
    
    aulas.push(novaAula);
    salvarAulas(aulas);
    return novaAula;
}

// 2. Consultar todas as aulas (GET)
function consultarAulas() {
    return lerAulas();
}

// 3. Consultar aulas organizadas por dia (GET)
function consultarOrganizado() {
    const aulas = lerAulas();
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    
    const organizado = {};
    dias.forEach(dia => organizado[dia] = []);
    
    aulas.forEach(aula => {
        if (organizado[aula.dia]) {
            organizado[aula.dia].push({
                id: aula.id,
                Aula: aula.Aula,
                Professor: aula.Professor,
                ordem: aula.ordem
            });
        }
    });
    
    // Ordena por ordem
    Object.keys(organizado).forEach(dia => {
        organizado[dia].sort((a, b) => a.ordem - b.ordem);
    });
    
    return organizado;
}

// 4. Buscar aula por ID (GET)
function buscarAulaPorId(id) {
    const aulas = lerAulas();
    return aulas.find(aula => aula.id === id);
}

// 5. Excluir aula por ID (DELETE)
function excluirAula(id) {
    const aulas = lerAulas();
    const index = aulas.findIndex(aula => aula.id === id);
    
    if (index === -1) return null;
    
    const aulaRemovida = aulas.splice(index, 1)[0];
    salvarAulas(aulas);
    return aulaRemovida;
}

// ============ ROTAS DA API (SEM /api/) ============

// Rota inicial
app.get('/', (req, res) => {
    res.json({
        mensagem: 'API de Horários de Aulas',
        rotas: {
            'POST /aulas': 'Cadastrar aula (body: Aula, Professor, dia, ordem)',
            'GET /aulas': 'Listar todas as aulas',
            'GET /aulas?organizado=true': 'Listar aulas organizadas por dia',
            'GET /aulas/:id': 'Buscar aula por ID',
            'DELETE /aulas/:id': 'Excluir aula por ID'
        },
        exemplo: {
            Aula: 'Matemática',
            Professor: 'Prof. João',
            dia: 'Segunda',
            ordem: 1
        }
    });
});

// POST - Cadastrar aula
app.post('/aulas', (req, res) => {
    try {
        const { Aula, Professor, ordem, dia } = req.body;
        
        // Validações
        if (!Aula || !Professor || ordem === undefined || !dia) {
            return res.status(400).json({
                erro: 'Todos os campos são obrigatórios: Aula, Professor, dia, ordem'
            });
        }
        
        const diasValidos = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
        if (!diasValidos.includes(dia)) {
            return res.status(400).json({
                erro: 'Dia inválido. Use: Segunda, Terça, Quarta, Quinta ou Sexta'
            });
        }
        
        if (ordem < 1 || ordem > 6) {
            return res.status(400).json({
                erro: 'Ordem deve ser entre 1 e 6'
            });
        }
        
        const novaAula = cadastrarAula(req.body);
        res.status(201).json({
            mensagem: 'Aula cadastrada com sucesso!',
            aula: novaAula
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar aula' });
    }
});

// GET - Consultar aulas
app.get('/aulas', (req, res) => {
    try {
        const organizado = req.query.organizado === 'true';
        
        if (organizado) {
            const resultado = consultarOrganizado();
            res.json(resultado);
        } else {
            const resultado = consultarAulas();
            res.json(resultado);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao consultar aulas' });
    }
});

// GET - Buscar aula por ID
app.get('/aulas/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ erro: 'ID inválido' });
        }
        
        const aula = buscarAulaPorId(id);
        
        if (!aula) {
            return res.status(404).json({ erro: 'Aula não encontrada' });
        }
        
        res.json(aula);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar aula' });
    }
});

// DELETE - Excluir aula
app.delete('/aulas/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ erro: 'ID inválido' });
        }
        
        const aulaRemovida = excluirAula(id);
        
        if (!aulaRemovida) {
            return res.status(404).json({ erro: 'Aula não encontrada' });
        }
        
        res.json({
            mensagem: 'Aula excluída com sucesso!',
            aula: aulaRemovida
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao excluir aula' });
    }
});

// Rota não encontrada
app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
});

// ============ INICIAR SERVIDOR ============

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📚 Rotas disponíveis:`);
    console.log(`   POST   /aulas         - Cadastrar aula`);
    console.log(`   GET    /aulas         - Listar aulas`);
    console.log(`   GET    /aulas/:id     - Buscar aula por ID`);
    console.log(`   DELETE /aulas/:id     - Excluir aula`);
    console.log(`   GET    /aulas?organizado=true - Aulas organizadas por dia`);
});


/*  POST http://localhost:3000/aulas*/