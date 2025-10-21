import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/sites - list sites with aggregated projects
export async function GET() {
  const sites = await prisma.projectSite.findMany({
    orderBy: { siteName: "asc" },
    include: { binhiProjects: true, lawaProjects: true },
  })
  return NextResponse.json(sites)
}

// POST /api/sites - create a new project site
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { siteName, regionCode, provinceCode, cityMunicipalityCode, barangayCode, siteType, dateEstablished, remarks } = body
  if (!siteName) return NextResponse.json({ error: "siteName required" }, { status: 400 })
  const site = await prisma.projectSite.create({
    data: {
      id: crypto.randomUUID(),
      siteName,
      regionCode,
      provinceCode,
      cityMunicipalityCode,
      barangayCode,
      siteType,
      dateEstablished: dateEstablished ? new Date(dateEstablished) : undefined,
      remarks,
    },
  })
  return NextResponse.json(site, { status: 201 })
}
