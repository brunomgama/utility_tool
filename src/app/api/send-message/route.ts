import { NextResponse } from 'next/server'
import type { ChatRequest, ChatResponse } from '@/types/chat'

export async function POST(req: Request) {
    try {
        const body: ChatRequest = await req.json()

        const apiKey = process.env.RADIEN_API_KEY

        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'API credentials are not configured' },
                { status: 500 }
            )
        }

        const res = await fetch('https://ai.radien.ninja/ollama/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
        })

        if (!res.ok) {
            const errorText = await res.text()
            return NextResponse.json(
                { success: false, error: `API error (${res.status}): ${errorText}` },
                { status: res.status }
            )
        }

        const data: ChatResponse = await res.json()
        return NextResponse.json({ success: true, data })
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ success: false, error: err.message }, { status: 500 })
        }
        return NextResponse.json({ success: false, error: 'Unknown error occurred' }, { status: 500 })
    }
}
