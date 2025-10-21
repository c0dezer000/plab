-- CreateEnum
CREATE TYPE "public"."SiteType" AS ENUM ('BINHI', 'LAWA', 'BOTH');

-- CreateTable
CREATE TABLE "public"."ProjectSite" (
    "id" TEXT NOT NULL,
    "regionCode" TEXT,
    "provinceCode" TEXT,
    "cityMunicipalityCode" TEXT,
    "barangayCode" TEXT,
    "province" TEXT,
    "cityMunicipality" TEXT,
    "barangay" TEXT,
    "siteName" TEXT NOT NULL,
    "siteType" "public"."SiteType" DEFAULT 'BOTH',
    "dateEstablished" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LawaProject" (
    "id" TEXT NOT NULL,
    "projectSiteId" TEXT NOT NULL,
    "physicalTarget" INTEGER,
    "actualTarget" INTEGER,
    "typeOfLawa" TEXT,
    "lengthM" DECIMAL(10,2),
    "widthM" DECIMAL(10,2),
    "depthM" DECIMAL(10,2),
    "capacityWaterVolume" DECIMAL(12,2),
    "noOfLawa" INTEGER,
    "noProducedAquaticResources" INTEGER,
    "noFacilitiesEstablished" INTEGER,
    "noFacilitiesRepaired" INTEGER,
    "areaUtilizedSqm" DECIMAL(12,2),
    "projectedHarvest" DECIMAL(12,2),
    "actualHarvest" DECIMAL(12,2),
    "status" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawaProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BinhiProject" (
    "id" TEXT NOT NULL,
    "projectSiteId" TEXT NOT NULL,
    "actualBeneficiaries" INTEGER,
    "areaUtilizedSqm" DECIMAL(12,2),
    "totalNoBinhiPlanted" INTEGER,
    "totalNoBinhiHarvested" INTEGER,
    "noBinhiSitesEstablished" INTEGER,
    "expectedYieldPerSqmKg" DECIMAL(12,2),
    "projectedHarvestKg" DECIMAL(12,2),
    "actualHarvestKg" DECIMAL(12,2),
    "status" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BinhiProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectTracker" (
    "id" TEXT NOT NULL,
    "projectSiteId" TEXT NOT NULL,
    "physicalTarget" INTEGER,
    "financialTargets" DECIMAL(12,2),
    "socialPreps" TEXT,
    "cftDrrCca" TEXT,
    "cfw" TEXT,
    "cftSustainability" TEXT,
    "ffw" TEXT,
    "physicalAccomplishment" INTEGER,
    "financialAccomplishment" DECIMAL(12,2),
    "balance" DECIMAL(12,2),
    "dateOfPayout" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Beneficiary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "sex" TEXT,
    "listahanPoor3" BOOLEAN,
    "nonListahanPoor3" BOOLEAN,
    "fourPsBeneficiary" BOOLEAN,
    "withMswdoCertification" BOOLEAN,
    "farmer" BOOLEAN,
    "fisherfolk" BOOLEAN,
    "informalSector" BOOLEAN,
    "women" BOOLEAN,
    "pwd" BOOLEAN,
    "elderly" BOOLEAN,
    "ips" BOOLEAN,
    "soloParent" BOOLEAN,
    "youth" BOOLEAN,
    "formerRebel" BOOLEAN,
    "lgbtqia" BOOLEAN,
    "payoutAmount" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BeneficiarySiteEnrollment" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "projectSiteId" TEXT NOT NULL,
    "status" TEXT,
    "dateEnrolled" TIMESTAMP(3),
    "dateEnded" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeneficiarySiteEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BinhiProjectBeneficiaryLink" (
    "id" TEXT NOT NULL,
    "binhiProjectId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "participationStatus" TEXT,
    "dateLinked" TIMESTAMP(3),
    "dateUnlinked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BinhiProjectBeneficiaryLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LawaProjectBeneficiaryLink" (
    "id" TEXT NOT NULL,
    "lawaProjectId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "participationStatus" TEXT,
    "dateLinked" TIMESTAMP(3),
    "dateUnlinked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawaProjectBeneficiaryLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectTracker_projectSiteId_idx" ON "public"."ProjectTracker"("projectSiteId");

-- CreateIndex
CREATE INDEX "BeneficiarySiteEnrollment_beneficiaryId_idx" ON "public"."BeneficiarySiteEnrollment"("beneficiaryId");

-- CreateIndex
CREATE INDEX "BeneficiarySiteEnrollment_projectSiteId_idx" ON "public"."BeneficiarySiteEnrollment"("projectSiteId");

-- CreateIndex
CREATE INDEX "BinhiProjectBeneficiaryLink_beneficiaryId_idx" ON "public"."BinhiProjectBeneficiaryLink"("beneficiaryId");

-- CreateIndex
CREATE INDEX "BinhiProjectBeneficiaryLink_binhiProjectId_idx" ON "public"."BinhiProjectBeneficiaryLink"("binhiProjectId");

-- CreateIndex
CREATE INDEX "LawaProjectBeneficiaryLink_beneficiaryId_idx" ON "public"."LawaProjectBeneficiaryLink"("beneficiaryId");

-- CreateIndex
CREATE INDEX "LawaProjectBeneficiaryLink_lawaProjectId_idx" ON "public"."LawaProjectBeneficiaryLink"("lawaProjectId");

-- AddForeignKey
ALTER TABLE "public"."LawaProject" ADD CONSTRAINT "LawaProject_projectSiteId_fkey" FOREIGN KEY ("projectSiteId") REFERENCES "public"."ProjectSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BinhiProject" ADD CONSTRAINT "BinhiProject_projectSiteId_fkey" FOREIGN KEY ("projectSiteId") REFERENCES "public"."ProjectSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectTracker" ADD CONSTRAINT "ProjectTracker_projectSiteId_fkey" FOREIGN KEY ("projectSiteId") REFERENCES "public"."ProjectSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BeneficiarySiteEnrollment" ADD CONSTRAINT "BeneficiarySiteEnrollment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "public"."Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BeneficiarySiteEnrollment" ADD CONSTRAINT "BeneficiarySiteEnrollment_projectSiteId_fkey" FOREIGN KEY ("projectSiteId") REFERENCES "public"."ProjectSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BinhiProjectBeneficiaryLink" ADD CONSTRAINT "BinhiProjectBeneficiaryLink_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "public"."Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BinhiProjectBeneficiaryLink" ADD CONSTRAINT "BinhiProjectBeneficiaryLink_binhiProjectId_fkey" FOREIGN KEY ("binhiProjectId") REFERENCES "public"."BinhiProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LawaProjectBeneficiaryLink" ADD CONSTRAINT "LawaProjectBeneficiaryLink_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "public"."Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LawaProjectBeneficiaryLink" ADD CONSTRAINT "LawaProjectBeneficiaryLink_lawaProjectId_fkey" FOREIGN KEY ("lawaProjectId") REFERENCES "public"."LawaProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
