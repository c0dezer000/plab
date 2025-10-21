import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"

// GET /api/projects/binhi/[projectId]/beneficiaries - list beneficiaries linked to a Binhi project
export async function GET(req: Request, context: any) {
  try {
    const { projectId } = context?.params ?? {}

    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 })

    const links = await prisma.binhiProjectBeneficiaryLink.findMany({
      where: { binhiProjectId: projectId },
      include: { Beneficiary: true },
      orderBy: { dateLinked: 'desc' },
    })

    const beneficiaries = links.map((l) => ({
      id: l.Beneficiary?.id ?? l.beneficiaryId,
      name: l.Beneficiary?.name ?? null,
      age: l.Beneficiary?.age ?? null,
      sex: l.Beneficiary?.sex ?? null,
      dateLinked: l.dateLinked,
      participationStatus: l.participationStatus,
    }))

    return NextResponse.json(beneficiaries)
  } catch (e: any) {
    console.error('List Binhi project beneficiaries error', e)
    return NextResponse.json({ error: 'Failed to list beneficiaries' }, { status: 500 })
  }
}

// POST /api/projects/binhi/[projectId]/beneficiaries - link an existing beneficiary to a Binhi project
export async function POST(req: Request, context: any) {
  try {
    const { projectId } = context?.params ?? {}
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const beneficiaryId = body?.beneficiaryId
    const participationStatus = body?.participationStatus ?? null
    const dateLinked = body?.dateLinked ? new Date(body.dateLinked) : new Date()

    if (!beneficiaryId) return NextResponse.json({ error: 'beneficiaryId required' }, { status: 400 })

    // ensure beneficiary exists
    const beneficiary = await prisma.beneficiary.findUnique({ where: { id: beneficiaryId } })
    if (!beneficiary) return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 })

    // idempotent: if link exists, return it
    const exists = await prisma.binhiProjectBeneficiaryLink.findFirst({ where: { binhiProjectId: projectId, beneficiaryId } })
    if (exists) return NextResponse.json({ message: 'Already linked', link: exists })

    const created = await prisma.binhiProjectBeneficiaryLink.create({
      data: {
        id: randomUUID(),
        binhiProjectId: projectId,
        beneficiaryId,
        participationStatus: participationStatus ?? undefined,
        dateLinked,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(created)
  } catch (e: any) {
    console.error('Link Binhi project beneficiary error', e)
    return NextResponse.json({ error: 'Failed to link beneficiary' }, { status: 500 })
  }
}
