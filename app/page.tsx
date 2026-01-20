'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// SVG Icons
const Icons = {
    Logo: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 9.5 12 4l7.5 5.5" /><path d="M12 4v16" /><path d="M4.5 9.5v10.5h15V9.5" /></svg>,
    Gift: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5A2.5 2.5 0 0 1 12 8" /><path d="M16.5 8a2.5 2.5 0 0 1 0-5A2.5 2.5 0 0 1 12 8" /></svg>,
    Hammer: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" /><path d="M17.64 15 22 10.64" /><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25V7.86c0-.55-.45-1-1-1H14c-.55 0-1 .45-1 1v3.8c0 .09-.01.18-.04.27l-3.1 9.3" /></svg>,
    Heart: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>,
    Globe: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>,
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
    { id: 'online', label: 'Online' },
    { id: 'campo', label: 'Campo' },
];

export default function Home() {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState('');
    const [selectedType, setSelectedType] = useState(DONATION_TYPES[0].id);
    const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[1].id);

    // Modal State
    const [showTypeModal, setShowTypeModal] = useState(false);

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

    const handlePayment = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const cleanPhone = whatsapp.replace(/\D/g, '');
            const cleanCpf = cpf.replace(/\D/g, '');

            const res = await fetch('/api/donate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    description: `Doação - ${currentTypeLabel}`,
                    customer: {
                        name,
                        email: email || 'comprador@sandbox.pagseguro.com.br', // MUST be different from merchant email
                        cpf: cleanCpf,
                        phone: cleanPhone
                    },
                    paymentMethod: paymentMethod,
                    card: paymentMethod === 'credit_card' ? {
                        number: cardNumber.replace(/\s/g, ''),
                        holder: cardName,
                        expMonth: cardExp.split('/')[0],
                        expYear: '20' + cardExp.split('/')[1],
                        cvv: cardCvv
                    } : undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao processar');
            }

            if (paymentMethod === 'pix' && data.qr_codes) {
                const qrLink = data.qr_codes[0].links.find((l: any) => l.rel === 'QRCODE.PNG').href;
                setPixData({
                    qrCode: qrLink,
                    text: data.qr_codes[0].text
                });
            } else {
                setStep(4);
            }
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
    };

    const handleNext = () => {
        if (step === 1 && amount) setStep(2);
        else if (step === 2 && name && whatsapp && cpf) setStep(3);
    };

    const resetForm = () => {
        setStep(1);
        setAmount('');
        // Reset card data but keep user details for convenience
        setCardNumber('');
        setCardCvv('');
        setCardExp('');
        setCardName('');
        setPaymentMethod('credit_card');
        setPixData(null);
        setErrorMsg('');
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

            {/* Hero Section */}
            <div className={styles.heroSection}>
                <div className={`container ${styles.heroContainer}`}>
                    {/* Hero Text */}
                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>Suas doações estão mudando o Comunidade.</h1>
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
                                    <div className={styles.locationSelector}>
                                        {LOCATIONS.map((loc) => (
                                            <button
                                                key={loc.id}
                                                className={`${styles.locationButton} ${selectedLocation === loc.id ? styles.selectedLocation : ''}`}
                                                onClick={() => setSelectedLocation(loc.id)}
                                            >
                                                {loc.label}
                                            </button>
                                        ))}
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
                                    <button className={styles.backButton} onClick={() => setStep(1)}>← Voltar</button>
                                    <h2 className={styles.heading}>Seus Dados</h2>
                                    <p className={styles.subtext}>Identifique-se para registrarmos sua doação.</p>

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
                                        <label>CPF</label>
                                        <input
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

                                    <button className={styles.primaryButton} onClick={handleNext}>
                                        Ir para Pagamento
                                    </button>
                                </div>
                            )}

                            {/* Step 3: Transparent Checkout */}
                            {step === 3 && (
                                <div className="animate-fade-in">
                                    <button className={styles.backButton} onClick={() => pixData ? setPixData(null) : setStep(2)}>← Voltar</button>
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
                                                <div className={styles.paymentForm} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                                                    <Icons.Logo /> {/* Temporary visual */}
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

                                    <p className={styles.secureBadge}>🔒 Ambiente Seguro via PagBank</p>
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
                    </div>
                </div>
            </section>
        </main>
    );
}
