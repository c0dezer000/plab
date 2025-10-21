import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PATCH /api/projects/binhi/[projectId] - update a Binhi project
export async function PATCH(req: Request, context: any) {
  try {
    const { projectId } = context?.params ?? {}
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const {
      actualBeneficiaries,
      areaUtilizedSqm,
      totalNoBinhiPlanted,
      totalNoBinhiHarvested,
      noBinhiSitesEstablished,
      expectedYieldPerSqmKg,
      projectedHarvestKg,
      actualHarvestKg,
      status,
      remarks,
    } = body as Record<string, any>

    const data: Record<string, any> = {}
    if (actualBeneficiaries !== undefined) data.actualBeneficiaries = Number(actualBeneficiaries)
    if (areaUtilizedSqm !== undefined) data.areaUtilizedSqm = Number(areaUtilizedSqm)
    if (totalNoBinhiPlanted !== undefined) data.totalNoBinhiPlanted = Number(totalNoBinhiPlanted)
    if (totalNoBinhiHarvested !== undefined) data.totalNoBinhiHarvested = Number(totalNoBinhiHarvested)
    if (noBinhiSitesEstablished !== undefined) data.noBinhiSitesEstablished = Number(noBinhiSitesEstablished)
    if (expectedYieldPerSqmKg !== undefined) data.expectedYieldPerSqmKg = Number(expectedYieldPerSqmKg)
    if (projectedHarvestKg !== undefined) data.projectedHarvestKg = Number(projectedHarvestKg)
    if (actualHarvestKg !== undefined) data.actualHarvestKg = Number(actualHarvestKg)
    if (status !== undefined) data.status = status
    if (remarks !== undefined) data.remarks = remarks

    const updated = await prisma.binhiProject.update({ where: { id: projectId }, data, include: { projectSite: true } })

    return NextResponse.json(updated)
  } catch (e: any) {
    console.error('Update Binhi project error', e)
    return NextResponse.json({ error: 'Failed to update binhi project' }, { status: 500 })
  }
}
