import { NextResponse } from "next/server"
import { listProvinces } from "@/lib/psgc"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const regionCode = searchParams.get("regionCode") ?? undefined
    const provinces = await listProvinces(regionCode)
    return NextResponse.json(provinces)
  } catch (error) {
    console.error("Failed to load PSGC provinces", error)
    return NextResponse.json({ error: "Failed to load provinces" }, { status: 500 })
  }
}
