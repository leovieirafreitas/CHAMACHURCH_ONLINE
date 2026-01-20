'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function HistoryPage() {
    const [cpf, setCpf] = useState('');
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [memberName, setMemberName] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cpf) return;

        setLoading(true);
        setSearched(false);
        setHistory([]);
        setMemberName('');

        try {
            const cleanCpf = cpf.replace(/\D/g, '');

            const { data, error } = await supabase
                .from('donations')
                .select('*')
                .eq('payer_cpf', cleanCpf)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching history:', error);
                // Could handle error state here
            } else {
                if (data && data.length > 0) {
                    setHistory(data);
                    // Use the name from the most recent donation
                    setMemberName(data[0].payer_name || 'Membro');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={`container ${styles.headerContent}`}>
                    <Link href="/">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" alt="Chama Church" className={styles.logoImage} />
                    </Link>
                    <Link href="/" className={styles.backLink}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 19-7-7 7-7" />
                            <path d="M19 12H5" />
                        </svg>
                        Voltar para Doação
                    </Link>
                </div>
            </header>

            <div className={styles.content}>
                <div className="container">
                    <div className={styles.card}>
                        <h1 className={styles.title}>Histórico de Contribuições</h1>

                        <form onSubmit={handleSearch} className={styles.searchForm}>
                            <label htmlFor="cpf" className={styles.label}>Digite seu CPF para consultar</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="cpf"
                                    type="text"
                                    className={styles.input}
                                    placeholder="000.000.000-00"
                                    value={cpf}
                                    maxLength={14}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/\D/g, '');
                                        if (value.length > 11) value = value.slice(0, 11);

                                        if (value.length > 0) {
                                            value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                            value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                        }
                                        setCpf(value);
                                    }}
                                />
                                <button type="submit" className={styles.searchButton} disabled={loading}>
                                    {loading ? 'Consultando...' : 'Consultar'}
                                </button>
                            </div>
                        </form>

                        {searched && (
                            <div className="animate-fade-in">
                                {history.length > 0 ? (
                                    <>
                                        <div className={styles.memberInfo}>
                                            <span className={styles.welcomeText}>Olá,</span>
                                            <h2 className={styles.memberName}>{memberName}</h2>
                                        </div>
                                        <div className={styles.historyList}>
                                            {history.map((item) => (
                                                <div key={item.id} className={styles.historyItem}>
                                                    <div className={styles.itemLeft}>
                                                        <span className={styles.itemType}>{item.type || 'Contribuição'}</span>
                                                        <span className={styles.itemDate}>
                                                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                                        </span>
                                                        {/* Adding Payment Method as simplified location/info for now since location isn't stored distinctively yet unless in type */}
                                                        <span className={styles.itemLocation}>
                                                            {item.payment_method === 'pix' ? 'Pix' : 'Cartão de Crédito'} - {item.status === 'paid' ? 'Pago' : (item.status === 'pending' ? 'Pendente' : item.status)}
                                                        </span>
                                                    </div>
                                                    <div className={styles.itemRight}>
                                                        <span className={styles.itemAmount}>R$ {Number(item.amount).toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#666' }}>
                                        <div style={{ marginBottom: '1rem', color: '#9ca3af' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nenhum registro encontrado</h3>
                                        <p style={{ fontSize: '0.9rem' }}>
                                            Não encontramos contribuições vinculadas a este CPF: <strong>{cpf}</strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
