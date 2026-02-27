import { NextResponse } from "next/server";
import { proxyFetch } from "@/app/lib/proxyfetch";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        return await proxyFetch(`/trocas`, {
            method: "GET",
            cache: "no-store",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (err) {
        console.error("api/trocas GET proxy error:", err);
        return NextResponse.json({ message: "Erro interno ao buscar trocas", detail: String(err) }, { status: 500 });
    }
}

// Handler para criar uma nova troca
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        const formData = await req.formData();

        return await proxyFetch(`/trocas`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

    } catch (err) {
        console.error("api/trocas POST proxy error:", err);
        return NextResponse.json({ message: "Erro interno ao criar troca", detail: String(err) }, { status: 500 });
    }
}
