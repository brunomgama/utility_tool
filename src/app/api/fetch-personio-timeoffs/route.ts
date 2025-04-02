import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!startDate || !endDate) {
        return NextResponse.json({
            success: false,
            error: 'Missing required query parameters: start_date and end_date',
        })
    }

    const url = `https://api.personio.de/v1/company/time-offs?start_date=${startDate}&end_date=${endDate}`

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
        return NextResponse.json({ success: false, error: 'Unknown error occurred' })
    }
}
