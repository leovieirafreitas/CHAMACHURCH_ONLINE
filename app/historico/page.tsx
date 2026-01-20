'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Mock data (will be replaced by Supabase)
const MOCK_HISTORY = [
    { id: 1, date: '2024-01-15', type: 'Dízimos', amount: 150.00, location: 'Chama Church Campo' },
    { id: 2, date: '2023-12-20', type: 'Ofertas', amount: 50.00, location: 'Chama Church Online' },
    { id: 3, date: '2023-12-10', type: 'Construção', amount: 100.00, location: 'Chama Church Campo' },
];

export default function HistoryPage() {
    const [cpf, setCpf] = useState('');
    const [searched, setSearched] = useState(false);
    const [history, setHistory] = useState<typeof MOCK_HISTORY>([]);
    const [memberName, setMemberName] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (cpf) {
            setSearched(true);
            setHistory(MOCK_HISTORY); // Simulate fetch
            setMemberName('Membro Exemplo da Silva'); // Mock member name
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
                                <button type="submit" className={styles.searchButton}>
                                    Consultar
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
                                                        <span className={styles.itemType}>{item.type}</span>
                                                        <span className={styles.itemDate}>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                                        <span className={styles.itemLocation}>{item.location}</span>
                                                    </div>
                                                    <div className={styles.itemRight}>
                                                        <span className={styles.itemAmount}>R$ {item.amount.toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className={styles.emptyState}>Nenhuma contribuição encontrada para este CPF.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
