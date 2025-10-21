import type {
  BeneficiariesManagementRecord,
  BeneficiariesParticipationStatus,
  BeneficiaryProjectSiteSummary,
} from "@/types/beneficiaries"

const PARTICIPATION_STATUS_LABEL_MAP: Record<string, BeneficiariesParticipationStatus> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  INACTIVE: "Inactive",
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null

const getRecord = (value: unknown): Record<string, unknown> | null => (isRecord(value) ? value : null)

const getRecordArray = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter(isRecord)
}

const getString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const getDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === "string") {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined) return fallback
  if (typeof value === "number") return Number.isNaN(value) ? fallback : value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? fallback : parsed
  }
  if (isRecord(value)) {
    try {
      if (typeof (value as { toNumber?: () => number }).toNumber === "function") {
        const candidate = (value as { toNumber?: () => number }).toNumber?.()
        if (typeof candidate === "number" && !Number.isNaN(candidate)) {
          return candidate
        }
      }
      if (typeof (value as { valueOf?: () => unknown }).valueOf === "function") {
        const raw = (value as { valueOf?: () => unknown }).valueOf?.()
        if (typeof raw === "number" && !Number.isNaN(raw)) {
          return raw
        }
        const parsed = Number(raw)
        return Number.isNaN(parsed) ? fallback : parsed
      }
      const direct = Number(value)
      return Number.isNaN(direct) ? fallback : direct
    } catch {
      return fallback
    }
  }
  return fallback
}

const selectMostRecent = (
  items: Record<string, unknown>[],
  extractor: (item: Record<string, unknown>) => Date | null,
): Record<string, unknown> | null => {
  let latest: Record<string, unknown> | null = null
  let latestTime = -Infinity

  items.forEach((item) => {
    const date = extractor(item)
    if (!date) {
      return
    }
    const time = date.getTime()
    if (time > latestTime) {
      latest = item
      latestTime = time
    }
  })

  return latest
}

const getParticipationStatus = (
  enrollment: Record<string, unknown> | null,
  link: Record<string, unknown> | null,
  fallback: string | null,
): BeneficiariesParticipationStatus => {
  const source =
    getString(enrollment?.["status"]) ?? getString(link?.["participationStatus"]) ?? fallback ?? "ACTIVE"
  const normalized = source.trim().toUpperCase()
  return PARTICIPATION_STATUS_LABEL_MAP[normalized] ?? PARTICIPATION_STATUS_LABEL_MAP.ACTIVE
}

export const mapBeneficiaryToManagementRecord = (
  input: Record<string, unknown> | null | undefined,
): BeneficiariesManagementRecord => {
  const source: Record<string, unknown> = input ?? {}

  const enrollments = getRecordArray(source["BeneficiarySiteEnrollment"])
  const lawaLinks = getRecordArray(source["LawaProjectBeneficiaryLink"])
  const binhiLinks = getRecordArray(source["BinhiProjectBeneficiaryLink"])

  const siteSummaries = new Map<string, BeneficiaryProjectSiteSummary>()

  enrollments.forEach((entry) => {
    const projectSite = getRecord(entry["ProjectSite"]) ?? getRecord(entry["projectSite"])
    const id = getString(projectSite?.["id"]) ?? getString(entry["projectSiteId"])
    if (!id) {
      return
    }

    const siteName =
      getString(projectSite?.["siteName"]) ?? getString(projectSite?.["site_code"]) ?? id

    if (!siteSummaries.has(id)) {
      siteSummaries.set(id, {
        id,
        siteName,
      })
    }
  })

  const latestEnrollment = selectMostRecent(enrollments, (entry) => getDate(entry["dateEnrolled"]))
  const latestLink = selectMostRecent([...lawaLinks, ...binhiLinks], (entry) => {
    return getDate(entry["dateLinked"]) ?? getDate(entry["dateEnrolled"])
  })

  const rawSex = getString(source["sex"])?.toUpperCase() ?? null
  const sexLabel: "Male" | "Female" = rawSex === "MALE" ? "Male" : rawSex === "FEMALE" ? "Female" : "Female"

  const birthdateValue = getDate(source["birthdate"])
  const birthdate = birthdateValue ? birthdateValue.toISOString().split("T")[0] : null

  const age = (() => {
    const ageValue = source["age"]
    if (typeof ageValue === "number") {
      return Number.isFinite(ageValue) ? ageValue : 0
    }
    if (typeof ageValue === "string") {
      const parsed = Number(ageValue)
      return Number.isNaN(parsed) ? 0 : parsed
    }
    return 0
  })()

  const participationStatus = getParticipationStatus(
    latestEnrollment,
    latestLink,
    getString(source["participationStatus"]),
  )

  const dateLinkedValue = getDate(latestEnrollment?.["dateEnrolled"]) ?? getDate(latestLink?.["dateLinked"])

  return {
    id: getString(source["id"]) ?? "",
    name: getString(source["name"]) ?? "",
    age,
    birthdate,
    sex: sexLabel,
    listahanPoor3: Boolean(source["listahanPoor3"]),
    nonListahanPoor3: Boolean(source["nonListahanPoor3"]),
    fourPsBeneficiary: Boolean(source["fourPsBeneficiary"]),
    withMswdoCertification: Boolean(source["withMswdoCertification"]),
    farmer: Boolean(source["farmer"]),
    fisherfolk: Boolean(source["fisherfolk"]),
    informalSector: Boolean(source["informalSector"]),
    women: Boolean(source["women"]),
    pwd: Boolean(source["pwd"]),
    elderly: Boolean(source["elderly"]),
    ips: Boolean(source["ips"]),
    soloParent: Boolean(source["soloParent"]),
    youth: Boolean(source["youth"]),
    formerRebel: Boolean(source["formerRebel"]),
    lgbtqia: Boolean(source["lgbtqia"]),
    payoutAmount: toNumber(source["payoutAmount"], 0),
    participationStatus,
    projectSites: Array.from(siteSummaries.values()),
    dateLinked: dateLinkedValue ? dateLinkedValue.toISOString() : null,
  }
}

export const mapBeneficiariesToManagementRecords = (
  list: unknown,
): BeneficiariesManagementRecord[] => {
  if (!Array.isArray(list)) {
    return []
  }

  return list.map((item) => mapBeneficiaryToManagementRecord(getRecord(item)))
}
