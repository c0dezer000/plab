// Import from generated client output directory defined in prisma/schema.prisma
import { PrismaClient } from "../src/generated/prisma"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding sample data...")

  // Id helpers
  const siteId = "SITE-001"
  const lawaProjectId = "LAWA-001"
  const binhiProjectId = "BINHI-001"
  const trackerId = "TRACKER-001"
  const ben1 = "BEN-001"
  const ben2 = "BEN-002"

  // Upsert Project Site
  await prisma.projectSite.upsert({
    where: { id: siteId },
    update: {},
    create: {
      id: siteId,
      siteName: "Sample Integrated Site",
      regionCode: "01",
      provinceCode: "0128",
      cityMunicipalityCode: "012801",
      siteType: "BOTH",
      remarks: "Demo seed site",
    },
  })

  // Beneficiaries
  await prisma.beneficiary.upsert({
    where: { id: ben1 },
    update: {},
    create: { id: ben1, name: "Juan Dela Cruz", age: 42, sex: "MALE" },
  })
  await prisma.beneficiary.upsert({
    where: { id: ben2 },
    update: {},
    create: { id: ben2, name: "Maria Santos", age: 38, sex: "FEMALE" },
  })

  // Site enrollments
  await prisma.beneficiarySiteEnrollment.upsert({
    where: { id: `${ben1}-${siteId}` },
    update: { updatedAt: new Date() },
    create: { id: `${ben1}-${siteId}`, beneficiaryId: ben1, projectSiteId: siteId, status: "ACTIVE", dateEnrolled: new Date(), updatedAt: new Date() },
  })
  await prisma.beneficiarySiteEnrollment.upsert({
    where: { id: `${ben2}-${siteId}` },
    update: { updatedAt: new Date() },
    create: { id: `${ben2}-${siteId}`, beneficiaryId: ben2, projectSiteId: siteId, status: "ACTIVE", dateEnrolled: new Date(), updatedAt: new Date() },
  })

  // Lawa Project
  await prisma.lawaProject.upsert({
    where: { id: lawaProjectId },
    update: {},
    create: {
      id: lawaProjectId,
      projectSiteId: siteId,
      physicalTarget: 100,
      actualTarget: 40,
      typeOfLawa: "Fishpond",
      lengthM: 25,
      widthM: 10,
      depthM: 2.5,
      capacityWaterVolume: 500,
      noOfLawa: 2,
      areaUtilizedSqm: 250,
      projectedHarvest: 300,
      actualHarvest: 0,
      status: "IN_PROGRESS",
      remarks: "Initial excavation done",
    },
  })

  // Binhi Project
  await prisma.binhiProject.upsert({
    where: { id: binhiProjectId },
    update: {},
    create: {
      id: binhiProjectId,
      projectSiteId: siteId,
      actualBeneficiaries: 15,
      areaUtilizedSqm: 400,
      totalNoBinhiPlanted: 1000,
      totalNoBinhiHarvested: 200,
      noBinhiSitesEstablished: 1,
      expectedYieldPerSqmKg: 1.2,
      projectedHarvestKg: 480,
      actualHarvestKg: 0,
      status: "IN_PROGRESS",
      remarks: "Seedlings transplanted",
    },
  })

  // Project Tracker
  await prisma.projectTracker.upsert({
    where: { id: trackerId },
    update: {},
    create: {
      id: trackerId,
      projectSiteId: siteId,
      physicalTarget: 100,
      financialTargets: 50000,
      socialPreps: "Orientation completed",
      cftDrrCca: "Scheduled",
      cfw: null,
      cftSustainability: null,
      ffw: null,
      physicalAccomplishment: 25,
      financialAccomplishment: 10000,
      balance: 40000,
      remarks: "Quarter 1 progress",
    },
  })

  // Tracker enrollments
  // Tracker enrollments (let Prisma auto-generate id)
  await prisma.projectTrackerBeneficiaryEnrollment.create({
    data: {
      projectTrackerId: trackerId,
      beneficiaryId: ben1,
      stage: "SOCIAL_PREPS",
      stageStartedAt: new Date(),
      attendanceCount: 1,
      remarks: "Attended orientation",
    },
  })

  await prisma.projectTrackerBeneficiaryEnrollment.create({
    data: {
      projectTrackerId: trackerId,
      beneficiaryId: ben2,
      stage: "CFT",
      stageStartedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      attendanceCount: 2,
      remarks: "In training module 1",
    },
  })

  console.log("Seed data inserted.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })