
/* POST http://localhost:3000/aulas \
     
      "Aula": "Front End",
      "Professor": "Josiane",
      "ordem": 6,
      "dia": "Sexta",
      "id": 30
  }'*/


/*# Excluir aula com ID 1
 DELETE http://localhost:3000/aulas/1*/



/*# Listar todas as aulas
curl http://localhost:3000/aulas

# Listar aulas de Segunda
curl http://localhost:3000/aulas/Segunda

# Ver horário completo
curl http://localhost:3000/horario-completo*/



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
const DATA_DIR = path.join(__dirname, 'data');
const AULAS_FILE = path.join(DATA_DIR, 'aulas.json');
const ID_FILE = path.join(DATA_DIR, 'ultimoId.json');

// ============ FUNÇÕES DE UTILITÁRIOS ============

// Garantir que a pasta data existe
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

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
        return true;
    } catch (error) {
        console.error('Erro ao salvar ID:', error);
        return false;
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
        return true;
    } catch (error) {
        console.error('Erro ao salvar aulas:', error);
        return false;
    }
}

// ============ ROTAS DA API ============

// ROTA GET - Rota inicial
app.get('/', (req, res) => {
    res.json({
        mensagem: 'API de Horários de Aulas',
        versao: '1.0.0',
        autor: 'Desenvolvido para o projeto do 2º Trimestre',
        rotas: {
            'POST /aulas': 'Cadastrar nova aula (body: Aula, Professor, dia, ordem)',
            'GET /aulas': 'Listar todas as aulas',
            'GET /aulas/:dia': 'Listar aulas por dia da semana (Segunda, Terça, Quarta, Quinta, Sexta)',
            'GET /horario-completo': 'Horário completo organizado por dia',
            'DELETE /aulas/:id': 'Excluir aula por ID'
        },
        exemplo_cadastro: {
            Aula: 'Matemática',
            Professor: 'João Silva',
            dia: 'Segunda',
            ordem: 1
        }
    });
});

// ROTA POST - Cadastrar nova aula
app.post('/aulas', (req, res) => {
    try {
        const { Aula, Professor, dia, ordem } = req.body;

        // Validação dos dados
        if (!Aula || !Professor || !dia || ordem === undefined) {
            return res.status(400).json({
                erro: 'Todos os campos são obrigatórios: Aula, Professor, dia, ordem',
                exemplo: {
                    Aula: 'Matemática',
                    Professor: 'João Silva',
                    dia: 'Segunda',
                    ordem: 1
                }
            });
        }

        // Validar dia da semana
        const diasValidos = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
        if (!diasValidos.includes(dia)) {
            return res.status(400).json({
                erro: 'Dia inválido. Use: Segunda, Terça, Quarta, Quinta ou Sexta'
            });
        }

        // Validar ordem
        if (ordem < 1 || ordem > 6) {
            return res.status(400).json({
                erro: 'Ordem deve ser entre 1 e 6'
            });
        }

        // Ler aulas existentes
        const aulas = lerAulas();

        // Verificar se já existe aula nessa ordem nesse dia
        const existeOrdem = aulas.some(a => a.dia === dia && a.ordem === parseInt(ordem));
        if (existeOrdem) {
            return res.status(400).json({
                erro: `Já existe uma aula na ordem ${ordem} para ${dia}`,
                sugestao: 'Escolha outra ordem para este dia'
            });
        }

        // Criar nova aula com ID automático
        const novaAula = {
            id: gerarNovoId(),
            Aula: Aula,
            Professor: Professor,
            dia: dia,
            ordem: parseInt(ordem)
        };

        // Adicionar nova aula
        aulas.push(novaAula);

        // Salvar no arquivo
        if (salvarAulas(aulas)) {
            res.status(201).json({
                mensagem: '✅ Aula cadastrada com sucesso!',
                aula: novaAula,
                total_aulas: aulas.length
            });
        } else {
            res.status(500).json({ erro: 'Erro ao salvar aula no arquivo' });
        }

    } catch (error) {
        console.error('Erro no POST:', error);
        res.status(500).json({ 
            erro: 'Erro interno do servidor',
            detalhe: error.message 
        });
    }
});

// ROTA GET - Consultar todas as aulas
app.get('/aulas', (req, res) => {
    try {
        const aulas = lerAulas();
        
        // Verificar se tem aulas cadastradas
        if (aulas.length === 0) {
            return res.status(200).json({
                mensagem: 'Nenhuma aula cadastrada ainda',
                total: 0,
                aulas: []
            });
        }

        res.json({
            total: aulas.length,
            aulas: aulas
        });
    } catch (error) {
        console.error('Erro no GET:', error);
        res.status(500).json({ 
            erro: 'Erro ao consultar aulas',
            detalhe: error.message 
        });
    }
});

// ROTA GET - Consultar aulas por dia da semana
app.get('/aulas/:dia', (req, res) => {
    try {
        const dia = req.params.dia;
        
        // Validar dia
        const diasValidos = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
        if (!diasValidos.includes(dia)) {
            return res.status(400).json({
                erro: 'Dia inválido. Use: Segunda, Terça, Quarta, Quinta ou Sexta'
            });
        }

        const aulas = lerAulas();
        
        // Filtrar aulas pelo dia
        const aulasFiltradas = aulas
            .filter(aula => aula.dia === dia)
            .sort((a, b) => a.ordem - b.ordem);
        
        if (aulasFiltradas.length === 0) {
            return res.status(404).json({
                mensagem: `Nenhuma aula encontrada para ${dia}`,
                dia: dia,
                total: 0
            });
        }
        
        res.json({
            dia: dia,
            total: aulasFiltradas.length,
            aulas: aulasFiltradas
        });
    } catch (error) {
        console.error('Erro no GET por dia:', error);
        res.status(500).json({ 
            erro: 'Erro ao consultar aulas por dia',
            detalhe: error.message 
        });
    }
});

// ROTA GET - Horário completo organizado
app.get('/horario-completo', (req, res) => {
    try {
        const aulas = lerAulas();
        
        // Organizar por dia da semana
        const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
        const horarioOrganizado = {};
        let totalAulas = 0;
        
        dias.forEach(dia => {
            const aulasDoDia = aulas
                .filter(aula => aula.dia === dia)
                .sort((a, b) => a.ordem - b.ordem);
            
            if (aulasDoDia.length > 0) {
                horarioOrganizado[dia] = aulasDoDia;
                totalAulas += aulasDoDia.length;
            }
        });
        
        // Verificar se tem aulas
        if (totalAulas === 0) {
            return res.status(200).json({
                mensagem: 'Nenhuma aula cadastrada ainda',
                total: 0,
                horario: {}
            });
        }
        
        res.json({
            total: totalAulas,
            horario: horarioOrganizado
        });
    } catch (error) {
        console.error('Erro no horário completo:', error);
        res.status(500).json({ 
            erro: 'Erro ao organizar horário',
            detalhe: error.message 
        });
    }
});

// ROTA DELETE - Excluir aula pelo ID
app.delete('/aulas/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ 
                erro: 'ID inválido. O ID deve ser um número.' 
            });
        }
        
        if (id < 1) {
            return res.status(400).json({ 
                erro: 'ID inválido. O ID deve ser maior que 0.' 
            });
        }
        
        // Ler aulas existentes
        let aulas = lerAulas();
        
        // Verificar se a aula existe
        const aulaExistente = aulas.find(aula => aula.id === id);
        if (!aulaExistente) {
            return res.status(404).json({
                erro: `Aula com ID ${id} não encontrada`,
                sugestao: 'Verifique se o ID está correto'
            });
        }
        
        // Remover a aula
        aulas = aulas.filter(aula => aula.id !== id);
        
        // Salvar no arquivo
        if (salvarAulas(aulas)) {
            res.json({
                mensagem: `✅ Aula com ID ${id} excluída com sucesso!`,
                aulaRemovida: aulaExistente,
                total_restante: aulas.length
            });
        } else {
            res.status(500).json({ erro: 'Erro ao excluir aula do arquivo' });
        }
    } catch (error) {
        console.error('Erro no DELETE:', error);
        res.status(500).json({ 
            erro: 'Erro interno do servidor',
            detalhe: error.message 
        });
    }
});

// ROTA - 404 para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ 
        erro: 'Rota não encontrada',
        mensagem: 'Verifique as rotas disponíveis:',
        rotas_disponiveis: [
            'GET  /',
            'POST /aulas',
            'GET  /aulas',
            'GET  /aulas/:dia',
            'GET  /horario-completo',
            'DELETE /aulas/:id'
        ]
    });
});


// ============ INICIAR SERVIDOR ============

app.listen(PORT, () => {
    console.log(`🚀 API de Horários rodando em http://localhost:${PORT}`);
    console.log(`📝 POST /aulas | GET /aulas | DELETE /aulas/:id`);
});

