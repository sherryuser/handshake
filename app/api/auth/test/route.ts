import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    message: 'Steam auth test endpoint working',
    steamApiKey: process.env.STEAM_API_KEY ? 'Present' : 'Missing',
    timestamp: new Date().toISOString()
  })
}
