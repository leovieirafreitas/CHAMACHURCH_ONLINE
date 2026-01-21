'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminSetup() {
    const [status, setStatus] = useState('');

    const createAdmin = async () => {
        setStatus('Criando usuário...');
        try {
            const { data, error } = await supabase.auth.signUp({
                email: 'contato@chamachurch.com.br',
                password: '1349123',
            });

            if (error) throw error;

            if (data.user) {
                setStatus('Usuário criado com sucesso! Você já pode fazer login em /admin');
            } else {
                setStatus('Verifique seu email para confirmar o cadastro (se necessário).');
            }
        } catch (e: any) {
            setStatus('Erro: ' + e.message);
        }
    };

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Setup Admin</h1>
            <p>Clique abaixo para criar o usuário admin (contato@chamachurch.com.br)</p>
            <button onClick={createAdmin} style={{ padding: '1rem', marginTop: '1rem' }}>
                Criar Usuário Admin
            </button>
            <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{status}</p>
            <br />
            <a href="/admin">Ir para Login</a>
        </div>
    );
}
