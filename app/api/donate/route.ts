import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/pagbank';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.amount || !body.customer) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const description = body.description || 'Doação Chama Church';

        const order = await createOrder({
            amount: parseFloat(body.amount),
            description: description,
            customer: {
                name: body.customer.name,
                email: body.customer.email || 'nao-informado@chamachurch.com', // Placeholder if missing
                tax_id: body.customer.cpf,
                phone: {
                    area: body.customer.phone.substring(0, 2),
                    number: body.customer.phone.substring(2)
                }
            },
            paymentMethod: body.paymentMethod || 'pix',
            cardBody: body.card
        });

        // Save to Supabase
        const { error: dbError } = await supabase
            .from('donations')
            .insert({
                amount: parseFloat(body.amount),
                type: description, // Storing description as type/context for now
                payment_method: body.paymentMethod || 'pix',
                status: 'pending', // Initial status
                payer_name: body.customer.name,
                payer_email: body.customer.email || 'nao-informado@chamachurch.com',
                payer_cpf: body.customer.cpf,
                payer_phone: body.customer.phone,
                pagbank_order_id: order.id,
                pagbank_reference_id: order.reference_id
            });

        if (dbError) {
            console.error('Supabase Error:', dbError);
        }

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('Donation Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
