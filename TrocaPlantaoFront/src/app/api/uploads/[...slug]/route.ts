import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL;

if (!BACKEND_URL) {
    throw new Error('A variável de ambiente BACKEND_INTERNAL_URL não está definida.');
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string[] }> }
) {
    console.log(`[IMAGE_PROXY] Requisição recebida para: ${request.url}`);
    console.log(`[IMAGE_PROXY] BACKEND_URL: ${BACKEND_URL}`);

    // Aguarda a resolução dos parâmetros
    const { slug } = await params;

    if (!slug || slug.length === 0) {
        console.error('[IMAGE_PROXY] Nenhum slug fornecido.');
        return NextResponse.json(
            { message: 'Nome do arquivo não fornecido.' },
            { status: 404 }
        );
    }

    const imagePath = slug.join('/');
    const baseUrl = BACKEND_URL?.replace(/\/api$/, '');
    const imageUrl = `${baseUrl}/uploads/${imagePath}`;

    console.log(`[IMAGE_PROXY] Buscando imagem em: ${imageUrl}`);

    try {
        const backendRes = await fetch(imageUrl);

        if (!backendRes.ok) {
            console.error(`[IMAGE_PROXY] Erro do backend: ${backendRes.status} ${backendRes.statusText}`);
            return new NextResponse(backendRes.body, {
                status: backendRes.status,
                statusText: backendRes.statusText,
            });
        }

        const responseHeaders = new Headers(backendRes.headers);
        responseHeaders.delete('transfer-encoding');
        responseHeaders.delete('connection');

        return new NextResponse(backendRes.body, {
            status: 200,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error(`[IMAGE_PROXY] Erro ao buscar ${imageUrl}:`, error);
        return NextResponse.json(
            { message: 'Erro ao buscar a imagem do serviço de backend.' },
            { status: 502 }
        );
    }
}