import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

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

const toBoolean = (v: unknown) => v === true

const normalizeIds = (arr: unknown) =>
  Array.isArray(arr)
    ? (arr as unknown[])
        .map((id) =>
          typeof id === 'string'
            ? id.trim()
            : typeof id === 'number'
              ? String(id)
              : '',
        )
        .filter(Boolean as any)
    : []

export async function PATCH(req: Request, context: any) {
  try {
    const beneficiaryId = context?.params?.beneficiaryId
    if (!beneficiaryId) {
      return NextResponse.json({ error: 'Missing beneficiary id' }, { status: 400 })
    }

    const existingBeneficiary = await prisma.beneficiary.findUnique({ where: { id: beneficiaryId } })
    if (!existingBeneficiary) {
      return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      console.warn('PATCH beneficiary received invalid payload', { beneficiaryId, body })
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // log incoming body shape for easier debugging (avoid throwing when body contains Dates)
    try {
      console.debug('PATCH beneficiary payload', { beneficiaryId, body: JSON.stringify(body) })
    } catch (e) {
      console.debug('PATCH beneficiary payload (partial)', { beneficiaryId, keys: Object.keys(body) })
    }

    // quick validations
    if ('projectSiteIds' in body && !Array.isArray((body as any).projectSiteIds)) {
      return NextResponse.json({ error: 'projectSiteIds must be an array' }, { status: 400 })
    }
    if ('projectIds' in body && !Array.isArray((body as any).projectIds)) {
      return NextResponse.json({ error: 'projectIds must be an array' }, { status: 400 })
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

    const normalizedParticipationStatus =
      typeof participationStatus === 'string' ? participationStatus.trim().toUpperCase() : null

  const data: Record<string, any> = {}
    if (typeof name === 'string' && name.trim()) data.name = name.trim()
    if (age !== undefined) {
      const n = typeof age === 'number' ? age : age ? Number(age) : undefined
      if (n !== undefined && !Number.isNaN(n)) data.age = Math.round(n)
    }
    const hasProjectSiteIds = Array.isArray(projectSiteIds)
    const siteIdList = hasProjectSiteIds ? normalizeIds(projectSiteIds) : []

    if (hasProjectSiteIds) {
      const existingEnrollments = await prisma.beneficiarySiteEnrollment.findMany({
        where: { beneficiaryId },
        select: { id: true, projectSiteId: true },
      })

      const existingSet = new Set(existingEnrollments.map((en) => en.projectSiteId))
      const toAdd = siteIdList.filter((id) => !existingSet.has(id))
      const toRemove = existingEnrollments.filter((en) => !siteIdList.includes(en.projectSiteId))

      for (const siteId of toAdd) {
          // ensure the project site exists before creating the enrollment to avoid FK errors
          const siteExists = await prisma.projectSite.findUnique({ where: { id: siteId }, select: { id: true } })
          if (!siteExists) {
            console.warn(`Skipping enrollment creation for unknown projectSiteId=${siteId}`)
            continue
          }
          await prisma.beneficiarySiteEnrollment.create({
            data: {
              id: randomUUID(),
              beneficiaryId,
              projectSiteId: siteId,
              status: normalizedParticipationStatus ?? undefined,
              dateEnrolled: new Date(),
              updatedAt: new Date(),
            },
          })
      }

      if (toRemove.length) {
        await prisma.beneficiarySiteEnrollment.deleteMany({
          where: { id: { in: toRemove.map((en) => en.id) } },
        })
      }

      if (normalizedParticipationStatus && siteIdList.length) {
        await prisma.beneficiarySiteEnrollment.updateMany({
          where: {
            beneficiaryId,
            projectSiteId: { in: siteIdList },
          },
          data: {
            status: normalizedParticipationStatus,
            updatedAt: new Date(),
          },
        })
      }
    }
    if (typeof sex === 'string') data.sex = sex
    // Birthdate handling: accept YYYY-MM-DD, normalise to UTC midnight to avoid TZ drift, derive age
    if ('birthdate' in rest) {
      const raw = (rest as any).birthdate
      if (raw === null || raw === undefined || raw === '') {
        // Ignore empty clears for now (we could support explicit clearing in future with a flag)
      } else if (typeof raw === 'string') {
        // Ensure format roughly matches YYYY-MM-DD to avoid accidental locale strings
        const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
        if (!isoDatePattern.test(raw)) {
          return NextResponse.json({ error: 'Invalid birthdate format (expected YYYY-MM-DD)' }, { status: 400 })
        }
        const parsed = new Date(raw + 'T00:00:00.000Z')
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ error: 'Invalid birthdate value' }, { status: 400 })
        }
        const now = new Date()
        if (parsed > now) {
          return NextResponse.json({ error: 'Birthdate cannot be in the future' }, { status: 400 })
        }
        // Derive age server-side (override any client-provided age to keep consistent)
        let derivedAge = now.getUTCFullYear() - parsed.getUTCFullYear()
        const monthDiff = now.getUTCMonth() - parsed.getUTCMonth()
        if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < parsed.getUTCDate())) {
          derivedAge -= 1
        }
        if (derivedAge < 0 || derivedAge > 130) {
          return NextResponse.json({ error: 'Derived age out of acceptable range' }, { status: 400 })
        }
        data.birthdate = parsed
        data.age = derivedAge
      } else {
        return NextResponse.json({ error: 'birthdate must be a string (YYYY-MM-DD)' }, { status: 400 })
      }
    }
    if (payoutAmount !== undefined) {
      const p = typeof payoutAmount === 'number' ? payoutAmount : payoutAmount ? Number(payoutAmount) : undefined
      if (p !== undefined && !Number.isNaN(p)) data.payoutAmount = p
    }
    BOOLEAN_FIELDS.forEach((f) => {
      if (f in rest) data[f] = toBoolean(rest[f])
    })

    let updatedId = existingBeneficiary.id
    if (Object.keys(data).length > 0) {
      try {
        const updated = await prisma.beneficiary.update({ where: { id: beneficiaryId }, data })
        updatedId = updated.id
      } catch (err) {
        console.error('Error updating beneficiary core fields', { beneficiaryId, data, err })
        const msg = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: `Failed to update beneficiary core fields: ${msg}` }, { status: 500 })
      }
    }

    // Optionally link to projects (idempotent)
    const explicitProjectIds = normalizeIds(projectIds)
    if (explicitProjectIds.length) {
      for (const pid of explicitProjectIds) {
        try {
          const lawa = await prisma.lawaProject.findUnique({ where: { id: pid }, select: { id: true } })
          if (lawa) {
            const exists = await prisma.lawaProjectBeneficiaryLink.findFirst({ where: { lawaProjectId: pid, beneficiaryId } })
            if (!exists) {
              const createPayload: any = {
                id: randomUUID(),
                lawaProjectId: String(pid),
                beneficiaryId: String(beneficiaryId),
                participationStatus: normalizedParticipationStatus ?? 'ACTIVE',
                dateLinked: new Date(),
                updatedAt: new Date(),
              }
              await prisma.lawaProjectBeneficiaryLink.create({ data: createPayload })
            }
            continue
          }
          const binhi = await prisma.binhiProject.findUnique({ where: { id: pid }, select: { id: true } })
          if (binhi) {
            const exists = await prisma.binhiProjectBeneficiaryLink.findFirst({ where: { binhiProjectId: pid, beneficiaryId } })
            if (!exists) {
              const createPayload: any = {
                id: randomUUID(),
                binhiProjectId: String(pid),
                beneficiaryId: String(beneficiaryId),
                participationStatus: normalizedParticipationStatus ?? 'ACTIVE',
                dateLinked: new Date(),
                updatedAt: new Date(),
              }
              await prisma.binhiProjectBeneficiaryLink.create({ data: createPayload })
            }
          }
        } catch (err) {
          console.error('Error linking project id to beneficiary', { beneficiaryId, pid, err })
          // continue processing other ids but capture warning
        }
      }
    }

    // Optional: create/update tracker enrollments for this beneficiary when provided in the PATCH body
    // Expect body.trackerEnrollments to be an array of { trackerId: string, stage?: TrackerStage, stageStartedAt?: string }
    if (Array.isArray((body as any).trackerEnrollments) && (body as any).trackerEnrollments.length) {
      const enrollments = (body as any).trackerEnrollments as Array<Record<string, unknown>>
      for (const en of enrollments) {
        const trackerId = typeof en.trackerId === 'string' ? en.trackerId.trim() : ''
        if (!trackerId) continue
        try {
          const trackerExists = await prisma.projectTracker.findUnique({ where: { id: trackerId }, select: { id: true } })
          if (!trackerExists) continue
          const existing = await prisma.projectTrackerBeneficiaryEnrollment.findFirst({ where: { projectTrackerId: trackerId, beneficiaryId } })
          const stage = typeof en.stage === 'string' ? (en.stage as any) : undefined
          const stageStartedAt = en.stageStartedAt ? new Date(String(en.stageStartedAt)) : undefined
          if (existing) {
            const updateData: any = {}
            if (stage) updateData.stage = stage
            if (stageStartedAt && !Number.isNaN(stageStartedAt.getTime())) updateData.stageStartedAt = stageStartedAt
            updateData.updatedAt = new Date()
            await prisma.projectTrackerBeneficiaryEnrollment.update({ where: { id: existing.id }, data: updateData })
          } else {
            await prisma.projectTrackerBeneficiaryEnrollment.create({ data: {
              id: randomUUID(),
              projectTrackerId: trackerId,
              beneficiaryId,
              stage: stage ?? 'SOCIAL_PREPS',
              stageStartedAt: stageStartedAt ?? new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            } })
          }
        } catch (err) {
          console.error('Error upserting tracker enrollment from beneficiary PATCH', { beneficiaryId, trackerId, err })
          // continue on error
        }
      }
    }

    const returned = await prisma.beneficiary.findUnique({
      where: { id: updatedId },
      include: {
        BeneficiarySiteEnrollment: { include: { ProjectSite: { select: { id: true, siteName: true } } } },
        LawaProjectBeneficiaryLink: { include: { LawaProject: { select: { id: true, projectSiteId: true } } } },
        BinhiProjectBeneficiaryLink: { include: { BinhiProject: { select: { id: true, projectSiteId: true } } } },
      },
    })

    return NextResponse.json(returned)
  } catch (error) {
    console.error('Update beneficiary error', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Failed to update beneficiary: ${msg}` }, { status: 500 })
  }
}

export async function GET(req: Request, context: any) {
  try {
    const beneficiaryId = context?.params?.beneficiaryId
    if (!beneficiaryId) {
      return NextResponse.json({ error: 'Missing beneficiary id' }, { status: 400 })
    }

    const found = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
      include: {
        BeneficiarySiteEnrollment: { include: { ProjectSite: { select: { id: true, siteName: true } } } },
        LawaProjectBeneficiaryLink: { include: { LawaProject: { select: { id: true, projectSiteId: true } } } },
        BinhiProjectBeneficiaryLink: { include: { BinhiProject: { select: { id: true, projectSiteId: true } } } },
        ProjectTrackerBeneficiaryEnrollment: {
          include: {
            ProjectTracker: { include: { projectSite: { select: { id: true, siteName: true } } } },
          },
        },
      },
    })

    if (!found) return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 })

    return NextResponse.json(found)
  } catch (err) {
    console.error('GET beneficiary by id error', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Failed to fetch beneficiary: ${msg}` }, { status: 500 })
  }
}
