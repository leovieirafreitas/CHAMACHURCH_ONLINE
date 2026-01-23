# 📋 Lista de Tarefas Pendentes
## Chamachurch Online Donation System

**Data:** 22 de Janeiro de 2026  
**Status Atual:** 82.4% Completo  
**Prioridade:** Organizada por impacto

---

## 🔴 Prioridade ALTA (Crítico para Produção)

### 1. ❌ **Corrigir Endpoint `/api/check-status`**
**Status:** Falhando  
**Teste:** API-TC007  
**Impacto:** Alto - Status de pagamento não atualiza

**Problema:**
- Endpoint não responde corretamente
- Pode estar retornando erro 404 ou 500
- Necessário para polling de status PIX

**Solução:**
```typescript
// app/api/check-status/route.ts
export async function POST(request: Request) {
    try {
        const { paymentId } = await request.json();
        
        // Validar paymentId
        if (!paymentId) {
            return NextResponse.json(
                { error: 'ID do pagamento é obrigatório' },
                { status: 400 }
            );
        }
        
        // Buscar no Mercado Pago
        const mpStatus = await getPayment(paymentId);
        
        if (!mpStatus) {
            return NextResponse.json(
                { error: 'Pagamento não encontrado' },
                { status: 404 }
            );
        }
        
        // Atualizar no banco de dados
        const { error } = await supabase
            .from('donations')
            .update({ 
                status: mpStatus.status === 'approved' ? 'paid' : mpStatus.status 
            })
            .eq('pagbank_order_id', paymentId);
        
        return NextResponse.json({
            status: mpStatus.status,
            mpStatus: mpStatus.status_detail
        });
        
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Erro ao verificar status' },
            { status: 500 }
        );
    }
}
```

**Tempo Estimado:** 1-2 horas  
**Benefício:** Atualização automática de status PIX

---

### 2. ⚠️ **Configurar HTTPS para Testes de Cartão**
**Status:** Bloqueado por SSL  
**Teste:** API-TC004  
**Impacto:** Alto - Cartão de crédito não funciona em localhost

**Problema:**
- Mercado Pago SDK requer HTTPS
- Localhost (HTTP) não tem certificado SSL
- Pagamentos com cartão bloqueados

**Solução Rápida (Desenvolvimento):**
```bash
# Opção 1: Usar ngrok
ngrok http 3000

# Copiar URL HTTPS gerada (ex: https://abc123.ngrok.io)
# Atualizar NEXT_PUBLIC_SITE_URL no .env.local
```

**Solução Permanente (Produção):**
- Deploy em Vercel, Netlify, ou servidor com SSL
- Configurar domínio com certificado SSL

**Tempo Estimado:** 30 minutos (ngrok) ou 2-3 horas (deploy)  
**Benefício:** Pagamentos com cartão funcionando

---

### 3. 📊 **Criar Dados de Seed para Testes**
**Status:** Banco vazio  
**Testes:** TC006, TC007 (frontend)  
**Impacto:** Médio - Dificulta testes completos

**Problema:**
- Banco de dados sem dados de teste
- Impossível testar histórico e recibos
- Dificulta validação de funcionalidades

**Solução:**
```sql
-- testsprite_tests/seed_data.sql

-- Inserir doações de exemplo
INSERT INTO donations (
    amount,
    type,
    church_location,
    payment_method,
    status,
    payer_name,
    payer_email,
    payer_cpf,
    payer_phone,
    pagbank_order_id,
    created_at
) VALUES
-- Doação paga (PIX)
(100.00, 'Dízimos', 'central', 'pix', 'paid', 'João Silva', 'joao@example.com', '12345678900', '11999999999', 'MP123456', NOW() - INTERVAL '2 days'),

-- Doação pendente (PIX)
(50.00, 'Ofertas', 'online', 'pix', 'pending', 'Maria Santos', 'maria@example.com', '98765432100', '21987654321', 'MP123457', NOW() - INTERVAL '1 day'),

-- Doação paga (Cartão)
(200.00, 'Construção', 'manacapuru', 'credit_card', 'paid', 'Pedro Oliveira', 'pedro@example.com', '11122233344', '85988887777', 'MP123458', NOW() - INTERVAL '5 days'),

-- Doação cancelada
(75.00, 'Chama Social', 'africa', 'pix', 'canceled', 'Ana Costa', 'ana@example.com', '55566677788', '11955554444', 'MP123459', NOW() - INTERVAL '10 days'),

-- Mais doações para o mesmo CPF (testar histórico)
(150.00, 'Missões África', 'central', 'pix', 'paid', 'João Silva', 'joao@example.com', '12345678900', '11999999999', 'MP123460', NOW() - INTERVAL '30 days'),
(80.00, 'Dízimos', 'central', 'pix', 'paid', 'João Silva', 'joao@example.com', '12345678900', '11999999999', 'MP123461', NOW() - INTERVAL '60 days');
```

**Como Executar:**
```bash
# Conectar ao Supabase e executar SQL
# Ou criar script Node.js
node testsprite_tests/seed_database.js
```

**Tempo Estimado:** 1 hora  
**Benefício:** Testes completos de histórico e recibos

---

## 🟡 Prioridade MÉDIA (Melhorias Importantes)

### 4. 🔒 **Implementar Rate Limiting**
**Status:** Não implementado  
**Impacto:** Médio - Segurança

**Problema:**
- API sem limite de requisições
- Vulnerável a abuso e DDoS
- Pode gerar custos excessivos

**Solução:**
```typescript
// lib/rate-limit.ts
import { NextResponse } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const record = rateLimit.get(ip);
    
    if (!record || now > record.resetTime) {
        rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1 };
    }
    
    if (record.count >= maxRequests) {
        return { 
            allowed: false, 
            remaining: 0,
            resetTime: record.resetTime 
        };
    }
    
    record.count++;
    return { allowed: true, remaining: maxRequests - record.count };
}

// Usar em app/api/donate/route.ts
const ip = request.headers.get('x-forwarded-for') || 'unknown';
const limit = checkRateLimit(ip, 5, 60000); // 5 req/min

if (!limit.allowed) {
    return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde 1 minuto.' },
        { status: 429 }
    );
}
```

**Tempo Estimado:** 2-3 horas  
**Benefício:** Proteção contra abuso

---

### 5. 📝 **Adicionar Logging Estruturado**
**Status:** Logging básico  
**Impacto:** Médio - Debugging e monitoramento

**Problema:**
- Logs não estruturados
- Difícil rastrear erros
- Sem métricas de uso

**Solução:**
```typescript
// lib/logger.ts
export const logger = {
    info: (message: string, data?: any) => {
        console.log(JSON.stringify({
            level: 'info',
            message,
            data,
            timestamp: new Date().toISOString()
        }));
    },
    
    error: (message: string, error?: any) => {
        console.error(JSON.stringify({
            level: 'error',
            message,
            error: {
                message: error?.message,
                stack: error?.stack
            },
            timestamp: new Date().toISOString()
        }));
    },
    
    validation: (field: string, value: any, valid: boolean) => {
        console.log(JSON.stringify({
            level: 'validation',
            field,
            valid,
            timestamp: new Date().toISOString()
        }));
    }
};

// Usar em validações
if (!validateCPF(body.customer.cpf)) {
    logger.validation('cpf', body.customer.cpf, false);
    return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
}
```

**Tempo Estimado:** 2 horas  
**Benefício:** Melhor debugging e métricas

---

### 6. 🧪 **Melhorar Testes com CPFs Válidos**
**Status:** Usando CPFs de teste inválidos  
**Teste:** API-TC001  
**Impacto:** Médio - Testes mais realistas

**Problema:**
- CPF `12345678900` não é válido
- Teste falha por validação (que é correto!)
- Precisa CPFs válidos para testes

**Solução:**
```javascript
// testsprite_tests/backend_api_tests.js

// CPFs válidos para teste (gerados com checksum correto)
const VALID_TEST_CPFS = [
    '11144477735', // CPF válido 1
    '52998224725', // CPF válido 2
    '39053344705'  // CPF válido 3
];

const validDonation = {
    amount: 100.00,
    description: 'Dízimos',
    churchLocation: 'central',
    paymentMethod: 'pix',
    customer: {
        name: 'João Silva Test',
        email: 'joao.test@example.com',
        cpf: VALID_TEST_CPFS[0], // Usar CPF válido
        phone: '11999999999'
    }
};
```

**Tempo Estimado:** 30 minutos  
**Benefício:** Testes mais precisos

---

## 🟢 Prioridade BAIXA (Melhorias Opcionais)

### 7. 🎨 **Melhorar Mensagens de Erro do Frontend**
**Status:** Funcional mas pode melhorar  
**Impacto:** Baixo - UX

**Problema:**
- Mensagens de erro podem ser mais amigáveis
- Falta feedback visual em alguns casos

**Solução:**
- Adicionar toast notifications
- Melhorar mensagens de validação
- Adicionar ícones de erro/sucesso

**Tempo Estimado:** 2-3 horas  
**Benefício:** Melhor experiência do usuário

---

### 8. 📊 **Adicionar Métricas e Analytics**
**Status:** Não implementado  
**Impacto:** Baixo - Business intelligence

**Problema:**
- Sem rastreamento de conversão
- Sem métricas de uso
- Difícil medir sucesso

**Solução:**
- Integrar Google Analytics
- Adicionar eventos customizados
- Dashboard de métricas

**Tempo Estimado:** 3-4 horas  
**Benefício:** Insights de negócio

---

### 9. 🔐 **Implementar Autenticação 2FA para Admin**
**Status:** Autenticação básica  
**Impacto:** Baixo - Segurança adicional

**Problema:**
- Admin usa apenas email/senha
- Sem autenticação de dois fatores

**Solução:**
- Implementar 2FA com Supabase
- Usar autenticação por SMS ou app

**Tempo Estimado:** 4-5 horas  
**Benefício:** Segurança reforçada

---

### 10. 📱 **Melhorar Responsividade Mobile**
**Status:** Funcional (passou nos testes)  
**Impacto:** Baixo - Já funciona bem

**Problema:**
- Pode ter pequenos ajustes de UX
- Alguns elementos podem ser otimizados

**Solução:**
- Testar em dispositivos reais
- Ajustar espaçamentos e tamanhos
- Melhorar touch targets

**Tempo Estimado:** 2-3 horas  
**Benefício:** UX mobile perfeita

---

## 📊 Resumo por Prioridade

### 🔴 Alta Prioridade (Fazer Antes de Produção)
1. ❌ Corrigir `/api/check-status` (1-2h)
2. ⚠️ Configurar HTTPS para cartão (0.5-3h)
3. 📊 Criar dados de seed (1h)

**Total:** 2.5-6 horas

---

### 🟡 Média Prioridade (Recomendado)
4. 🔒 Rate limiting (2-3h)
5. 📝 Logging estruturado (2h)
6. 🧪 CPFs válidos nos testes (0.5h)

**Total:** 4.5-5.5 horas

---

### 🟢 Baixa Prioridade (Opcional)
7. 🎨 Mensagens de erro frontend (2-3h)
8. 📊 Analytics (3-4h)
9. 🔐 2FA admin (4-5h)
10. 📱 Responsividade mobile (2-3h)

**Total:** 11-15 horas

---

## 🎯 Plano de Ação Recomendado

### **Semana 1 (Mínimo Viável para Produção)**
- [x] ✅ Validação de CPF - CONCLUÍDO
- [x] ✅ Validação de campos - CONCLUÍDO
- [x] ✅ Padronização API - CONCLUÍDO
- [ ] ❌ Corrigir check-status (1-2h)
- [ ] 📊 Criar dados de seed (1h)
- [ ] ⚠️ Configurar HTTPS (0.5-3h)

**Total:** 2.5-6 horas  
**Resultado:** Sistema 95% pronto para produção

---

### **Semana 2 (Melhorias de Segurança)**
- [ ] 🔒 Rate limiting (2-3h)
- [ ] 📝 Logging estruturado (2h)
- [ ] 🧪 Melhorar testes (0.5h)

**Total:** 4.5-5.5 horas  
**Resultado:** Sistema robusto e monitorável

---

### **Semana 3+ (Polimento)**
- [ ] 🎨 Melhorar UX (2-3h)
- [ ] 📊 Analytics (3-4h)
- [ ] 🔐 2FA (4-5h)
- [ ] 📱 Mobile polish (2-3h)

**Total:** 11-15 horas  
**Resultado:** Sistema premium

---

## ✅ Checklist de Produção

### Funcionalidades Core
- [x] ✅ Doações PIX
- [x] ✅ Validação de inputs
- [x] ✅ Auto-preenchimento CPF
- [x] ✅ Histórico de doações
- [ ] ❌ Status PIX em tempo real
- [ ] ⚠️ Pagamentos com cartão (requer SSL)

### Qualidade e Segurança
- [x] ✅ Validação completa backend
- [x] ✅ Mensagens de erro em PT-BR
- [x] ✅ Performance < 2s
- [ ] ❌ Rate limiting
- [ ] ❌ Logging estruturado
- [ ] ⚠️ HTTPS configurado

### Testes
- [x] ✅ Testes backend (82.4%)
- [x] ✅ Testes frontend (25% + melhorias)
- [ ] ❌ Dados de seed
- [ ] ❌ Testes com CPFs válidos

---

## 🎯 Recomendação Final

### **Para Lançar Hoje (Modo PIX)**
**Fazer:**
1. Corrigir check-status (1-2h)
2. Criar dados de seed (1h)

**Total:** 2-3 horas  
**Status:** ✅ Pronto para produção com PIX

---

### **Para Lançar Completo (PIX + Cartão)**
**Fazer:**
1. Corrigir check-status (1-2h)
2. Criar dados de seed (1h)
3. Configurar HTTPS (0.5-3h)
4. Rate limiting (2-3h)
5. Logging (2h)

**Total:** 7.5-11 horas  
**Status:** ✅ Pronto para produção completa

---

## 📈 Progresso Atual

**Concluído:** 82.4%  
**Faltando (Alta Prioridade):** 2.5-6 horas  
**Faltando (Total):** 18.5-27 horas

**Status:** 🟢 **Muito próximo de produção!**

---

**Documento Criado:** 22 de Janeiro de 2026  
**Próxima Revisão:** Após implementar tarefas de alta prioridade
