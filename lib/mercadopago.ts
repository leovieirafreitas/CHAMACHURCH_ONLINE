import { MercadoPagoConfig, Payment } from 'mercadopago';

// Initialize Client
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN!, options: { timeout: 5000 } });
const payment = new Payment(client);

interface CreatePaymentParams {
    amount: number;
    description: string;
    customer: {
        name: string;
        email: string;
        tax_id: string; // CPF
        phone: { area: string; number: string; };
    };
    paymentMethod: 'pix' | 'credit_card';
    // Card Data (Tokenized on Frontend)
    token?: string;
    paymentMethodId?: string; // e.g. "master", "visa"
    installments?: number;
    issuerId?: string;
}

export async function createMPPayment(params: CreatePaymentParams) {
    const { amount, description, customer, paymentMethod, token, paymentMethodId, installments, issuerId } = params;

    // Environment Check
    const isTestMode = process.env.MP_ACCESS_TOKEN?.startsWith('TEST');

    // Safety for Test Mode: Prevent "Collector equals Payer" error
    // MP rejects payments where payer email == account email
    const payerEmail = isTestMode
        ? `test_user_${Date.now()}@test.com`
        : customer.email;

    // Base Payment Data
    let paymentData: any = {
        transaction_amount: amount,
        description: description,
        payer: {
            email: payerEmail,
            first_name: customer.name.split(' ')[0],
            last_name: customer.name.split(' ').slice(1).join(' '),
            identification: {
                type: 'CPF',
                number: customer.tax_id
            }
        },
        external_reference: `REF-${Date.now()}`
    };

    if (paymentMethod === 'pix') {
        paymentData.payment_method_id = 'pix';
    } else if (paymentMethod === 'credit_card') {
        if (!token || !paymentMethodId) {
            throw new Error('Dados do cartão (token) obrigatórios para pagamento via Crédito.');
        }
        paymentData.payment_method_id = paymentMethodId;
        paymentData.token = token;
        paymentData.installments = installments || 1;
        paymentData.issuer_id = issuerId;
    }

    try {
        const response = await payment.create({ body: paymentData });
        return response;
    } catch (error: any) {
        console.error('MP Payment Error - Full Details:', JSON.stringify(error, null, 2));
        if (error.cause) {
            console.error('MP Error Causes:', JSON.stringify(error.cause, null, 2));
        }
        throw error;
    }
}

export async function getPayment(id: number | string) {
    try {
        const response = await payment.get({ id: id.toString() });
        return response;
    } catch (error: any) {
        console.error('Get Payment Error:', error);
        throw error;
    }
}
