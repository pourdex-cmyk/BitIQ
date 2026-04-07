-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BEANTOWN_ADMIN', 'BEANTOWN_PM', 'BEANTOWN_PRINCIPAL', 'BEANTOWN_FINANCE', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'SOW_GENERATED', 'BIDDING_OPEN', 'BIDDING_CLOSED', 'BID_SELECTED', 'CONTRACTING', 'IN_PROGRESS', 'COMPLETE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'AI_PROCESSING', 'AI_SCORED', 'UNDER_REVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'VIEWED', 'BID_SUBMITTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT_FOR_SIGNATURE', 'SIGNED', 'ACTIVE', 'COMPLETE', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseState" TEXT NOT NULL,
    "licenseExpiry" TIMESTAMP(3),
    "insuranceCurrent" BOOLEAN NOT NULL DEFAULT false,
    "insuranceExpiry" TIMESTAMP(3),
    "yearsInBusiness" INTEGER NOT NULL,
    "primaryTrade" TEXT NOT NULL,
    "specialties" TEXT[],
    "serviceArea" TEXT[],
    "overallScore" DOUBLE PRECISION,
    "bidAccuracyScore" DOUBLE PRECISION,
    "onTimeScore" DOUBLE PRECISION,
    "qualityScore" DOUBLE PRECISION,
    "changeOrderScore" DOUBLE PRECISION,
    "totalProjectsWithBeantown" INTEGER NOT NULL DEFAULT 0,
    "totalProjectValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "squareFootage" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "purchasePrice" DOUBLE PRECISION,
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyPhoto" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "caption" TEXT,
    "aiTags" TEXT[],
    "aiAnalysis" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "bidDeadline" TIMESTAMP(3),
    "bidOpenedAt" TIMESTAMP(3),
    "bidClosedAt" TIMESTAMP(3),
    "budgetTarget" DOUBLE PRECISION,
    "aiBenchmarkMid" DOUBLE PRECISION,
    "aiBenchmarkLow" DOUBLE PRECISION,
    "aiBenchmarkHigh" DOUBLE PRECISION,
    "selectedBidId" TEXT,
    "selectedAt" TIMESTAMP(3),
    "yardiProjectId" TEXT,
    "yardiSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScopeOfWork" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "summary" TEXT NOT NULL,
    "conditionReport" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScopeOfWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SowLineItem" (
    "id" TEXT NOT NULL,
    "sowId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "estimatedQty" DOUBLE PRECISION,
    "notes" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "benchmarkLow" DOUBLE PRECISION,
    "benchmarkMid" DOUBLE PRECISION,
    "benchmarkHigh" DOUBLE PRECISION,

    CONSTRAINT "SowLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidInvitation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractorEmail" TEXT NOT NULL,
    "contractorName" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BidInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractorId" TEXT,
    "contractorProfileId" TEXT,
    "invitationId" TEXT,
    "status" "BidStatus" NOT NULL DEFAULT 'DRAFT',
    "contractorCompany" TEXT NOT NULL,
    "contractorName" TEXT NOT NULL,
    "contractorEmail" TEXT NOT NULL,
    "contractorPhone" TEXT,
    "licenseNumber" TEXT,
    "yearsExperience" INTEGER,
    "primaryTrade" TEXT,
    "insuranceOnFile" BOOLEAN NOT NULL DEFAULT false,
    "totalLaborCost" DOUBLE PRECISION,
    "totalMaterialCost" DOUBLE PRECISION,
    "totalBidAmount" DOUBLE PRECISION,
    "proposedStartDate" TIMESTAMP(3),
    "estimatedDays" INTEGER,
    "paymentTerms" TEXT,
    "bidValidUntil" TIMESTAMP(3),
    "exclusions" TEXT,
    "allowances" TEXT,
    "assumptions" TEXT,
    "notes" TEXT,
    "aiOverallScore" DOUBLE PRECISION,
    "aiBidVsBenchmark" DOUBLE PRECISION,
    "aiHistoricalScore" DOUBLE PRECISION,
    "aiRiskScore" DOUBLE PRECISION,
    "aiRecommended" BOOLEAN NOT NULL DEFAULT false,
    "aiRationale" TEXT,
    "aiScoredAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidLineItem" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "sowLineItemId" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "quantity" DOUBLE PRECISION,
    "laborCost" DOUBLE PRECISION,
    "materialCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "estimatedDays" INTEGER,
    "subcontracted" BOOLEAN NOT NULL DEFAULT false,
    "subcontractorName" TEXT,
    "notes" TEXT,
    "benchmarkMid" DOUBLE PRECISION,
    "deviationPct" DOUBLE PRECISION,
    "aiFlag" TEXT,
    "aiFlagReason" TEXT,

    CONSTRAINT "BidLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "contractorCompany" TEXT NOT NULL,
    "contractorName" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "aiDrafted" BOOLEAN NOT NULL DEFAULT false,
    "documentUrl" TEXT,
    "storagePath" TEXT,
    "signedAt" TIMESTAMP(3),
    "yardiSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractMilestone" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ContractMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkDataPoint" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "region" TEXT NOT NULL,
    "laborLow" DOUBLE PRECISION NOT NULL,
    "laborMid" DOUBLE PRECISION NOT NULL,
    "laborHigh" DOUBLE PRECISION NOT NULL,
    "materialLow" DOUBLE PRECISION NOT NULL,
    "materialMid" DOUBLE PRECISION NOT NULL,
    "materialHigh" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "projectId" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkDataPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ContractorProfile_userId_key" ON "ContractorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ScopeOfWork_projectId_key" ON "ScopeOfWork"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "BidInvitation_token_key" ON "BidInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_invitationId_key" ON "Bid"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_projectId_key" ON "Contract"("projectId");

-- AddForeignKey
ALTER TABLE "ContractorProfile" ADD CONSTRAINT "ContractorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyPhoto" ADD CONSTRAINT "PropertyPhoto_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeOfWork" ADD CONSTRAINT "ScopeOfWork_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SowLineItem" ADD CONSTRAINT "SowLineItem_sowId_fkey" FOREIGN KEY ("sowId") REFERENCES "ScopeOfWork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidInvitation" ADD CONSTRAINT "BidInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_contractorProfileId_fkey" FOREIGN KEY ("contractorProfileId") REFERENCES "ContractorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "BidInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidLineItem" ADD CONSTRAINT "BidLineItem_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidLineItem" ADD CONSTRAINT "BidLineItem_sowLineItemId_fkey" FOREIGN KEY ("sowLineItemId") REFERENCES "SowLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractMilestone" ADD CONSTRAINT "ContractMilestone_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
