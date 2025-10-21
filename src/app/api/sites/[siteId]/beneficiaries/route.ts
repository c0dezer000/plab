import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, context: any) {
  try {
    const siteId = context?.params?.siteId
    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 })
    }

    const { searchParams } = new URL(req.url, "http://localhost")
    const projectId = searchParams.get("projectId")?.trim() || null
    const projectTypeParam = searchParams.get("projectType")?.toUpperCase() || null
    const projectType = projectTypeParam === "LAWA" || projectTypeParam === "BINHI" ? projectTypeParam : null

    const [lawaProjects, binhiProjects] = await Promise.all([
      prisma.lawaProject.findMany({ where: { projectSiteId: siteId }, select: { id: true } }),
      prisma.binhiProject.findMany({ where: { projectSiteId: siteId }, select: { id: true } }),
    ])

    const lawaProjectIds = new Set(lawaProjects.map((proj) => proj.id))
    const binhiProjectIds = new Set(binhiProjects.map((proj) => proj.id))

    const enrollments = await prisma.beneficiarySiteEnrollment.findMany({
      where: { projectSiteId: siteId },
      include: {
        Beneficiary: {
          include: {
            LawaProjectBeneficiaryLink: {
              select: { lawaProjectId: true, participationStatus: true, dateLinked: true },
            },
            BinhiProjectBeneficiaryLink: {
              select: { binhiProjectId: true, participationStatus: true, dateLinked: true },
            },
          },
        },
      },
      orderBy: { dateEnrolled: "desc" },
    })

    const payload = enrollments.map((enrollment) => {
      const beneficiary = enrollment.Beneficiary
      const lawaLinks = (beneficiary?.LawaProjectBeneficiaryLink ?? []).filter((link) =>
        link?.lawaProjectId ? lawaProjectIds.has(link.lawaProjectId) : false,
      )
      const binhiLinks = (beneficiary?.BinhiProjectBeneficiaryLink ?? []).filter((link) =>
        link?.binhiProjectId ? binhiProjectIds.has(link.binhiProjectId) : false,
      )

      const linkedToTarget = projectId && projectType
        ? projectType === "LAWA"
          ? lawaLinks.some((link) => link.lawaProjectId === projectId)
          : binhiLinks.some((link) => link.binhiProjectId === projectId)
        : false

      return {
        id: beneficiary?.id ?? enrollment.beneficiaryId,
        name: beneficiary?.name ?? null,
        age: beneficiary?.age ?? null,
        sex: beneficiary?.sex ?? null,
        enrollmentStatus: enrollment.status ?? null,
        dateEnrolled: enrollment.dateEnrolled ?? null,
        linkedProjects: {
          lawa: lawaLinks.map((link) => ({
            projectId: link.lawaProjectId,
            participationStatus: link.participationStatus,
            dateLinked: link.dateLinked,
          })),
          binhi: binhiLinks.map((link) => ({
            projectId: link.binhiProjectId,
            participationStatus: link.participationStatus,
            dateLinked: link.dateLinked,
          })),
        },
        linkedToTarget,
      }
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error("List site beneficiaries error", error)
    return NextResponse.json({ error: "Failed to list site beneficiaries" }, { status: 500 })
  }
}
