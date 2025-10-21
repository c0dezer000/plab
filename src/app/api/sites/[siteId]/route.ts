import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(_req: Request, context: any) {
  const siteId = context?.params?.siteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const site = await prisma.projectSite.findUnique({ where: { id: siteId } })
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  // collect related ids
  const lawa = await prisma.lawaProject.findMany({ where: { projectSiteId: siteId }, select: { id: true } })
  const binhi = await prisma.binhiProject.findMany({ where: { projectSiteId: siteId }, select: { id: true } })
  const trackers = await prisma.projectTracker.findMany({ where: { projectSiteId: siteId }, select: { id: true } })

  const lawaIds = lawa.map((r) => r.id)
  const binhiIds = binhi.map((r) => r.id)
  const trackerIds = trackers.map((r) => r.id)

  const actions: any[] = []

  if (lawaIds.length) {
    actions.push(prisma.lawaProjectBeneficiaryLink.deleteMany({ where: { lawaProjectId: { in: lawaIds } } }))
  }
  if (binhiIds.length) {
    actions.push(prisma.binhiProjectBeneficiaryLink.deleteMany({ where: { binhiProjectId: { in: binhiIds } } }))
  }
  if (trackerIds.length) {
    actions.push(prisma.projectTrackerBeneficiaryEnrollment.deleteMany({ where: { projectTrackerId: { in: trackerIds } } }))
  }

  // remove project-level records
  actions.push(prisma.lawaProject.deleteMany({ where: { projectSiteId: siteId } }))
  actions.push(prisma.binhiProject.deleteMany({ where: { projectSiteId: siteId } }))
  actions.push(prisma.projectTracker.deleteMany({ where: { projectSiteId: siteId } }))

  // remove site enrollments
  actions.push(prisma.beneficiarySiteEnrollment.deleteMany({ where: { projectSiteId: siteId } }))

  // finally remove the site
  actions.push(prisma.projectSite.delete({ where: { id: siteId } }))

  try {
    await prisma.$transaction(actions)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Failed deleting site', e)
    return NextResponse.json({ error: e?.message || 'Failed to delete site' }, { status: 500 })
  }
}
