import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PATCH /api/projects/lawa/[projectId] - update a Lawa project
export async function PATCH(req: Request, context: any) {
  try {
    const { projectId } = context?.params ?? {}
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const {
      typeOfLawa,
      noOfLawa,
      lengthM,
      widthM,
      depthM,
      physicalTarget,
      actualTarget,
      projectedHarvest,
      actualHarvest,
      status,
      remarks,
    } = body as Record<string, any>

    const data: Record<string, any> = {}
    if (typeOfLawa !== undefined) data.typeOfLawa = typeOfLawa
    if (noOfLawa !== undefined) data.noOfLawa = Number(noOfLawa)
    if (lengthM !== undefined) data.lengthM = Number(lengthM)
    if (widthM !== undefined) data.widthM = Number(widthM)
    if (depthM !== undefined) data.depthM = Number(depthM)
    if (physicalTarget !== undefined) data.physicalTarget = Number(physicalTarget)
    if (actualTarget !== undefined) data.actualTarget = Number(actualTarget)
    if (projectedHarvest !== undefined) data.projectedHarvest = Number(projectedHarvest)
    if (actualHarvest !== undefined) data.actualHarvest = Number(actualHarvest)
    if (status !== undefined) data.status = status
    if (remarks !== undefined) data.remarks = remarks

    const updated = await prisma.lawaProject.update({ where: { id: projectId }, data, include: { projectSite: true } })

    return NextResponse.json(updated)
  } catch (e: any) {
    console.error('Update Lawa project error', e)
    return NextResponse.json({ error: 'Failed to update lawa project' }, { status: 500 })
  }
}
