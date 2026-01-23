import { NextResponse } from 'next/server';
import { createMPPayment } from '@/lib/mercadopago';
import { supabase } from '@/lib/supabase';

// CPF Validation Function with Checksum
function validateCPF(cpf: string): boolean {
    // Remove non-numeric characters
    cpf = cpf.replace(/[^\d]/g, '');

    // Check length
    if (cpf.length !== 11) return false;

    // Check for known invalid CPFs (all same digits)
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
}

// Email Validation Function
function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone Validation Function
function validatePhone(phone: string): boolean {
    const phoneDigits = phone.replace(/[^\d]/g, '');
    return phoneDigits.length >= 10 && phoneDigits.length <= 11;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // ===== COMPREHENSIVE INPUT VALIDATION =====

        // Validate required top-level fields
        const requiredFields = ['amount', 'customer', 'churchLocation', 'paymentMethod'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Campo obrigatório ausente: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Validate customer object exists
        if (!body.customer || typeof body.customer !== 'object') {
            return NextResponse.json(
                { error: 'Dados do cliente são obrigatórios' },
                { status: 400 }
            );
        }

        // Validate required customer fields
        const requiredCustomerFields = ['name', 'email', 'cpf', 'phone'];
        for (const field of requiredCustomerFields) {
            if (!body.customer[field]) {
                return NextResponse.json(
                    { error: `Campo obrigatório ausente: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Validate amount
        const amount = parseFloat(body.amount);
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json(
                { error: 'Valor da doação deve ser maior que zero' },
                { status: 400 }
            );
        }

        // Validate CPF format and checksum
        if (!validateCPF(body.customer.cpf)) {
            return NextResponse.json(
                { error: 'CPF inválido. Por favor, verifique o número digitado.' },
                { status: 400 }
            );
        }

        // Validate email format
        if (!validateEmail(body.customer.email)) {
            return NextResponse.json(
                { error: 'Email inválido. Por favor, verifique o endereço digitado.' },
                { status: 400 }
            );
        }

        // Validate phone format
        if (!validatePhone(body.customer.phone)) {
            return NextResponse.json(
                { error: 'Telefone inválido. Deve conter 10 ou 11 dígitos.' },
                { status: 400 }
            );
        }

        // Validate payment method
        const validPaymentMethods = ['pix', 'credit_card', 'pis'];
        if (!validPaymentMethods.includes(body.paymentMethod)) {
            return NextResponse.json(
                { error: 'Método de pagamento inválido' },
                { status: 400 }
            );
        }

        // Validate credit card specific fields
        if (body.paymentMethod === 'credit_card') {
            if (!body.token || !body.paymentMethodId) {
                return NextResponse.json(
                    { error: 'Dados do cartão são obrigatórios para pagamento via crédito' },
                    { status: 400 }
                );
            }
        }

        // ===== END VALIDATION =====

        const description = body.description || 'Doação Chama Church';

        const accessToken = process.env.MP_ACCESS_TOKEN || '';
        console.log('Environment Debug:');
        console.log('Access Token Prefix:', accessToken.substring(0, 8));
        console.log('Public Key Prefix:', process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.substring(0, 8));

        // Safety Check for mismatch
        if (body.token && body.token.startsWith('tst') && !accessToken.startsWith('TEST')) {
            console.warn("WARNING: Using Test Card Token with Production Access Token!");
        }

        console.log('Processing Donation via Mercado Pago:', description, body.amount);

        const mpRes = await createMPPayment({
            amount: parseFloat(body.amount),
            description: description,
            customer: {
                name: body.customer.name,
                email: body.customer.email || 'nao-informado@chamachurch.com',
                tax_id: body.customer.cpf,
                phone: {
                    area: body.customer.phone.substring(0, 2),
                    number: body.customer.phone.substring(2)
                }
            },
            paymentMethod: body.paymentMethod || 'pix',
            token: body.token, // Token from frontend
            paymentMethodId: body.paymentMethodId, // 'visa', 'master', etc
            installments: body.installments,
            issuerId: body.issuerId
        });

        // Determine status
        let status = 'pending';
        // MP statuses: approved, in_process, rejected, cancelled, pending...
        if (mpRes.status === 'approved') status = 'paid';
        else if (mpRes.status === 'rejected') {
            status = 'declined';
            console.log('REJECTED PAYMENT DEBUG:', JSON.stringify(mpRes, null, 2));
        }
        else if (mpRes.status === 'cancelled') status = 'canceled';
        else if (mpRes.status === 'in_process') status = 'pending';

        // Save to Supabase
        const { error: dbError } = await supabase
            .from('donations')
            .insert({
                amount: parseFloat(body.amount),
                type: description,
                church_location: body.churchLocation,
                payment_method: body.paymentMethod || 'pix',
                status: status,
                payer_name: body.customer.name,
                payer_email: body.customer.email || 'nao-informado@chamachurch.com',
                payer_cpf: body.customer.cpf,
                payer_phone: body.customer.phone,
                pagbank_order_id: mpRes.id?.toString(), // Saving MP ID in existing column
                pagbank_reference_id: mpRes.external_reference,
                created_at: new Date().toISOString()
            });

        if (dbError) {
            console.error('Supabase Error:', dbError);
        }

        // Format response to match what frontend expects (PagBank-like structure for Pix)
        let responsePayload: any = {
            id: mpRes.id,
            status: mpRes.status,
            detail: mpRes.status_detail
        };

        if ((body.paymentMethod === 'pix' || body.paymentMethod === 'pis') && mpRes.point_of_interaction?.transaction_data) {
            const transactionData = mpRes.point_of_interaction.transaction_data;
            responsePayload.qr_codes = [{
                links: [{
                    rel: 'QRCODE.PNG',
                    href: `data:image/png;base64,${transactionData.qr_code_base64}`
                }],
                text: transactionData.qr_code
            }];
        }

        return NextResponse.json(responsePayload);
    } catch (error: any) {
        console.error('Donation Error:', error);
        // Log deep error data if available from MP
        if (error.cause) console.error('MP Cause:', JSON.stringify(error.cause, null, 2));

        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
