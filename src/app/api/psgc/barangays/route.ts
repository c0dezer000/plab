import { NextResponse } from "next/server"
import { listBarangays } from "@/lib/psgc"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const municipalityCode = searchParams.get("municipalityCode")

    if (!municipalityCode) {
      return NextResponse.json({ error: "municipalityCode query param required" }, { status: 400 })
    }

    const barangays = await listBarangays(municipalityCode)
    return NextResponse.json(barangays)
  } catch (error) {
    console.error("Failed to load PSGC barangays", error)
    return NextResponse.json({ error: "Failed to load barangays" }, { status: 500 })
  }
}
