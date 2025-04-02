import { NextResponse } from 'next/server'

export async function GET() {
    const url = 'https://api.personio.de/v1/company/time-offs?start_date=2025-04-01&end_date=2025-04-30'

    try {
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${process.env.PERSONIO_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        })

        if (!res.ok) {
            const error = await res.text()
            return NextResponse.json({ success: false, error })
        }

        const data = await res.json()
        return NextResponse.json({ success: true, data: data.data })
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ success: false, error: err.message })
        }
        return NextResponse.json({ success: false, error: "Unknown error occurred" })
    }
}
