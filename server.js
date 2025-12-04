require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================================
// ======== CONFIGURAÇÃO DO SUPABASE ========
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase configurado:', supabaseUrl);

// ==========================================
// ======== CORS - PERMITE TODOS OS DOMÍNIOS
// ==========================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token', 'Accept'],
    credentials: false
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, Accept');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ==========================================
// ======== MIDDLEWARE DE AUTENTICAÇÃO ======
// ==========================================
const PORTAL_URL = process.env.PORTAL_URL || 'https://ir-comercio-portal-zcan.onrender.com';

console.log('🔐 Portal URL configurado:', PORTAL_URL);

async function verificarAutenticacao(req, res, next) {
    const publicPaths = ['/', '/health', '/app'];
    if (publicPaths.includes(req.path)) {
        return next();
    }

    const sessionToken = req.headers['x-session-token'] || req.query.sessionToken;

    console.log('🔑 Token recebido:', sessionToken ? `${sessionToken.substring(0, 20)}...` : 'NENHUM');

    if (!sessionToken) {
        console.log('❌ Token não encontrado');
        return res.status(401).json({
            error: 'Não autenticado',
            message: 'Token de sessão não encontrado',
            redirectToLogin: true
        });
    }

    try {
        console.log('🔍 Verificando sessão no portal:', PORTAL_URL);
        
        const verifyResponse = await fetch(`${PORTAL_URL}/api/verify-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken })
        });

        console.log('📊 Resposta do portal:', verifyResponse.status);

        if (!verifyResponse.ok) {
            console.log('❌ Resposta não OK do portal');
            return res.status(401).json({
                error: 'Sessão inválida',
                message: 'Sua sessão expirou ou foi invalidada',
                redirectToLogin: true
            });
        }

        const sessionData = await verifyResponse.json();
        console.log('📋 Dados da sessão:', sessionData.valid ? 'VÁLIDA' : 'INVÁLIDA');

        if (!sessionData.valid) {
            console.log('❌ Sessão marcada como inválida pelo portal');
            return res.status(401).json({
                error: 'Sessão inválida',
                message: sessionData.message || 'Sua sessão expirou',
                redirectToLogin: true
            });
        }

        req.user = sessionData.session;
        req.sessionToken = sessionToken;

        console.log('✅ Autenticação bem-sucedida para:', sessionData.session?.username);
        next();
    } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        return res.status(500).json({
            error: 'Erro interno',
            message: 'Erro ao verificar autenticação'
        });
    }
}

// ==========================================
// ======== SERVIR ARQUIVOS ESTÁTICOS =======
// ==========================================
const publicPath = path.join(__dirname, 'public');
console.log('📁 Pasta public:', publicPath);

app.use(express.static(publicPath, {
    index: 'index.html',
    dotfiles: 'deny',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
    }
}));

// ==========================================
// ======== HEALTH CHECK (PÚBLICO) ==========
// ==========================================
app.get('/health', async (req, res) => {
    console.log('💚 Health check requisitado');
    try {
        const { error } = await supabase
            .from('ordens_compra')
            .select('count', { count: 'exact', head: true });
        
        res.json({
            status: error ? 'unhealthy' : 'healthy',
            database: error ? 'disconnected' : 'connected',
            supabase_url: supabaseUrl,
            portal_url: PORTAL_URL,
            timestamp: new Date().toISOString(),
            publicPath: publicPath,
            authentication: 'enabled',
            cors: 'enabled - all origins'
        });
    } catch (error) {
        res.json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ==========================================
// ======== ROTAS DA API ====================
// ==========================================

app.use('/api', verificarAutenticacao);

// GET - Buscar todas as ordens
app.get('/api/ordens', async (req, res) => {
    try {
        console.log('🔍 Buscando ordens...');
        const { data, error } = await supabase
            .from('ordens_compra')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Erro ao buscar:', error);
            throw error;
        }
        
        console.log(`✅ ${data.length} ordens encontradas`);
        res.json(data || []);
    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar ordens', 
            details: error.message 
        });
    }
});

// GET - Buscar ordem específica
app.get('/api/ordens/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ordens_compra')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Ordem não encontrada' });
        }
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ 
            error: 'Erro ao buscar ordem', 
            details: error.message 
        });
    }
});

// POST - Criar nova ordem
app.post('/api/ordens', async (req, res) => {
    try {
        console.log('📝 Criando ordem:', req.body);
        
        const novaOrdem = {
            numero_ordem: req.body.numeroOrdem,
            responsavel: req.body.responsavel,
            data_ordem: req.body.dataOrdem,
            razao_social: req.body.razaoSocial,
            nome_fantasia: req.body.nomeFantasia || null,
            cnpj: req.body.cnpj,
            endereco_fornecedor: req.body.enderecoFornecedor || null,
            site: req.body.site || null,
            contato: req.body.contato || null,
            telefone: req.body.telefone || null,
            email: req.body.email || null,
            items: req.body.items,
            valor_total: req.body.valorTotal,
            frete: req.body.frete || null,
            local_entrega: req.body.localEntrega || null,
            prazo_entrega: req.body.prazoEntrega || null,
            transporte: req.body.transporte || null,
            forma_pagamento: req.body.formaPagamento,
            prazo_pagamento: req.body.prazoPagamento,
            dados_bancarios: req.body.dadosBancarios || null,
            status: 'aberta'
        };

        const { data, error } = await supabase
            .from('ordens_compra')
            .insert([novaOrdem])
            .select()
            .single();

        if (error) {
            console.error('❌ Erro ao criar:', error);
            throw error;
        }
        
        console.log('✅ Ordem criada:', data.id);
        res.status(201).json(data);
    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({ 
            error: 'Erro ao criar ordem', 
            details: error.message 
        });
    }
});

// PUT - Atualizar ordem
app.put('/api/ordens/:id', async (req, res) => {
    try {
        console.log('✏️ Atualizando ordem:', req.params.id);
        
        const ordemAtualizada = {
            numero_ordem: req.body.numeroOrdem,
            responsavel: req.body.responsavel,
            data_ordem: req.body.dataOrdem,
            razao_social: req.body.razaoSocial,
            nome_fantasia: req.body.nomeFantasia || null,
            cnpj: req.body.cnpj,
            endereco_fornecedor: req.body.enderecoFornecedor || null,
            site: req.body.site || null,
            contato: req.body.contato || null,
            telefone: req.body.telefone || null,
            email: req.body.email || null,
            items: req.body.items,
            valor_total: req.body.valorTotal,
            frete: req.body.frete || null,
            local_entrega: req.body.localEntrega || null,
            prazo_entrega: req.body.prazoEntrega || null,
            transporte: req.body.transporte || null,
            forma_pagamento: req.body.formaPagamento,
            prazo_pagamento: req.body.prazoPagamento,
            dados_bancarios: req.body.dadosBancarios || null,
            status: req.body.status || 'aberta',
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('ordens_compra')
            .update(ordemAtualizada)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            return res.status(404).json({ error: 'Ordem não encontrada' });
        }
        
        console.log('✅ Ordem atualizada');
        res.json(data);
    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({ 
            error: 'Erro ao atualizar ordem', 
            details: error.message 
        });
    }
});

// PATCH - Atualizar apenas status
app.patch('/api/ordens/:id/status', async (req, res) => {
    try {
        console.log('🔄 Atualizando status:', req.params.id);
        
        const { data, error } = await supabase
            .from('ordens_compra')
            .update({ 
                status: req.body.status,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            return res.status(404).json({ error: 'Ordem não encontrada' });
        }
        
        console.log('✅ Status atualizado');
        res.json(data);
    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({ 
            error: 'Erro ao atualizar status', 
            details: error.message 
        });
    }
});

// DELETE - Excluir ordem
app.delete('/api/ordens/:id', async (req, res) => {
    try {
        console.log('🗑️ Deletando ordem:', req.params.id);
        
        const { error } = await supabase
            .from('ordens_compra')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        
        console.log('✅ Ordem deletada');
        res.status(204).end();
    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({ 
            error: 'Erro ao excluir ordem', 
            details: error.message 
        });
    }
});

// ==========================================
// ======== ROTA PRINCIPAL (PÚBLICO) ========
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/app', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// ==========================================
// ======== ROTA 404 ========================
// ==========================================
app.use((req, res) => {
    console.log('❌ Rota não encontrada:', req.path);
    res.status(404).json({
        error: '404 - Rota não encontrada',
        path: req.path,
        availableRoutes: {
            interface: 'GET /',
            health: 'GET /health',
            api: 'GET /api/ordens'
        }
    });
});

// ==========================================
// ======== TRATAMENTO DE ERROS =============
// ==========================================
app.use((error, req, res, next) => {
    console.error('💥 Erro no servidor:', error);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
    });
});

// ==========================================
// ======== INICIAR SERVIDOR ================
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 ================================');
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Database: Supabase`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}`);
    console.log(`📁 Public folder: ${publicPath}`);
    console.log(`🔐 Autenticação: Ativa ✅`);
    console.log(`🌐 Portal URL: ${PORTAL_URL}`);
    console.log(`🌍 CORS: Liberado para todos`);
    console.log(`🔓 Rotas públicas: /, /health, /app`);
    console.log('🚀 ================================\n');
});

const fs = require('fs');
if (!fs.existsSync(publicPath)) {
    console.error('⚠️ AVISO: Pasta public/ não encontrada!');
    console.error('📁 Crie a pasta e adicione os arquivos:');
    console.error('   - public/index.html');
    console.error('   - public/styles.css');
    console.error('   - public/app.js');
}
