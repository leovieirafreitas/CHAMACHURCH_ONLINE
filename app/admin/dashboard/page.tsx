'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Simple Icons
const Icons = {
    Money: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
    Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
};

export default function AdminDashboard() {
    const [donations, setDonations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, todayTotal: 0, monthTotal: 0, count: 0, pix: 0, card: 0, members: 0 });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/admin');
            } else {
                fetchDonations();
            }
        };
        checkAuth();
    }, [router]);

    const fetchDonations = async () => {
        try {
            const { data, error } = await supabase
                .from('donations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setDonations(data);

                // Calculate stats
                const total = data.filter(d => d.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0);
                const count = data.length;
                const pix = data.filter(d => d.payment_method === 'pix').length;
                const card = data.filter(d => d.payment_method === 'credit_card').length;

                // Calculate today total
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Start of today (local browser time)

                const todayTotal = data.filter(d => {
                    if (d.status !== 'paid') return false;
                    const dDate = new Date(d.created_at);
                    // Adjust donation date to local time comparison?
                    // Actually, if we just check if it's >= today start and < tomorrow start in local time
                    return dDate >= today;
                }).reduce((acc, curr) => acc + Number(curr.amount), 0);

                // Calculate month total
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthTotal = data.filter(d => {
                    if (d.status !== 'paid') return false;
                    const dDate = new Date(d.created_at);
                    return dDate >= startOfMonth;
                }).reduce((acc, curr) => acc + Number(curr.amount), 0);

                setStats({ total, todayTotal, monthTotal, count, pix, card, members: new Set(data.map(d => d.payer_cpf)).size });
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredDonations = donations.filter(d => {
        if (!startDate && !endDate) return true;

        const donationDate = new Date(d.created_at);

        // Start Date: Beginning of the day (00:00:00)
        let start = null;
        if (startDate) {
            // Create date object treating input as local date (handling "YYYY-MM-DD")
            const [year, month, day] = startDate.split('-').map(Number);
            start = new Date(year, month - 1, day, 0, 0, 0, 0);
        }

        // End Date: End of the day (23:59:59)
        let end = null;
        if (endDate) {
            const [year, month, day] = endDate.split('-').map(Number);
            end = new Date(year, month - 1, day, 23, 59, 59, 999);
        }

        if (start && donationDate < start) return false;
        if (end && donationDate > end) return false;

        return true;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
    const paginatedDonations = filteredDonations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin');
    };

    const cleanupDonations = async (status: string) => {
        const label = status === 'pending' ? 'PENDENTE' : 'CANCELADO/RECUSADO';
        if (!confirm(`Tem certeza que deseja apagar todas as contribuições com status "${label}"?`)) return;

        setLoading(true);
        try {
            let statusesToDelete = [status];
            if (status === 'canceled') {
                // Delete all statuses that show as "CANCELADO" in the table
                statusesToDelete = ['canceled', 'cancelled', 'declined', 'refused', 'failed'];
            }

            const { error } = await supabase.from('donations').delete().in('status', statusesToDelete);

            if (error) {
                throw error;
            }

            fetchDonations();
            alert('Contribuições apagadas com sucesso!');
        } catch (e) {
            console.error('Erro ao apagar:', e);
            alert('Erro ao apagar contribuições.');
        } finally {
            setLoading(false);
        }
    };

    // User requested "dropdown de apagar". I'll add a simple select for actions or just buttons.
    // "botão com dropdown de apagar pendente e cancelados"
    // I will implement a "Ações" dropdown/details menu.

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando painel...</div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src="/logo-black.png" alt="Logo" style={{ height: '32px' }} />
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Dashboard</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}
                    >
                        <Icons.Logout /> Sair
                    </button>
                </div>
            </header>

            <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Arrecadação Total (Pago)</span>
                            <div style={{ color: '#10b981' }}><Icons.Money /></div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Arrecadação Hoje</span>
                            <div style={{ color: '#10b981' }}><Icons.Clock /></div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>R$ {stats.todayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Arrecadação Mês</span>
                            <div style={{ color: '#10b981' }}><Icons.Money /></div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>R$ {stats.monthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total de Transações</span>
                            <div style={{ color: '#3b82f6' }}><Icons.Users /></div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.count}</div>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Via PIX</span>
                            <div style={{ color: '#8b5cf6' }}><span style={{ fontSize: '0.875rem', fontWeight: 800 }}>PIX</span></div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.pix}</div>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Via Cartão</span>
                            <div style={{ color: '#f59e0b' }}><span style={{ fontSize: '0.875rem', fontWeight: 800 }}>CARTÃO</span></div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.card}</div>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Membros (CPF Único)</span>
                            <div style={{ color: '#ec4899' }}><Icons.Users /></div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.members}</div>
                    </div>
                </div>

                {/* Recent Donations Table */}
                <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Contribuições Recentes</h2>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                                />
                                <span style={{ color: '#6b7280' }}>até</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{ padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <details style={{ position: 'relative' }}>
                                <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '0.5rem 1rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Icons.Trash /> Limpar <span style={{ fontSize: '0.7em' }}>▼</span>
                                </summary>
                                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '0.25rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.375rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '180px' }}>
                                    <button
                                        onClick={() => cleanupDonations('pending')}
                                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: '0.875rem', color: '#b45309' }}
                                    >
                                        Apagar Pendentes
                                    </button>
                                    <button
                                        onClick={() => cleanupDonations('canceled')}
                                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#991b1b' }}
                                    >
                                        Apagar Cancelados
                                    </button>
                                </div>
                            </details>
                            <button onClick={fetchDonations} style={{ fontSize: '0.875rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>Atualizar</button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                            <thead style={{ background: '#f9fafb' }}>
                                <tr>
                                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Data/Hora</th>
                                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Doador</th>
                                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>CPf / Contato</th>
                                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Valor</th>
                                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Tipo / Local</th>
                                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: '0.875rem', color: '#111827' }}>
                                {paginatedDonations.map((d) => (
                                    <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 500 }}>{new Date(d.created_at).toLocaleDateString('pt-BR')}</div>
                                            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{new Date(d.created_at).toLocaleTimeString('pt-BR')}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600 }}>{d.payer_name || 'Anônimo'}</div>
                                            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{d.payer_email}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div>{d.payer_cpf}</div>
                                            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{d.payer_phone}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                                            R$ {Number(d.amount).toFixed(2).replace('.', ',')}
                                            <div style={{ fontSize: '0.75rem', color: d.payment_method === 'pix' ? '#8b5cf6' : '#f59e0b' }}>
                                                {d.payment_method === 'pix' ? 'PIX' : 'CARTÃO'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ textTransform: 'capitalize' }}>{d.type}</div>
                                            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{d.church_location}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: d.status === 'paid' ? '#d1fae5' : (d.status === 'pending' ? '#fef3c7' : '#fee2e2'),
                                                color: d.status === 'paid' ? '#065f46' : (d.status === 'pending' ? '#92400e' : '#991b1b')
                                            }}>
                                                {d.status === 'paid' ? 'PAGO' : (d.status === 'pending' ? 'PENDENTE' : 'CANCELADO')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredDonations.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                                            Nenhuma doação encontrada neste período.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Mostrando {filteredDonations.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} até {Math.min(currentPage * itemsPerPage, filteredDonations.length)} de {filteredDonations.length} resultados
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{ padding: '0.375rem 0.75rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '0.375rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || totalPages === 0}
                                style={{ padding: '0.375rem 0.75rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '0.375rem', cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages || totalPages === 0 ? 0.5 : 1 }}
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
