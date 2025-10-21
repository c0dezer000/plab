import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/projects/lawa - list Lawa projects
export async function GET(req: Request) {
  try {
    const projects = await prisma.lawaProject.findMany({ include: { projectSite: true } })
    console.info(`/api/projects/lawa: returning ${projects.length} projects`)
    return NextResponse.json(projects)
  } catch (e: any) {
    console.error('List Lawa projects error', e)
    return NextResponse.json({ error: 'Failed to list lawa projects' }, { status: 500 })
  }
}

// POST /api/projects/lawa - create a Lawa project
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const {
      projectSiteId,
      typeOfLawa,
      noOfLawa,
      lengthM,
      widthM,
      depthM,
      physicalTarget,
      projectedHarvest,
      status,
      remarks,
    } = body

    if (!projectSiteId) {
      return NextResponse.json({ error: "projectSiteId required" }, { status: 400 })
    }

    const created = await prisma.lawaProject.create({
      data: {
        id: `LAWA-${Math.random().toString(16).slice(2,8).toUpperCase()}`,
        projectSiteId,
        typeOfLawa,
        noOfLawa: noOfLawa ? Number(noOfLawa) : undefined,
        lengthM: lengthM ? Number(lengthM) : undefined,
        widthM: widthM ? Number(widthM) : undefined,
        depthM: depthM ? Number(depthM) : undefined,
        physicalTarget: physicalTarget ? Number(physicalTarget) : undefined,
        projectedHarvest: projectedHarvest ? Number(projectedHarvest) : undefined,
        status: status || "Planning",
        remarks,
      },
      include: { projectSite: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    console.error("Create LawaProject error", e)
    return NextResponse.json({ error: "Failed to create lawa project" }, { status: 500 })
  }
}
