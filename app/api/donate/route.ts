import { NextResponse } from 'next/server';
import { createMPPayment } from '@/lib/mercadopago';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.amount || !body.customer) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

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
