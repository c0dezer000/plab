import { NextResponse } from "next/server"
import { listMunicipalities } from "@/lib/psgc"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
  const provinceCode = searchParams.get("provinceCode") ?? undefined
  const regionCode = searchParams.get("regionCode") ?? undefined
  const municipalities = await listMunicipalities(provinceCode, regionCode)
    return NextResponse.json(municipalities)
  } catch (error) {
    console.error("Failed to load PSGC municipalities", error)
    return NextResponse.json({ error: "Failed to load municipalities" }, { status: 500 })
  }
}
