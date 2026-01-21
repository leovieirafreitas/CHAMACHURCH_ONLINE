import { NextResponse } from 'next/server';
import { getPayment } from '@/lib/mercadopago';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
        }

        const payment = await getPayment(id);

        // Map status
        let status = 'pending';
        if (payment.status === 'approved') status = 'paid';
        else if (payment.status === 'rejected') status = 'declined';
        else if (payment.status === 'cancelled') status = 'canceled';
        else if (payment.status === 'in_process') status = 'pending';

        // Update in Supabase if status changed to paid
        // We can do an optimistic update here to ensure DB is consistent
        if (status === 'paid') {
            await supabase
                .from('donations')
                .update({ status: 'paid' })
                .eq('pagbank_order_id', id.toString());
        }

        return NextResponse.json({
            id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail
        });

    } catch (error: any) {
        console.error('Check Status Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
