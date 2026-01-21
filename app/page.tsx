'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { jsPDF } from 'jspdf';
import { supabase } from '@/lib/supabase';

// SVG Icons
const Icons = {
    Logo: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
    Gift: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>,
    Hammer: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>,
    Heart: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
    Globe: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
    Pix: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2h5a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2.5h-5A2 2 0 0 1 7.5 6V4a2 2 0 0 1 2-2Z" /><path d="M7 10h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" /></svg>, // Simplified generic wallet-like or QR for PIX
    ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,

};

const DONATION_TYPES = [
    {
        id: 'dizimo',
        label: 'Dízimos',
        description: 'Deus nos chama a devolver os primeiros 10% da nossa renda a Ele como um ato de obediência. Quando você dizima, você está confiando suas finanças a Deus.',
        icon: Icons.Logo,
        category: 'tithe'
    },
    {
        id: 'ofertas',
        label: 'Ofertas',
        description: 'Contribua para a manutenção e as atividades gerais da igreja além do dízimo.',
        icon: Icons.Gift,
        category: 'offer'
    },
    {
        id: 'construcao',
        label: 'Construção',
        description: 'Ajude na expansão, reforma e construção de novos espaços para o Reino.',
        icon: Icons.Hammer,
        category: 'offer'
    },
    {
        id: 'chama_social',
        label: 'Chama Social',
        description: 'Apoie nossos projetos sociais que levam amor e dignidade a quem precisa.',
        icon: Icons.Heart,
        category: 'offer'
    },
    {
        id: 'missoes_africa',
        label: 'Missões África',
        description: 'Semeie na vida de missionários e projetos que estão levando o Evangelho à África.',
        icon: Icons.Globe,
        category: 'offer'
    },
];

const LOCATIONS = [
    { id: 'central', label: 'Chama Church  - Manaus' },
    { id: 'manacapuru', label: 'Chama Church - Manacapuru' },
    { id: 'africa', label: 'Chama Church África' },
    { id: 'online', label: 'Chama Church On-line' },
];

export default function Home() {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState('');
    const [selectedType, setSelectedType] = useState(DONATION_TYPES[0].id);
    const [selectedLocation, setSelectedLocation] = useState('');

    // Modal State
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);

    // User Data
    const [cpf, setCpf] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [whatsapp, setWhatsapp] = useState('');

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');
    const [loading, setLoading] = useState(false);
    const [pixData, setPixData] = useState<{ qrCode: string, text: string } | null>(null);

    // Card State
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardExp, setCardExp] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // CPF Search State
    const [isCheckingCpf, setIsCheckingCpf] = useState(false);
    const [showFullForm, setShowFullForm] = useState(false);

    // Receipt State
    const [successData, setSuccessData] = useState<any>(null);
    const [sendingReceipt, setSendingReceipt] = useState(false);

    // Polling for Pix Status
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (step === 3 && pixData && successData?.id) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch('/api/check-status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: successData.id })
                    });
                    const data = await res.json();

                    if (data.status === 'approved') {
                        clearInterval(interval);
                        setStep(4);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 5000); // Check every 5 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [step, pixData, successData]);

    const checkCpf = async (inputCpf: string) => {
        const clean = inputCpf.replace(/\D/g, '');
        if (clean.length !== 11) return;

        setIsCheckingCpf(true);
        try {
            const res = await fetch('/api/check-donor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cpf: clean })
            });
            const data = await res.json();

            if (data.found && data.donor) {
                setName(data.donor.name || '');
                setEmail(data.donor.email || '');
                setWhatsapp(data.donor.phone || '');
                setStep(3); // Auto advance to payment
            } else {
                setName('');
                setEmail('');
                setWhatsapp('');
                setShowFullForm(true);
            }
        } catch (err) {
            console.error(err);
            setShowFullForm(true);
        } finally {
            setIsCheckingCpf(false);
        }
    };

    const handlePayment = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const cleanPhone = whatsapp.replace(/\D/g, '');
            const cleanCpf = cpf.replace(/\D/g, '');
            let token = undefined;
            let paymentMethodId = undefined;
            let issuerId = undefined;

            if (paymentMethod === 'credit_card') {
                // Determine Key
                const mpKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
                console.log('Using MP Key:', mpKey?.substring(0, 8));

                // Initialize MP
                const mp = new (window as any).MercadoPago(mpKey);

                // 1. Get Payment Method (BIN)
                const cleanCardNumber = cardNumber.replace(/\s/g, '');
                if (cleanCardNumber.length < 6) throw new Error("Número do cartão incompleto");

                const bin = cleanCardNumber.substring(0, 6);
                const paymentMethods = await mp.getPaymentMethods({ bin });

                if (paymentMethods.results.length === 0) {
                    throw new Error("Bandeira do cartão não identificada.");
                }
                paymentMethodId = paymentMethods.results[0].id;
                issuerId = paymentMethods.results[0].issuer.id;

                // 2. Create Token
                const tokenRes = await mp.createCardToken({
                    cardNumber: cleanCardNumber,
                    cardholderName: cardName,
                    cardExpirationMonth: cardExp.split('/')[0],
                    cardExpirationYear: '20' + cardExp.split('/')[1],
                    securityCode: cardCvv,
                    identification: {
                        type: 'CPF',
                        number: cleanCpf
                    }
                });

                if (!tokenRes.id) throw new Error("Não foi possível validar o cartão.");
                token = tokenRes.id;
            }

            const res = await fetch('/api/donate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    description: `Doação - ${currentTypeLabel}`,
                    churchLocation: selectedLocation,
                    customer: {
                        name,
                        email: email || 'comprador@chamachurch.com',
                        cpf: cleanCpf,
                        phone: cleanPhone
                    },
                    paymentMethod: paymentMethod,
                    // Send Token Data (if Card)
                    token,
                    paymentMethodId,
                    issuerId,
                    installments: 1
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao processar');
            }

            // Save success data structure (used if approved)
            const successPayload = {
                amount: amount,
                date: new Date().toLocaleDateString('pt-BR'),
                time: new Date().toLocaleTimeString('pt-BR'),
                type: DONATION_TYPES.find(t => t.id === selectedType)?.label,
                churchLocation: LOCATIONS.find(l => l.id === selectedLocation)?.label || 'Online',
                id: data.id || 'N/A',
                payer: name
            };

            // 1. Handle Pix
            if (paymentMethod === 'pix' && data.qr_codes) {
                const qrLink = data.qr_codes[0].links.find((l: any) => l.rel === 'QRCODE.PNG').href;
                setSuccessData(successPayload); // Prepare data for later
                setPixData({
                    qrCode: qrLink,
                    text: data.qr_codes[0].text
                });
                return;
            }

            // 2. Handle Card / Status
            if (data.status === 'approved') {
                setSuccessData(successPayload);
                setStep(4);
            } else if (data.status === 'in_process') {
                setSuccessData(successPayload);
                setStep(4);
                // Optionally show a "Em processamento" warning, but usually we treat as received
            } else if (data.status === 'rejected') {
                const errorMap: Record<string, string> = {
                    'cc_rejected_bad_filled_card_number': 'Número do cartão inválido.',
                    'cc_rejected_bad_filled_date': 'Data de validade inválida.',
                    'cc_rejected_bad_filled_other': 'Verifique os dados do cartão.',
                    'cc_rejected_bad_filled_security_code': 'Código de segurança inválido.',
                    'cc_rejected_blacklist': 'Não conseguimos processar seu pagamento.',
                    'cc_rejected_call_for_authorize': 'Autorize o pagamento com seu banco.',
                    'cc_rejected_card_disabled': 'Ligue para o seu banco para ativar o cartão.',
                    'cc_rejected_card_error': 'Erro no processamento do cartão.',
                    'cc_rejected_duplicated_payment': 'Você já fez um pagamento com esse valor.',
                    'cc_rejected_high_risk': 'Pagamento recusado por segurança.',
                    'cc_rejected_insufficient_amount': 'Saldo insuficiente.',
                    'cc_rejected_invalid_installments': 'Número de parcelas inválido.',
                    'cc_rejected_max_attempts': 'Limite de tentativas excedido.',
                    'cc_rejected_other_reason': 'Cartão recusado. Tente outro cartão.'
                };
                throw new Error(`${errorMap[data.detail] || 'Pagamento recusado. Tente outro meio de pagamento.'} (Código: ${data.detail})`);
            } else {
                throw new Error(`Status do pagamento: ${data.status}`);
            }

        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReceipt = async () => {
        if (!successData) return;
        setSendingReceipt(true);

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
            doc.text(`Data: ${successData.date} às ${successData.time}`, 20, 50);
            doc.text(`Igreja: ${successData.churchLocation || 'Online'}`, 20, 60);
            doc.text(`Doador: ${successData.payer}`, 20, 70);
            doc.text(`Tipo: ${successData.type}`, 20, 80);
            doc.text(`ID da Transação: ${successData.id}`, 20, 90);

            // Amount Box
            doc.setFillColor(240, 240, 240);
            doc.rect(20, 100, 170, 20, 'F');
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Valor: R$ ${parseFloat(successData.amount).toFixed(2).replace('.', ',')}`, 105, 113, { align: "center" });

            // Footer
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text("Obrigado por sua generosidade!", 105, 130, { align: "center" });
            doc.text("Deus abençoe sua vida.", 105, 135, { align: "center" });

            // Generate Blob
            const pdfBlob = doc.output('blob');
            const fileName = `recibo_${Date.now()}.pdf`;

            // Upload to Supabase
            const { error } = await supabase
                .storage
                .from('receipts')
                .upload(fileName, pdfBlob, {
                    contentType: 'application/pdf'
                });

            if (error) throw error;

            // Generate Short Code
            const shortId = Math.random().toString(36).substring(2, 8);

            // Save mapping to DB
            const { error: dbError } = await supabase
                .from('receipts_log')
                .insert({
                    short_id: shortId,
                    storage_path: fileName
                });

            if (dbError) throw dbError;

            // Create Short Link
            const shortLink = `${window.location.origin}/c/${shortId}`;

            // Open WhatsApp
            const message = `Olá, paz do Senhor! Segue meu comprovante de doação: ${shortLink}`;
            window.open(`https://wa.me/5592995199964?text=${encodeURIComponent(message)}`, '_blank');

        } catch (error) {
            console.error("Error generating receipt:", error);
            alert("Erro ao gerar comprovante via link. Tente novamente.");
        } finally {
            setSendingReceipt(false);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
    };

    const handleNext = () => {
        if (step === 1) {
            if (amount && selectedLocation) setStep(2);
            else if (!selectedLocation) alert("Por favor, selecione uma localização.");
        }
        else if (step === 2) {
            if (!showFullForm) {
                if (cpf.replace(/\D/g, '').length === 11) checkCpf(cpf);
                return;
            }
            if (name && whatsapp && cpf) setStep(3);
        }
    };

    const resetForm = () => {
        setStep(1);
        setAmount('');
        // Reset card data
        setCardNumber('');
        setCardCvv('');
        setCardExp('');
        setCardName('');
        setPaymentMethod('credit_card');
        setPixData(null);
        setErrorMsg('');

        // Reset user data
        setIsCheckingCpf(false);
        setShowFullForm(false);
        setCpf('');
        setName('');
        setEmail('');
        setWhatsapp('');
    };

    const currentTypeLabel = DONATION_TYPES.find(t => t.id === selectedType)?.label;

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={`container ${styles.headerContent}`}>
                    <div className={styles.logoWrapper}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" alt="Chama Church" className={styles.logoImage} />
                    </div>

                    <Link href="/historico" className={styles.historyButton}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span className={styles.historyText}>Meu Histórico</span>
                    </Link>
                </div>
            </header>

            {/* Type Selection Modal */}
            {showTypeModal && (
                <div className={styles.modalOverlay} onClick={() => setShowTypeModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <button className={styles.closeButton} onClick={() => setShowTypeModal(false)}>×</button>
                            <h3 className={styles.modalTitle}>Fundo</h3>
                            <div style={{ width: 24 }}></div> {/* Spacer for alignment */}
                        </div>
                        <div className={styles.modalList}>
                            {/* Tithe Section */}
                            {DONATION_TYPES.filter(t => t.category === 'tithe').map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        className={`${styles.modalItem} ${selectedType === type.id ? styles.selectedType : ''}`}
                                        onClick={() => setSelectedType(type.id)}
                                    >
                                        <div className={styles.iconWrapper}>
                                            <Icon />
                                        </div>
                                        <div className={styles.itemContent}>
                                            <span className={styles.itemLabel}>{type.label}</span>
                                            <p className={styles.itemDescription}>{type.description}</p>
                                        </div>
                                        <div className={`${styles.radioButton} ${selectedType === type.id ? styles.radioSelected : ''}`}></div>
                                    </button>
                                );
                            })}

                            <div className={styles.sectionHeader}>OFERTAS (ALÉM DO DÍZIMO)</div>

                            {/* Offers Section */}
                            {DONATION_TYPES.filter(t => t.category === 'offer').map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        className={`${styles.modalItem} ${selectedType === type.id ? styles.selectedType : ''}`}
                                        onClick={() => setSelectedType(type.id)}
                                    >
                                        <div className={styles.iconWrapper}>
                                            <Icon />
                                        </div>
                                        <div className={styles.itemContent}>
                                            <span className={styles.itemLabel}>{type.label}</span>
                                            <p className={styles.itemDescription}>{type.description}</p>
                                        </div>
                                        <div className={`${styles.radioButton} ${selectedType === type.id ? styles.radioSelected : ''}`}></div>
                                    </button>
                                );
                            })}

                            <div className={styles.modalFooter}>
                                <button className={styles.doneButton} onClick={() => setShowTypeModal(false)}>
                                    Feito
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Location Selection Modal */}
            {
                showLocationModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowLocationModal(false)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <button className={styles.closeButton} onClick={() => setShowLocationModal(false)}>×</button>
                                <h3 className={styles.modalTitle}>Selecione a Localização</h3>
                                <div style={{ width: 24 }}></div>
                            </div>
                            <div className={styles.modalList}>
                                {LOCATIONS.map((loc) => (
                                    <button
                                        key={loc.id}
                                        className={`${styles.modalItem} ${selectedLocation === loc.id ? styles.selectedType : ''}`}
                                        onClick={() => {
                                            setSelectedLocation(loc.id);
                                            setShowLocationModal(false);
                                        }}
                                    >
                                        <div className={styles.itemContent} style={{ display: 'flex', alignItems: 'center' }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src="/logo-black.png" alt="Logo" className={styles.locationLogo} />
                                            <span className={styles.itemLabel}>{loc.label}</span>
                                        </div>
                                        <div className={`${styles.radioButton} ${selectedLocation === loc.id ? styles.radioSelected : ''}`}></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Hero Section */}
            <div className={styles.heroSection}>
                <div className={`container ${styles.heroContainer}`}>
                    {/* Hero Text */}
                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>Suas doações estão mudando a nossa Comunidade.</h1>
                        <p className={styles.heroSubtitle}>
                            Você pode apoiar o trabalho que a Chama Church realiza em sua comunidade e ao redor do mundo.
                        </p>
                    </div>

                    {/* Donation Widget */}
                    <div className={styles.donationWidget}>
                        <div className={styles.card}>
                            {/* Step 4: Success */}
                            {step === 4 ? (
                                <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                                    <div style={{ marginBottom: '1.5rem', color: '#10b981', display: 'flex', justifyContent: 'center' }}>
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M7.75 12.75L10.25 15.25L16.25 9.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <h2 className={styles.heading} style={{ marginBottom: '0.5rem' }}>Obrigado!</h2>
                                    <p className={styles.subtext} style={{ fontSize: '1.1rem', color: '#333' }}>
                                        Sua contribuição foi recebida com sucesso.
                                    </p>
                                    <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                                        Deus abençoe sua vida.
                                    </p>
                                    <p style={{ marginTop: '0.5rem', color: '#999', fontSize: '0.8rem' }}>
                                        Horário: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>

                                    <button
                                        className={styles.outlineButton}
                                        onClick={handleSendReceipt}
                                        disabled={sendingReceipt}
                                        style={{ marginTop: '2rem', width: '100%', marginBottom: '1rem' }}
                                    >
                                        {sendingReceipt ? 'Gerando Link...' : 'Enviar comprovante'}
                                    </button>
                                    <button
                                        className={styles.primaryButton}
                                        onClick={resetForm}
                                        style={{ marginTop: '2rem' }}
                                    >
                                        Fazer nova doação
                                    </button>
                                </div>
                            ) : null}

                            {/* Step 1: Donation Details */}
                            {step === 1 && (
                                <div className="animate-fade-in">
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <button
                                            className={styles.selectTrigger}
                                            onClick={() => setShowLocationModal(true)}
                                            style={{ width: '100%', justifyContent: 'space-between' }}
                                        >
                                            <span style={{ color: selectedLocation ? 'inherit' : '#666' }}>
                                                {selectedLocation
                                                    ? LOCATIONS.find(l => l.id === selectedLocation)?.label
                                                    : "Selecione o local..."}
                                            </span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </button>
                                    </div>

                                    <h2 className={styles.heading}>Faça sua contribuição</h2>
                                    <p className={styles.subtext}>Escolha o valor e o destino da sua contribuição.</p>

                                    <div className={styles.amountContainer}>
                                        <div className={styles.amountInputWrapper}>
                                            <span className={styles.currencySymbol}>R$</span>
                                            <input
                                                type="number"
                                                className={styles.amountInput}
                                                placeholder="0"
                                                value={amount}
                                                onChange={handleAmountChange}
                                                autoFocus
                                            />
                                        </div>

                                        <button className={styles.selectTrigger} onClick={() => setShowTypeModal(true)}>
                                            {currentTypeLabel}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </button>
                                    </div>

                                    <button className={styles.primaryButton} onClick={handleNext}>
                                        Continuar
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Identification */}
                            {step === 2 && (
                                <div className="animate-fade-in">
                                    <button className={styles.backButton} onClick={() => setStep(1)}>
                                        <Icons.ChevronLeft /> Voltar
                                    </button>
                                    <h2 className={styles.heading}>Seus Dados</h2>
                                    <p className={styles.subtext}>
                                        {showFullForm
                                            ? "Complete seus dados para continuar."
                                            : "Informe seu CPF para iniciarmos."}
                                    </p>

                                    <div className={styles.inputGroup}>
                                        <label>CPF</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="text"
                                                className={styles.input}
                                                placeholder="000.000.000-00"
                                                value={cpf}
                                                maxLength={14}
                                                onChange={(e) => {
                                                    let value = e.target.value.replace(/\D/g, '');
                                                    if (value.length > 11) value = value.slice(0, 11);

                                                    const rawValue = value;

                                                    if (value.length > 0) {
                                                        value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                                        value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                                        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                                    }
                                                    setCpf(value);

                                                    // Auto check when full (11 digits)
                                                    if (rawValue.length === 11) {
                                                        checkCpf(rawValue);
                                                    }
                                                }}
                                                disabled={isCheckingCpf}
                                                autoFocus
                                            />
                                            {isCheckingCpf && (
                                                <div style={{ position: 'absolute', right: 10, top: 10, fontSize: '1.2rem' }}>
                                                    <span className={styles.spin}>↻</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(showFullForm) && (
                                        <div className="animate-fade-in">
                                            <div className={styles.inputGroup}>
                                                <label>Nome Completo</label>
                                                <input
                                                    type="text"
                                                    className={styles.input}
                                                    placeholder="Seu nome"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                />
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label>WhatsApp</label>
                                                <input
                                                    type="tel"
                                                    className={styles.input}
                                                    placeholder="(00) 00000-0000"
                                                    value={whatsapp}
                                                    maxLength={15}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, '');
                                                        if (value.length > 11) value = value.slice(0, 11);

                                                        if (value.length > 2) {
                                                            value = value.replace(/^(\d{2})(\d)/, '($1) $2');
                                                            value = value.replace(/(\d{5})(\d)/, '$1-$2');
                                                        }
                                                        setWhatsapp(value);
                                                    }}
                                                />
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label>E-mail (Opcional)</label>
                                                <input
                                                    type="email"
                                                    className={styles.input}
                                                    placeholder="seu@email.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        className={styles.primaryButton}
                                        onClick={handleNext}
                                        disabled={isCheckingCpf || (showFullForm && (!name || !whatsapp))}
                                    >
                                        {isCheckingCpf ? 'Verificando...' : (showFullForm ? 'Ir para Pagamento' : 'Continuar')}
                                    </button>
                                </div>
                            )}

                            {/* Step 3: Transparent Checkout */}
                            {step === 3 && (
                                <div className="animate-fade-in">
                                    <button className={styles.backButton} onClick={() => pixData ? setPixData(null) : setStep(2)}>
                                        <Icons.ChevronLeft /> Voltar
                                    </button>
                                    <h2 className={styles.heading}>Pagamento Seguro</h2>

                                    <div className={styles.summary}>
                                        <div className={styles.summaryRow}>
                                            <span>Destino:</span>
                                            <strong>{LOCATIONS.find(l => l.id === selectedLocation)?.label}</strong>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Finalidade:</span>
                                            <strong>{DONATION_TYPES.find(t => t.id === selectedType)?.label}</strong>
                                        </div>
                                        <div className={styles.summaryTotal}>
                                            <span>Valor Total</span>
                                            <span className={styles.totalValue}>R$ {amount ? parseFloat(amount).toFixed(2).replace('.', ',') : '0,00'}</span>
                                        </div>
                                    </div>

                                    {/* QR Code Display (Result) */}
                                    {pixData ? (
                                        <div className={styles.pixResult} style={{ textAlign: 'center', margin: '2rem 0' }}>
                                            <p style={{ marginBottom: '1rem', fontWeight: 600 }}>Escaneie o QR Code abaixo:</p>
                                            <img src={pixData.qrCode} alt="QR Code Pix" style={{ width: 200, height: 200, margin: '0 auto', display: 'block' }} />

                                            <div style={{ marginTop: '1.5rem' }}>
                                                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Ou copie o código:</p>
                                                <div style={{
                                                    background: '#f4f4f5',
                                                    padding: '0.75rem',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.8rem',
                                                    wordBreak: 'break-all',
                                                    border: '1px solid #e4e4e7'
                                                }}>
                                                    {pixData.text}
                                                </div>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(pixData.text)}
                                                    style={{
                                                        marginTop: '0.5rem',
                                                        color: '#000',
                                                        textDecoration: 'underline',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    Copiar Código Pix
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Payment Methods */}
                                            <div className={styles.paymentTabs}>
                                                <button
                                                    className={`${styles.paymentTab} ${paymentMethod === 'credit_card' ? styles.activeTab : ''}`}
                                                    onClick={() => setPaymentMethod('credit_card')}
                                                >
                                                    Cartão de Crédito
                                                </button>
                                                <button
                                                    className={`${styles.paymentTab} ${paymentMethod === 'pix' ? styles.activeTab : ''}`}
                                                    onClick={() => setPaymentMethod('pix')}
                                                >
                                                    PIX
                                                </button>
                                            </div>

                                            {paymentMethod === 'credit_card' ? (
                                                <div className={styles.paymentForm}>
                                                    <div className={styles.inputGroup}>
                                                        <label>Número do Cartão</label>
                                                        <input
                                                            type="text"
                                                            className={styles.input}
                                                            placeholder="0000 0000 0000 0000"
                                                            value={cardNumber}
                                                            maxLength={19}
                                                            onChange={(e) => {
                                                                let v = e.target.value.replace(/\D/g, '');
                                                                if (v.length > 16) v = v.slice(0, 16);
                                                                setCardNumber(v.replace(/(\d{4})/g, '$1 ').trim());
                                                            }}
                                                        />
                                                    </div>

                                                    <div className={styles.row}>
                                                        <div className={styles.inputGroup}>
                                                            <label>Validade</label>
                                                            <input
                                                                type="text"
                                                                className={styles.input}
                                                                placeholder="MM/AA"
                                                                value={cardExp}
                                                                maxLength={5}
                                                                onChange={(e) => {
                                                                    let v = e.target.value.replace(/\D/g, '');
                                                                    if (v.length > 4) v = v.slice(0, 4);
                                                                    if (v.length > 2) v = v.replace(/^(\d{2})/, '$1/');
                                                                    setCardExp(v);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className={styles.inputGroup}>
                                                            <label>CVV</label>
                                                            <input
                                                                type="text"
                                                                className={styles.input}
                                                                placeholder="123"
                                                                value={cardCvv}
                                                                maxLength={4}
                                                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className={styles.inputGroup}>
                                                        <label>Nome no Cartão</label>
                                                        <input
                                                            type="text"
                                                            className={styles.input}
                                                            placeholder="Como está no cartão"
                                                            value={cardName}
                                                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={styles.paymentForm} style={{ textAlign: 'center', padding: '1rem' }}>
                                                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src="/pix-logo.png" alt="Pix" style={{ height: '48px', width: 'auto' }} />
                                                    </div>
                                                    <p style={{ marginTop: '1rem' }}>O QR Code será gerado na próxima tela.</p>
                                                </div>
                                            )}

                                            <button
                                                className={styles.primaryButton}
                                                onClick={handlePayment}
                                                disabled={loading}
                                            >
                                                {loading ? 'Processando...' : 'Finalizar Doação'}
                                            </button>

                                            {errorMsg && (
                                                <div style={{
                                                    marginTop: '1rem',
                                                    padding: '0.75rem',
                                                    backgroundColor: '#fee2e2',
                                                    border: '1px solid #ef4444',
                                                    borderRadius: '0.5rem',
                                                    color: '#b91c1c',
                                                    fontSize: '0.875rem',
                                                    textAlign: 'center'
                                                }}>
                                                    {errorMsg}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <p className={styles.secureBadge}>🔒 Ambiente Seguro via Mercado Pago</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Section (Detailing the Tithe) */}
            <section className={styles.infoSection}>
                <div className="container">
                    <div className={styles.infoContent}>
                        <div className={styles.infoIcon}>
                            <Icons.Heart />
                        </div>
                        <h2 className={styles.infoTitle}>Dízimo</h2>
                        <h3 className={styles.infoSubtitle}>Ao dar o dízimo, você está confiando suas finanças a Deus.</h3>
                        <p className={styles.infoText}>
                            O dízimo é um princípio bíblico. Deus nos chama a devolver a Ele os primeiros 10% da nossa renda.
                            Temos visto Deus prover abundantemente em nossa igreja e sabemos que Ele proverá abundantemente
                            para você e sua família quando você O colocar em primeiro lugar em suas finanças.
                        </p>
                        <p className={styles.infoText} style={{ marginTop: '2rem', fontStyle: 'italic', fontSize: '1.1rem' }}>
                            &quot;Tragam todos os dízimos à casa do tesouro, para que haja alimento em minha casa. Ponham-me à prova nisto&quot;, diz o Senhor dos Exércitos, &quot;e vejam se não abrirei as comportas do céu e não derramarei sobre vocês tantas bênçãos que nem haverá lugar suficiente para guardá-las.&quot;
                        </p>
                        <p className={styles.infoText} style={{ fontWeight: 700, marginTop: '0.5rem' }}>
                            Malaquias 3:10 NVI
                        </p>
                    </div>
                </div>
            </section>
        </main >
    );
}
