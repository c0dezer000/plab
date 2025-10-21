import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/projects/binhi - list Binhi projects
export async function GET(req: Request) {
  try {
    const projects = await prisma.binhiProject.findMany({ include: { projectSite: true } })
    console.info(`/api/projects/binhi: returning ${projects.length} projects`)
    return NextResponse.json(projects)
  } catch (e: any) {
    console.error('List Binhi projects error', e)
    return NextResponse.json({ error: 'Failed to list binhi projects' }, { status: 500 })
  }
}

// POST /api/projects/binhi - create a Binhi project
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const {
      projectSiteId,
      actualBeneficiaries,
      areaUtilizedSqm,
      totalNoBinhiPlanted,
      noBinhiSitesEstablished,
      expectedYieldPerSqmKg,
      projectedHarvestKg,
      status,
      remarks,
    } = body

    if (!projectSiteId) {
      return NextResponse.json({ error: "projectSiteId required" }, { status: 400 })
    }

    const created = await prisma.binhiProject.create({
      data: {
        id: `BINHI-${Math.random().toString(16).slice(2,8).toUpperCase()}`,
        projectSiteId,
        actualBeneficiaries: actualBeneficiaries ? Number(actualBeneficiaries) : undefined,
        areaUtilizedSqm: areaUtilizedSqm ? Number(areaUtilizedSqm) : undefined,
        totalNoBinhiPlanted: totalNoBinhiPlanted ? Number(totalNoBinhiPlanted) : undefined,
        noBinhiSitesEstablished: noBinhiSitesEstablished ? Number(noBinhiSitesEstablished) : undefined,
        expectedYieldPerSqmKg: expectedYieldPerSqmKg ? Number(expectedYieldPerSqmKg) : undefined,
        projectedHarvestKg: projectedHarvestKg ? Number(projectedHarvestKg) : undefined,
        status: status || "Planning",
        remarks,
      },
      include: { projectSite: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    console.error("Create BinhiProject error", e)
    return NextResponse.json({ error: "Failed to create binhi project" }, { status: 500 })
  }
}
