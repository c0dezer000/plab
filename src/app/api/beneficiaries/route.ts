import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"

const VALID_SEX = new Set(["MALE", "FEMALE"])
const VALID_PARTICIPATION_STATUS = new Set(["ACTIVE", "INACTIVE", "PENDING"])
const BOOLEAN_FIELDS = [
  "listahanPoor3",
  "nonListahanPoor3",
  "fourPsBeneficiary",
  "withMswdoCertification",
  "farmer",
  "fisherfolk",
  "informalSector",
  "women",
  "pwd",
  "elderly",
  "ips",
  "soloParent",
  "youth",
  "formerRebel",
  "lgbtqia",
] as const

type BooleanField = (typeof BOOLEAN_FIELDS)[number]

const toBoolean = (value: unknown) => value === true

export async function GET() {
  const beneficiaries = await prisma.beneficiary.findMany({
    include: {
      BeneficiarySiteEnrollment: {
        include: {
          ProjectSite: {
            select: { id: true },
          },
        },
      },
      LawaProjectBeneficiaryLink: { include: { LawaProject: { select: { id: true, projectSiteId: true } } } },
      BinhiProjectBeneficiaryLink: { include: { BinhiProject: { select: { id: true, projectSiteId: true } } } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(beneficiaries)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 })
    }

    try {
      console.debug('POST /api/beneficiaries payload', JSON.stringify(body))
    } catch {
      console.debug('POST /api/beneficiaries payload keys', Object.keys(body as Record<string, unknown>))
    }

    const {
      name,
      age,
      sex,
      payoutAmount,
      participationStatus,
      projectSiteIds = [],
      projectIds = [],
      ...rest
    } = body as Record<string, unknown>

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    if (!sex || typeof sex !== "string" || !VALID_SEX.has(sex)) {
      return NextResponse.json({ error: "sex must be MALE or FEMALE" }, { status: 400 })
    }

    const numericAge = typeof age === "number" ? age : age ? Number(age) : undefined
    if (numericAge !== undefined && (Number.isNaN(numericAge) || numericAge <= 0)) {
      return NextResponse.json({ error: "age must be a positive number" }, { status: 400 })
    }

    const numericPayout =
      payoutAmount === undefined || payoutAmount === null
        ? undefined
        : typeof payoutAmount === "number"
          ? payoutAmount
          : Number(payoutAmount)

    if (numericPayout !== undefined && Number.isNaN(numericPayout)) {
      return NextResponse.json({ error: "payoutAmount must be a valid number" }, { status: 400 })
    }

    const cleanParticipationStatus =
      typeof participationStatus === "string" && VALID_PARTICIPATION_STATUS.has(participationStatus)
        ? participationStatus
        : "ACTIVE"

    const data: Record<string, unknown> = {
      id: randomUUID(),
      name: name.trim(),
      sex,
    }

    // Birthdate strict validation (YYYY-MM-DD) with age derivation if birthdate provided; if both birthdate & age are provided, birthdate wins.
    let derivedAge: number | undefined = undefined
    if (rest.birthdate !== undefined && rest.birthdate !== null && rest.birthdate !== '') {
      if (typeof rest.birthdate !== 'string') {
        return NextResponse.json({ error: 'birthdate must be a string (YYYY-MM-DD)' }, { status: 400 })
      }
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
      if (!isoDatePattern.test(rest.birthdate)) {
        return NextResponse.json({ error: 'Invalid birthdate format (expected YYYY-MM-DD)' }, { status: 400 })
      }
      const parsed = new Date(rest.birthdate + 'T00:00:00.000Z')
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid birthdate value' }, { status: 400 })
      }
      const now = new Date()
      if (parsed > now) {
        return NextResponse.json({ error: 'Birthdate cannot be in the future' }, { status: 400 })
      }
      let ageCalc = now.getUTCFullYear() - parsed.getUTCFullYear()
      const monthDiff = now.getUTCMonth() - parsed.getUTCMonth()
      if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < parsed.getUTCDate())) {
        ageCalc -= 1
      }
      if (ageCalc < 0 || ageCalc > 130) {
        return NextResponse.json({ error: 'Derived age out of acceptable range' }, { status: 400 })
      }
      data.birthdate = parsed
      derivedAge = ageCalc
    }

    if (derivedAge !== undefined) {
      data.age = derivedAge
    } else if (numericAge !== undefined) {
      data.age = Math.round(numericAge)
    }

    if (numericPayout !== undefined) {
      data.payoutAmount = numericPayout
    }

    BOOLEAN_FIELDS.forEach((field) => {
      if (field in rest) {
        data[field] = toBoolean(rest[field])
      }
    })

    // create beneficiary first
    let created
    try {
      created = await prisma.beneficiary.create({ data: data as any })
    } catch (err) {
      console.error('Create beneficiary DB error', { data, err })
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: `Failed to create beneficiary: ${msg}` }, { status: 500 })
    }

    // Helper to normalize id arrays
    const normalizeIds = (arr: unknown) =>
      Array.isArray(arr) ? (arr as unknown[]).map((id) => (typeof id === "string" ? id.trim() : "")).filter(Boolean) : []

    const explicitProjectIds = normalizeIds(projectIds)
    const siteIdList = normalizeIds(projectSiteIds)

    // create per-project links idempotently
    for (const pid of explicitProjectIds) {
      const lawa = await prisma.lawaProject.findUnique({ where: { id: pid }, select: { id: true } })
      if (lawa) {
        const exists = await prisma.lawaProjectBeneficiaryLink.findFirst({ where: { lawaProjectId: pid, beneficiaryId: created.id } })
        if (!exists) {
          await prisma.lawaProjectBeneficiaryLink.create({
            data: {
              id: randomUUID(),
              lawaProjectId: pid,
              beneficiaryId: created.id,
              participationStatus: cleanParticipationStatus,
              dateLinked: new Date(),
              updatedAt: new Date(),
            },
          })
        }
        continue
      }

      const binhi = await prisma.binhiProject.findUnique({ where: { id: pid }, select: { id: true } })
      if (binhi) {
        const exists = await prisma.binhiProjectBeneficiaryLink.findFirst({ where: { binhiProjectId: pid, beneficiaryId: created.id } })
        if (!exists) {
          await prisma.binhiProjectBeneficiaryLink.create({
            data: {
              id: randomUUID(),
              binhiProjectId: pid,
              beneficiaryId: created.id,
              participationStatus: cleanParticipationStatus,
              dateLinked: new Date(),
              updatedAt: new Date(),
            },
          })
        }
      }
    }

    // optionally also create site enrollments if projectSiteIds were provided (keep historical data)
    if (siteIdList.length) {
      // create enrollments for any site that doesn't already have an enrollment for this beneficiary
      for (const siteId of siteIdList) {
        const exists = await prisma.beneficiarySiteEnrollment.findFirst({ where: { projectSiteId: siteId, beneficiaryId: created.id } })
        if (!exists) {
          await prisma.beneficiarySiteEnrollment.create({
            data: {
              id: randomUUID(),
              beneficiaryId: created.id,
              projectSiteId: siteId,
              status: cleanParticipationStatus,
              dateEnrolled: new Date(),
              updatedAt: new Date(),
            },
          })
        }
      }
      // For each site enrollment, attempt to enroll the beneficiary into the most recent tracker
      // for that site (if any) and set initial stage to SOCIAL_PREPS. This wires the staging
      // process immediately upon registration when a site is provided.
      try {
        for (const siteId of siteIdList) {
          const tracker = await prisma.projectTracker.findFirst({ where: { projectSiteId: siteId }, orderBy: { createdAt: 'desc' } })
          if (!tracker) continue
          const already = await prisma.projectTrackerBeneficiaryEnrollment.findFirst({ where: { projectTrackerId: tracker.id, beneficiaryId: created.id } })
          if (already) continue
          await prisma.projectTrackerBeneficiaryEnrollment.create({
            data: {
              id: randomUUID(),
              projectTrackerId: tracker.id,
              beneficiaryId: created.id,
              stage: 'SOCIAL_PREPS',
              stageStartedAt: new Date(),
              attendanceCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })
        }
      } catch (err) {
        console.error('Failed to auto-enroll beneficiary into trackers on creation', { beneficiaryId: created.id, err })
        // non-fatal: continue
      }
    }

    // return beneficiary with links and enrollments
    const returned = await prisma.beneficiary.findUnique({
      where: { id: created.id },
      include: {
        BeneficiarySiteEnrollment: { include: { ProjectSite: { select: { id: true, siteName: true } } } },
        LawaProjectBeneficiaryLink: { include: { LawaProject: { select: { id: true, projectSiteId: true, typeOfLawa: true } } } },
        BinhiProjectBeneficiaryLink: { include: { BinhiProject: { select: { id: true, projectSiteId: true } } } },
      },
    })

    if (!returned) {
      console.warn('Beneficiary created but not immediately fetchable', { id: created.id })
      return NextResponse.json(created, { status: 201 })
    }

    return NextResponse.json(returned, { status: 201 })
  } catch (error) {
    console.error("Create beneficiary unexpected error", error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Failed to create beneficiary: ${msg}` }, { status: 500 })
  }
}
