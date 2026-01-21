import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const id = params.id;

    try {
        // Buscar o caminho do arquivo pelo ID curto
        const { data, error } = await supabase
            .from('receipts_log')
            .select('storage_path')
            .eq('short_id', id)
            .single();

        if (error || !data) {
            return new NextResponse('Comprovante não encontrado', { status: 404 });
        }

        // Gerar URL pública do Storage
        const { data: publicData } = supabase
            .storage
            .from('receipts')
            .getPublicUrl(data.storage_path);

        // Redirecionar para o PDF real
        return NextResponse.redirect(publicData.publicUrl);
    } catch (err) {
        return new NextResponse('Erro interno', { status: 500 });
    }
}
