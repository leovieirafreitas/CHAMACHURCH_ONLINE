'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { jsPDF } from 'jspdf';
import styles from './page.module.css';
import CustomDatePicker from '@/app/components/CustomDatePicker';

const LOCATIONS = [
    { id: 'central', label: 'Chama Church - Manaus' },
    { id: 'manacapuru', label: 'Chama Church - Manacapuru' },
    { id: 'africa', label: 'Chama Church África' },
    { id: 'online', label: 'Chama Church On-line' },
];

export default function HistoryPage() {
    const [cpf, setCpf] = useState('');
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [memberName, setMemberName] = useState('');
    const [sharingId, setSharingId] = useState<string | null>(null);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const checkPendingStatuses = async (items: any[]) => {
        const pendingItems = items.filter(item => item.status === 'pending' && item.pagbank_order_id);

        if (pendingItems.length === 0) return;

        const updates: Record<string, any> = {};

        await Promise.all(pendingItems.map(async (item) => {
            try {
                const res = await fetch('/api/check-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: item.pagbank_order_id })
                });
                const data = await res.json();

                // Map MP status to our internal status
                let newStatus = 'pending';
                if (data.status === 'approved') newStatus = 'paid';
                else if (data.status === 'rejected') newStatus = 'declined';
                else if (data.status === 'cancelled') newStatus = 'canceled';

                if (newStatus !== 'pending') {
                    updates[item.id] = newStatus;
                }
            } catch (e) {
                console.error(`Failed to check status for ${item.id}`, e);
            }
        }));

        if (Object.keys(updates).length > 0) {
            setHistory(currentHistory =>
                currentHistory.map(item =>
                    updates[item.id] ? { ...item, status: updates[item.id] } : item
                )
            );
        }
    };

    const fetchHistory = async (cpfValue: string, start?: string, end?: string) => {
        setLoading(true);
        setHistory([]);
        console.log(`Fetching history for CPF: ${cpfValue}, Start: ${start}, End: ${end}`);
        // setMemberName(''); // Don't clear member name if we are just filtering

        try {
            const cleanCpf = cpfValue.replace(/\D/g, '');

            let query = supabase
                .from('donations')
                .select('*')
                .eq('payer_cpf', cleanCpf);

            if (start) {
                // Append time to force local time interpretation, then convert to UTC
                const startDateObj = new Date(`${start}T00:00:00`);
                console.log('Filter Start (UTC):', startDateObj.toISOString());
                query = query.gte('created_at', startDateObj.toISOString());
            }
            if (end) {
                // Append time to force local time interpretation, then convert to UTC
                const endDateObj = new Date(`${end}T23:59:59.999`);
                console.log('Filter End (UTC):', endDateObj.toISOString());
                query = query.lte('created_at', endDateObj.toISOString());
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching history:', error);
            } else {
                console.log('History fetched:', data?.length, 'items');
                if (data) {
                    setHistory(data);
                    if (data.length > 0 && !memberName) {
                        setMemberName(data[0].payer_name || 'Membro');
                    }
                    if (data.length > 0) {
                        checkPendingStatuses(data);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cpf) return;

        setSearched(false);
        setMemberName(''); // Reset for new search
        await fetchHistory(cpf); // Initial search without dates
        setSearched(true);
    };

    const handleFilter = async () => {
        if (!cpf) return;
        await fetchHistory(cpf, startDate, endDate);
    };

    const generateReceipt = (item: any) => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text("CHAMA CHURCH", 105, 20, { align: "center" });

            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.text("Comprovante de Contribuição", 105, 30, { align: "center" });

            // Divider
            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);

            // Content
            doc.setFontSize(12);
            const date = new Date(item.created_at);
            doc.text(`Data: ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR')}`, 20, 50);
            const locationLabel = LOCATIONS.find(l => l.id === item.church_location)?.label || item.church_location || 'Online';
            doc.text(`Igreja: ${locationLabel}`, 20, 60);
            doc.text(`Doador: ${item.payer_name || memberName}`, 20, 70);
            doc.text(`Tipo: ${item.type}`, 20, 80);
            doc.text(`ID da Transação: ${item.id}`, 20, 90);

            // Amount Box
            doc.setFillColor(240, 240, 240);
            doc.rect(20, 100, 170, 20, 'F');
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Valor: R$ ${parseFloat(item.amount).toFixed(2).replace('.', ',')}`, 105, 113, { align: "center" });

            // Footer
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text("Obrigado por sua generosidade!", 105, 130, { align: "center" });
            doc.text("Deus abençoe sua vida.", 105, 135, { align: "center" });

            // Save
            doc.save(`recibo_${date.toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Error generating receipt:", error);
            alert("Erro ao baixar comprovante.");
        }
    };

    const shareReceipt = async (item: any) => {
        setSharingId(item.id);
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text("CHAMA CHURCH", 105, 20, { align: "center" });

            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.text("Comprovante de Contribuição", 105, 30, { align: "center" });

            // Divider
            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);

            // Content
            doc.setFontSize(12);
            const date = new Date(item.created_at);
            doc.text(`Data: ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR')}`, 20, 50);
            const locationLabel = LOCATIONS.find(l => l.id === item.church_location)?.label || item.church_location || 'Online';
            doc.text(`Igreja: ${locationLabel}`, 20, 60);
            doc.text(`Doador: ${item.payer_name || memberName}`, 20, 70);
            doc.text(`Tipo: ${item.type}`, 20, 80);
            doc.text(`ID da Transação: ${item.id}`, 20, 90);

            // Amount Box
            doc.setFillColor(240, 240, 240);
            doc.rect(20, 100, 170, 20, 'F');
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Valor: R$ ${parseFloat(item.amount).toFixed(2).replace('.', ',')}`, 105, 113, { align: "center" });

            // Footer
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text("Obrigado por sua generosidade!", 105, 130, { align: "center" });
            doc.text("Deus abençoe sua vida.", 105, 135, { align: "center" });

            // Generate Blob
            const pdfBlob = doc.output('blob');
            const fileName = `recibo_${item.id}_${Date.now()}.pdf`;

            // Upload to Supabase
            const { error } = await supabase.storage
                .from('receipts')
                .upload(fileName, pdfBlob, {
                    contentType: 'application/pdf'
                });

            if (error) throw error;

            // Short Link
            const shortId = Math.random().toString(36).substring(2, 8);
            await supabase.from('receipts_log').insert({ short_id: shortId, storage_path: fileName });

            const shortLink = `${window.location.origin}/c/${shortId}`;
            const message = `Olá, paz do Senhor! Segue meu comprovante de doação: ${shortLink}`;
            window.open(`https://wa.me/5592995199964?text=${encodeURIComponent(message)}`, '_blank');
        } catch (error) {
            console.error(error);
            alert("Erro ao compartilhar comprovante.");
        } finally {
            setSharingId(null);
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
                        Doação
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

                                        <div style={{ marginBottom: '1.5rem', background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Filtrar por data</h3>
                                            <div className={styles.filters} key="filters-v2">
                                                <div className={styles.filterGroup}>
                                                    <label htmlFor="startDate" className={styles.label}>Data Inicial</label>
                                                    <CustomDatePicker
                                                        id="startDate"
                                                        value={startDate}
                                                        onChange={setStartDate}
                                                    />
                                                </div>
                                                <div className={styles.filterGroup}>
                                                    <label htmlFor="endDate" className={styles.label}>Data Final</label>
                                                    <CustomDatePicker
                                                        id="endDate"
                                                        value={endDate}
                                                        onChange={setEndDate}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                                                    <button
                                                        onClick={handleFilter}
                                                        disabled={loading}
                                                        className={styles.searchButton}
                                                        style={{ height: '42px', padding: '0 1.5rem' }}
                                                    >
                                                        Filtrar
                                                    </button>
                                                </div>
                                            </div>
                                            {(startDate || endDate) && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setStartDate(''); setEndDate(''); fetchHistory(cpf, '', ''); }}
                                                    className={styles.clearFilters}
                                                >
                                                    Limpar filtros
                                                </button>
                                            )}
                                        </div>
                                        <div className={styles.historyList}>
                                            {history.map((item) => (
                                                <div key={item.id} className={styles.historyItem}>
                                                    <div className={styles.itemLeft}>
                                                        <span className={styles.itemType}>{item.type || 'Contribuição'}</span>
                                                        <span style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.2rem' }}>
                                                            {LOCATIONS.find(l => l.id === item.church_location)?.label || item.church_location || 'Online'}
                                                        </span>
                                                        <span className={styles.itemDate}>
                                                            {new Date(item.created_at).toLocaleDateString('pt-BR')} às {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className={styles.itemLocation}>
                                                            {item.payment_method === 'pix' ? 'Pix' : 'Cartão de Crédito'} - {item.status === 'paid' ? 'Pago' : (item.status === 'pending' ? 'Pendente' : item.status)}
                                                        </span>
                                                    </div>
                                                    <div className={styles.itemRight}>
                                                        <span className={styles.itemAmount}>R$ {Number(item.amount).toFixed(2).replace('.', ',')}</span>
                                                        {item.status === 'paid' && (
                                                            <>
                                                                <button
                                                                    onClick={() => generateReceipt(item)}
                                                                    className={styles.downloadButton}
                                                                    title="Baixar PDF"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                        <polyline points="7 10 12 15 17 10" />
                                                                        <line x1="12" y1="15" x2="12" y2="3" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => shareReceipt(item)}
                                                                    className={styles.downloadButton}
                                                                    title="Enviar por WhatsApp"
                                                                    disabled={sharingId === item.id}
                                                                >
                                                                    {sharingId === item.id ? (
                                                                        <span className={styles.spin}>↻</span>
                                                                    ) : (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
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
        </main >
    );
}
