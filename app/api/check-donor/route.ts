import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { cpf } = await request.json();

        if (!cpf) {
            return NextResponse.json({ error: 'CPF is required' }, { status: 400 });
        }

        // Clean CPF just in case
        const cleanCpf = cpf.replace(/\D/g, '');

        // Fetch the most recent donation from this CPF
        const { data, error } = await supabase
            .from('donations')
            .select('payer_name, payer_email, payer_phone')
            .eq('payer_cpf', cleanCpf)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // PGRST116 means no rows found, which is fine, just return found: false
            if (error.code === 'PGRST116') {
                return NextResponse.json({ found: false });
            }
            throw error;
        }

        if (data) {
            // Filter out legacy PagBank sandbox emails
            const email = data.payer_email === 'comprador@sandbox.pagseguro.com.br' ? '' : data.payer_email;

            return NextResponse.json({
                found: true,
                donor: {
                    name: data.payer_name,
                    email: email,
                    phone: data.payer_phone
                }
            });
        }

        return NextResponse.json({ found: false });

    } catch (error: any) {
        console.error('Check Donor Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
