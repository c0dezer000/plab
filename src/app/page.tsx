import { prisma } from "@/lib/prisma"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import {
  ProjectsManagementBinhiProject,
  ProjectsManagementLawaProject,
} from "@/components/projects-management"
import { BeneficiariesManagementRecord } from "@/components/beneficiaries-management"
import { ProjectTrackerRecord } from "@/components/project-tracking"

const projectStatusLabels: Record<string, "Planning" | "In Progress" | "Completed" | "On Hold"> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
}

const siteStatusLabels: Record<string, "Active" | "Planning" | "Completed"> = {
  ACTIVE: "Active",
  PLANNING: "Planning",
  COMPLETED: "Completed",
}

const trackerStatusLabels: Record<string, "On Track" | "Behind Schedule" | "At Risk" | "Completed"> = {
  ON_TRACK: "On Track",
  BEHIND_SCHEDULE: "Behind Schedule",
  AT_RISK: "At Risk",
  COMPLETED: "Completed",
}

const participationStatusLabels: Record<string, "Active" | "Inactive" | "Pending"> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING: "Pending",
}

const sexLabels: Record<string, "Male" | "Female"> = {
  MALE: "Male",
  FEMALE: "Female",
}

function toISOStringOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) {
    return "just now"
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  }

  return date.toLocaleDateString()
}

// Convert Prisma Decimal (and other possible numeric representations) to plain numbers
function decimalToNumber(value: any, fallback = 0): number {
  if (value === null || value === undefined) return fallback
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value) || fallback
  // Prisma Decimal has toNumber() in recent versions
  if (typeof value === "object") {
    try {
      if (typeof (value as any).toNumber === "function") return (value as any).toNumber()
      if (typeof (value as any).toFixed === "function") return Number((value as any).toFixed())
      return Number(value) || fallback
    } catch (e) {
      return fallback
    }
  }
  return fallback
}

export default async function DashboardPage() {
  // projectSites removed: we no longer fetch site-only lists for the UI
  let lawaProjectsRaw: any[] = []
  let binhiProjectsRaw: any[] = []
  let trackersRaw: any[] = []
  let beneficiariesRaw: any[] = []

  try {
    ;[lawaProjectsRaw, binhiProjectsRaw, trackersRaw, beneficiariesRaw] = await Promise.all([
      // skip fetching projectSite list (Sites tab removed)
      prisma.lawaProject.findMany({
        include: {
          projectSite: {
            select: {
              siteName: true,
            },
          },
        },
        orderBy: { id: "asc" },
      }),
      prisma.binhiProject.findMany({
        include: {
          projectSite: {
            select: {
              siteName: true,
            },
          },
        },
        orderBy: { id: "asc" },
      }),
      prisma.projectTracker.findMany({
        include: {
          projectSite: {
            select: {
              siteName: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.beneficiary.findMany({
        include: {
          // Use the enrollment relation defined on the schema
          BeneficiarySiteEnrollment: {
            include: {
              ProjectSite: {
                select: { id: true },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ])
  } catch (error) {
    // If Prisma can't connect, show a helpful server-side message instead of crashing.
    console.error("Prisma fetch error in DashboardPage:", error)

    return (
      <div className="min-h-screen bg-background flex items-start py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Database connection error</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The application couldn't reach the database. The dashboard will load once Prisma can connect to your
              database.
            </p>
            <div className="mt-4 text-sm">
              <p className="font-medium">Quick fixes</p>
              <ol className="mt-2 list-decimal list-inside space-y-2">
                <li>Start a local Postgres instance (we included a docker-compose.yml)</li>
                <li>Ensure your DATABASE_URL in <code className="rounded bg-muted p-1">.env</code> points to the DB</li>
                <li>Run Prisma migrations: <code className="rounded bg-muted p-1">npx prisma migrate deploy</code> or for dev: <code className="rounded bg-muted p-1">npx prisma migrate reset --force</code></li>
              </ol>
            </div>

            <div className="mt-4">
              <p className="text-sm">Commands (PowerShell):</p>
              <pre className="mt-2 rounded bg-muted p-3 text-xs">
{`docker compose up -d
# then
npx prisma generate
npx prisma migrate reset --force`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  type LawaProjectWithSite = (typeof lawaProjectsRaw)[number]
  const lawaProjects: ProjectsManagementLawaProject[] = lawaProjectsRaw.map((project: LawaProjectWithSite) => ({
    id: project.id,
    projectSiteId: project.projectSiteId,
    siteName: project.projectSite.siteName,
    physicalTarget: project.physicalTarget,
    actualTarget: project.actualTarget,
    typeOfLawa: project.typeOfLawa,
  length: decimalToNumber(project.length ?? (project as any).lengthM, 0),
  width: decimalToNumber(project.width ?? (project as any).widthM, 0),
  depth: decimalToNumber(project.depth ?? (project as any).depthM, 0),
  capacityWaterVolume: decimalToNumber(project.capacityWaterVolume, 0),
    noOfLawa: project.noOfLawa,
    noProducedAquaticResources: project.noProducedAquaticResources,
    noFacilitiesEstablished: project.noFacilitiesEstablished,
    noFacilitiesRepaired: project.noFacilitiesRepaired,
  areaUtilized: decimalToNumber(project.areaUtilized ?? (project as any).areaUtilizedSqm, 0),
  projectedHarvest: decimalToNumber(project.projectedHarvest, 0),
  actualHarvest: decimalToNumber(project.actualHarvest, 0),
    status: projectStatusLabels[project.status] ?? "Planning",
    remarks: project.remarks,
  }))

  type BinhiProjectWithSite = (typeof binhiProjectsRaw)[number]
  const binhiProjects: ProjectsManagementBinhiProject[] = binhiProjectsRaw.map((project: BinhiProjectWithSite) => ({
    id: project.id,
    projectSiteId: project.projectSiteId,
    siteName: project.projectSite.siteName,
    actualBeneficiaries: project.actualBeneficiaries,
  areaUtilized: decimalToNumber(project.areaUtilized ?? (project as any).areaUtilizedSqm, 0),
    totalNoBinhiPlanted: project.totalNoBinhiPlanted,
    totalNoBinhiHarvested: project.totalNoBinhiHarvested,
    noBinhiSitesEstablished: project.noBinhiSitesEstablished,
  expectedYieldPerSqm: decimalToNumber(project.expectedYieldPerSqm, 0),
  projectedHarvest: decimalToNumber(project.projectedHarvest, 0),
  actualHarvest: decimalToNumber(project.actualHarvest, 0),
    status: projectStatusLabels[project.status] ?? "Planning",
    remarks: project.remarks,
  }))

  // projectSites and projectSiteOptions removed

  type TrackerWithSite = (typeof trackersRaw)[number]
  const trackers: ProjectTrackerRecord[] = trackersRaw.map((tracker: TrackerWithSite) => ({
    id: tracker.id,
    projectSiteId: tracker.projectSiteId,
    siteName: tracker.projectSite.siteName,
    projectType: tracker.projectType,
    physicalTarget: tracker.physicalTarget,
    financialTargets: Number(tracker.financialTargets),
    socialPreps: tracker.socialPreps,
    cftDrrCca: tracker.cftDrrCca,
    cfw: tracker.cfw,
    cftSustainability: tracker.cftSustainability,
    ffw: tracker.ffw,
    physicalAccomplishment: tracker.physicalAccomplishment,
    financialAccomplishment: Number(tracker.financialAccomplishment),
    balance: Number(tracker.balance),
    dateOfPayout: toISOStringOrNull(tracker.dateOfPayout ?? null),
    remarks: tracker.remarks,
    status: trackerStatusLabels[tracker.status] ?? "On Track",
  }))

  type BeneficiaryWithLinks = (typeof beneficiariesRaw)[number]
  const beneficiaries: BeneficiariesManagementRecord[] = beneficiariesRaw.map((beneficiary: BeneficiaryWithLinks) => {
    // Determine linked project site ids and latest enrollment date/status
    const enrollments = beneficiary.BeneficiarySiteEnrollment ?? []
    const projectSitesLinked = enrollments.map((link: any) => link.ProjectSite?.id).filter(Boolean)
    const latestEnrollment = enrollments.reduce((acc: any, link: any) => {
      if (!link) return acc
      const d = link.dateEnrolled ? new Date(link.dateEnrolled).getTime() : 0
      const accd = acc?.dateEnrolled ? new Date(acc.dateEnrolled).getTime() : 0
      return d > accd ? link : acc
    }, null)

    return ({
    id: beneficiary.id,
    name: beneficiary.name,
    age: beneficiary.age,
    sex: sexLabels[beneficiary.sex] ?? "Female",
    listahanPoor3: beneficiary.listahanPoor3,
    nonListahanPoor3: beneficiary.nonListahanPoor3,
    fourPsBeneficiary: beneficiary.fourPsBeneficiary,
    withMswdoCertification: beneficiary.withMswdoCertification,
    farmer: beneficiary.farmer,
    fisherfolk: beneficiary.fisherfolk,
    informalSector: beneficiary.informalSector,
    women: beneficiary.women,
    pwd: beneficiary.pwd,
    elderly: beneficiary.elderly,
    ips: beneficiary.ips,
    soloParent: beneficiary.soloParent,
    youth: beneficiary.youth,
    formerRebel: beneficiary.formerRebel,
    lgbtqia: beneficiary.lgbtqia,
    payoutAmount: Number(beneficiary.payoutAmount),
    // derive participation status from the latest enrollment if available
    participationStatus: participationStatusLabels[latestEnrollment?.status ?? "ACTIVE"] ?? "Active",
    projectSites: projectSitesLinked,
    // use latest enrollment date if available
    dateLinked: toISOStringOrNull(latestEnrollment?.dateEnrolled ?? null),
  })})

  const metrics = {
    totalProjects: lawaProjects.length + binhiProjects.length,
    activeBeneficiaries: beneficiaries.filter((b) => b.participationStatus === "Active").length,
    totalLawaProjects: lawaProjects.length,
    totalBinhiProjects: binhiProjects.length,
  }

  const projectDistribution = [
    {
      name: "Lawa Projects",
      value: lawaProjects.length,
      color: "#059669",
    },
    {
      name: "Binhi Projects",
      value: binhiProjects.length,
      color: "#10b981",
    },
  ]

  const monthlyProgressByMonth = new Map<number, { month: string; lawa: number; binhi: number }>()
  trackersRaw.forEach((tracker: TrackerWithSite) => {
    const sourceDate = tracker.dateOfPayout ?? tracker.updatedAt ?? tracker.createdAt
    if (!sourceDate) {
      return
    }

    const date = new Date(sourceDate)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const timeKey = monthStart.getTime()
    const label = monthStart.toLocaleString("en-US", { month: "short", year: "numeric" })

    if (!monthlyProgressByMonth.has(timeKey)) {
      monthlyProgressByMonth.set(timeKey, { month: label, lawa: 0, binhi: 0 })
    }

    const entry = monthlyProgressByMonth.get(timeKey)!
    if (tracker.projectType === "LAWA") {
      entry.lawa += tracker.physicalAccomplishment
    } else {
      entry.binhi += tracker.physicalAccomplishment
    }
  })

  const monthlyProgress = Array.from(monthlyProgressByMonth.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(-6)
    .map(([, value]) => value)

  const recentActivityCandidates = [
  ...lawaProjectsRaw.map((project: LawaProjectWithSite) => ({
      id: `lawa-${project.id}`,
      type: "lawa" as const,
      timestamp: project.updatedAt ?? project.createdAt,
      title: `Lawa project ${project.id} ${projectStatusLabels[project.status] ?? "updated"}`,
      description: project.projectSite.siteName,
    })),
  ...binhiProjectsRaw.map((project: BinhiProjectWithSite) => ({
      id: `binhi-${project.id}`,
      type: "binhi" as const,
      timestamp: project.updatedAt ?? project.createdAt,
      title: `Binhi project ${project.id} ${projectStatusLabels[project.status] ?? "updated"}`,
      description: project.projectSite.siteName,
    })),
  ...trackersRaw.map((tracker: TrackerWithSite) => ({
      id: `tracker-${tracker.id}`,
      type: "report" as const,
      timestamp: tracker.updatedAt ?? tracker.createdAt,
      title: `Tracker ${tracker.id} ${trackerStatusLabels[tracker.status] ?? "updated"}`,
      description: tracker.projectSite.siteName,
    })),
  ...beneficiariesRaw.map((beneficiary: BeneficiaryWithLinks) => {
      const enrollments = beneficiary.BeneficiarySiteEnrollment ?? []
      return {
        id: `beneficiary-${beneficiary.id}`,
        type: "beneficiary" as const,
        timestamp: beneficiary.updatedAt ?? beneficiary.createdAt,
        title: `${beneficiary.name} (${participationStatusLabels[beneficiary.participationStatus] ?? "Active"})`,
        description: `${enrollments.length} linked site${enrollments.length === 1 ? "" : "s"}`,
      }
    }),
  ].filter((item) => !!item.timestamp)

  const recentActivity = recentActivityCandidates
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      timeLabel: formatRelativeTime(new Date(item.timestamp)),
    }))

  return (
    <DashboardClient
      metrics={metrics}
      projectDistribution={projectDistribution}
      monthlyProgress={monthlyProgress}
      recentActivity={recentActivity}
      lawaProjects={lawaProjects}
      binhiProjects={binhiProjects}
  /* sites removed */
      beneficiaries={beneficiaries}
      trackers={trackers}
    />
  )
}
