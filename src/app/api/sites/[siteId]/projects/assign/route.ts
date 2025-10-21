import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"

const VALID_PROJECT_TYPES = new Set(["LAWA", "BINHI"])
const VALID_PARTICIPATION_STATUS = new Set(["ACTIVE", "INACTIVE", "PENDING"])

type AssignPayload = {
  projectId?: string
  projectType?: string
  beneficiaryIds?: unknown
  dateLinked?: string
  participationStatus?: string
}

interface RouteContext {
  params: {
    siteId?: string
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const siteId = params?.siteId
    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 })
    }

    const rawBody = (await req.json().catch(() => null)) as AssignPayload | null
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const {
      projectId: projectIdRaw,
      projectType: projectTypeRaw,
      beneficiaryIds: beneficiaryIdsRaw,
      dateLinked: dateLinkedRaw,
      participationStatus: participationStatusRaw,
    } = rawBody

    const projectId = typeof projectIdRaw === "string" ? projectIdRaw.trim() : ""
    const projectType = typeof projectTypeRaw === "string" ? projectTypeRaw.toUpperCase().trim() : ""
    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 })
    }
    if (!VALID_PROJECT_TYPES.has(projectType)) {
      return NextResponse.json({ error: "projectType must be LAWA or BINHI" }, { status: 400 })
    }

    const beneficiaryIds = Array.isArray(beneficiaryIdsRaw)
      ? Array.from(new Set(
          (beneficiaryIdsRaw as unknown[])
            .map((id) => (typeof id === "string" ? id.trim() : ""))
            .filter((id): id is string => Boolean(id)),
        ))
      : []
    if (!beneficiaryIds.length) {
      return NextResponse.json({ error: "beneficiaryIds must be a non-empty array" }, { status: 400 })
    }

    const dateLinked = dateLinkedRaw ? new Date(dateLinkedRaw) : new Date()
    if (Number.isNaN(dateLinked.getTime())) {
      return NextResponse.json({ error: "dateLinked must be a valid date" }, { status: 400 })
    }

    const participationStatusUpper = typeof participationStatusRaw === "string" ? participationStatusRaw.toUpperCase().trim() : null
    const participationStatus = participationStatusUpper && VALID_PARTICIPATION_STATUS.has(participationStatusUpper)
      ? participationStatusUpper
      : undefined

    if (projectType === "LAWA") {
      const project = await prisma.lawaProject.findUnique({ where: { id: projectId }, select: { id: true, projectSiteId: true } })
      if (!project || project.projectSiteId !== siteId) {
        return NextResponse.json({ error: "Lawa project not found for this site" }, { status: 404 })
      }
    } else {
      const project = await prisma.binhiProject.findUnique({ where: { id: projectId }, select: { id: true, projectSiteId: true } })
      if (!project || project.projectSiteId !== siteId) {
        return NextResponse.json({ error: "Binhi project not found for this site" }, { status: 404 })
      }
    }

    let created = 0
    let skipped = 0
    const missingEnrollment: string[] = []

    for (const beneficiaryId of beneficiaryIds) {
      const enrollment = await prisma.beneficiarySiteEnrollment.findFirst({
        where: { beneficiaryId, projectSiteId: siteId },
        select: { id: true, status: true },
      })

      if (!enrollment) {
        missingEnrollment.push(beneficiaryId)
        continue
      }

      if (projectType === "LAWA") {
        const exists = await prisma.lawaProjectBeneficiaryLink.findFirst({ where: { lawaProjectId: projectId, beneficiaryId } })
        if (exists) {
          skipped += 1
          continue
        }

        await prisma.lawaProjectBeneficiaryLink.create({
          data: {
            id: randomUUID(),
            lawaProjectId: projectId,
            beneficiaryId,
            participationStatus: participationStatus ?? enrollment.status ?? "ACTIVE",
            dateLinked,
            updatedAt: new Date(),
          },
        })
        created += 1
      } else {
        const exists = await prisma.binhiProjectBeneficiaryLink.findFirst({ where: { binhiProjectId: projectId, beneficiaryId } })
        if (exists) {
          skipped += 1
          continue
        }

        await prisma.binhiProjectBeneficiaryLink.create({
          data: {
            id: randomUUID(),
            binhiProjectId: projectId,
            beneficiaryId,
            participationStatus: participationStatus ?? enrollment.status ?? "ACTIVE",
            dateLinked,
            updatedAt: new Date(),
          },
        })
        created += 1
      }
    }

    // After creating links, update the project's stored beneficiary count so
    // UI can read a simple field (actualTarget / actualBeneficiaries) to show progress.
    let linkedCount: number | null = null
    try {
      if (projectType === "LAWA") {
        linkedCount = await prisma.lawaProjectBeneficiaryLink.count({ where: { lawaProjectId: projectId } })
        // store the count in the project's actualTarget field
        await prisma.lawaProject.update({ where: { id: projectId }, data: { actualTarget: linkedCount } })
      } else {
        linkedCount = await prisma.binhiProjectBeneficiaryLink.count({ where: { binhiProjectId: projectId } })
        // store the count in the project's actualBeneficiaries field
        await prisma.binhiProject.update({ where: { id: projectId }, data: { actualBeneficiaries: linkedCount } })
      }
    } catch (e: any) {
      console.error('Failed to update project linked count', e)
      // non-fatal: continue and return response without linkedCount
      linkedCount = null
    }

    return NextResponse.json({
      siteId,
      projectId,
      projectType,
      created,
      skipped,
      missingEnrollment,
      totalRequested: beneficiaryIds.length,
      linkedCount,
    })
  } catch (error) {
    console.error("Assign project participants error", error)
    return NextResponse.json({ error: "Failed to assign beneficiaries to project" }, { status: 500 })
  }
}
