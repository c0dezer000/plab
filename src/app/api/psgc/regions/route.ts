import { NextResponse } from "next/server"
import { listRegions } from "@/lib/psgc"

export async function GET() {
  try {
    const regions = await listRegions()
    return NextResponse.json(regions)
  } catch (error) {
    console.error("Failed to load PSGC regions", error)
    return NextResponse.json({ error: "Failed to load regions" }, { status: 500 })
  }
}
