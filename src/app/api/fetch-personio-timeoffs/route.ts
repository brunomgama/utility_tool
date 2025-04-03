import { NextResponse } from 'next/server'

let cachedToken: string | null = null
let tokenExpiry: number | null = null

async function getValidPersonioToken(): Promise<string> {
    const now = Date.now()

    if (cachedToken && tokenExpiry && now < tokenExpiry) {
        return cachedToken
    }

    const authUrl = `https://api.personio.de/v1/auth?client_id=${process.env.PERSONIO_CLIENT_ID}&client_secret=${process.env.PERSONIO_CLIENT_SECRET}`

    const res = await fetch(authUrl, { method: 'POST' })

    if (!res.ok) {
        throw new Error(`Failed to get new token: ${await res.text()}`)
    }

    const data = await res.json()

    cachedToken = data?.data?.token
    tokenExpiry = now + data?.data?.expires_in * 1000

    return cachedToken!
}

async function fetchPersonioTimeOffs(startDate: string, endDate: string, token: string): Promise<Response> {
    const url = `https://api.personio.de/v1/company/time-offs?start_date=${startDate}&end_date=${endDate}`
    return fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })
}

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

    try {
        let token = await getValidPersonioToken()
        let res = await fetchPersonioTimeOffs(startDate, endDate, token)

        if (res.status === 401) {
            cachedToken = null
            tokenExpiry = null

            token = await getValidPersonioToken()
            res = await fetchPersonioTimeOffs(startDate, endDate, token)
        }

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
