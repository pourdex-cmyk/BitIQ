import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = (process.env.DIRECT_URL ?? "").replace(/^["']|["']$/g, "");
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  console.log("🌱 Seeding BidIQ database...");

  // Benchmarks
  const benchmarks = [
    {
      category: "Demolition",
      description: "Full interior demo per SF",
      unit: "SF",
      laborLow: 1.2,
      laborMid: 1.75,
      laborHigh: 2.4,
      materialLow: 0.2,
      materialMid: 0.4,
      materialHigh: 0.8,
      source: "CT RSMeans 2024",
    },
    {
      category: "Electrical",
      description: "Full rewire per SF",
      unit: "SF",
      laborLow: 4.5,
      laborMid: 6.0,
      laborHigh: 8.5,
      materialLow: 2.0,
      materialMid: 3.0,
      materialHigh: 4.5,
      source: "CT RSMeans 2024",
    },
    {
      category: "Flooring",
      description: "LVP installation per SF",
      unit: "SF",
      laborLow: 2.0,
      laborMid: 3.0,
      laborHigh: 4.5,
      materialLow: 2.5,
      materialMid: 3.75,
      materialHigh: 6.0,
      source: "CT RSMeans 2024",
    },
    {
      category: "Painting",
      description: "Interior paint per SF",
      unit: "SF",
      laborLow: 0.8,
      laborMid: 1.2,
      laborHigh: 1.8,
      materialLow: 0.3,
      materialMid: 0.5,
      materialHigh: 0.8,
      source: "CT RSMeans 2024",
    },
    {
      category: "Kitchen",
      description: "Kitchen renovation mid-grade",
      unit: "LS",
      laborLow: 8000,
      laborMid: 14000,
      laborHigh: 22000,
      materialLow: 6000,
      materialMid: 12000,
      materialHigh: 25000,
      source: "CT RSMeans 2024",
    },
    {
      category: "Bathroom",
      description: "Full bathroom renovation",
      unit: "EA",
      laborLow: 3500,
      laborMid: 6000,
      laborHigh: 10000,
      materialLow: 2500,
      materialMid: 5000,
      materialHigh: 9000,
      source: "CT RSMeans 2024",
    },
    {
      category: "HVAC",
      description: "Full system replacement",
      unit: "LS",
      laborLow: 4000,
      laborMid: 7500,
      laborHigh: 14000,
      materialLow: 5000,
      materialMid: 9000,
      materialHigh: 18000,
      source: "CT RSMeans 2024",
    },
    {
      category: "Plumbing",
      description: "Full plumbing rough-in and trim",
      unit: "LS",
      laborLow: 3500,
      laborMid: 6000,
      laborHigh: 10000,
      materialLow: 2000,
      materialMid: 4000,
      materialHigh: 7500,
      source: "CT RSMeans 2024",
    },
    {
      category: "Drywall",
      description: "Hang, tape, and finish per SF",
      unit: "SF",
      laborLow: 1.5,
      laborMid: 2.25,
      laborHigh: 3.5,
      materialLow: 0.5,
      materialMid: 0.85,
      materialHigh: 1.4,
      source: "CT RSMeans 2024",
    },
    {
      category: "Roofing",
      description: "Asphalt shingle replacement per SQ",
      unit: "SQ",
      laborLow: 180,
      laborMid: 250,
      laborHigh: 380,
      materialLow: 120,
      materialMid: 190,
      materialHigh: 320,
      source: "CT RSMeans 2024",
    },
  ];

  for (const benchmark of benchmarks) {
    await prisma.benchmarkDataPoint.upsert({
      where: {
        id: `bench_${benchmark.category.toLowerCase().replace(/\s/g, "_")}`,
      },
      update: benchmark,
      create: {
        id: `bench_${benchmark.category.toLowerCase().replace(/\s/g, "_")}`,
        ...benchmark,
        region: "CT",
        effectiveDate: new Date("2024-01-01"),
      },
    });
  }

  console.log(`✓ ${benchmarks.length} benchmarks seeded`);

  // Staff users
  const staffUsers = [
    {
      id: "user_admin_1",
      supabaseId: "supa_admin_1",
      email: "admin@beantownco.com",
      name: "Alex Beantown",
      role: "BEANTOWN_ADMIN" as const,
    },
    {
      id: "user_pm_1",
      supabaseId: "supa_pm_1",
      email: "pm@beantownco.com",
      name: "Jordan PM",
      role: "BEANTOWN_PM" as const,
    },
    {
      id: "user_principal_1",
      supabaseId: "supa_principal_1",
      email: "principal@beantownco.com",
      name: "Sam Principal",
      role: "BEANTOWN_PRINCIPAL" as const,
    },
  ];

  for (const u of staffUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: u,
    });
  }
  console.log(`✓ ${staffUsers.length} staff users seeded`);

  // Contractor users + profiles
  const contractors = [
    {
      id: "user_contractor_1",
      supabaseId: "supa_contractor_1",
      email: "summit@summitgc.com",
      name: "Mike Torres",
      role: "CONTRACTOR" as const,
      profile: {
        companyName: "Summit General Contracting",
        licenseNumber: "CT-GC-0045821",
        licenseState: "CT",
        licenseExpiry: new Date("2026-06-30"),
        insuranceCurrent: true,
        insuranceExpiry: new Date("2025-12-31"),
        yearsInBusiness: 14,
        primaryTrade: "General Contractor",
        specialties: ["Full Renovation", "Historic Rehab", "Multi-Family"],
        serviceArea: ["Hartford", "Glastonbury", "West Hartford", "Farmington"],
        overallScore: 92,
        bidAccuracyScore: 94,
        onTimeScore: 91,
        qualityScore: 90,
        changeOrderScore: 95,
        totalProjectsWithBeantown: 7,
        totalProjectValue: 1240000,
      },
    },
    {
      id: "user_contractor_2",
      supabaseId: "supa_contractor_2",
      email: "info@riversidebuild.com",
      name: "Chris Walsh",
      role: "CONTRACTOR" as const,
      profile: {
        companyName: "Riverside Build Group",
        licenseNumber: "CT-GC-0067234",
        licenseState: "CT",
        licenseExpiry: new Date("2025-09-30"),
        insuranceCurrent: true,
        insuranceExpiry: new Date("2025-10-31"),
        yearsInBusiness: 8,
        primaryTrade: "General Contractor",
        specialties: ["Gut Renovation", "Kitchen & Bath", "Basement Finishing"],
        serviceArea: ["Hartford", "New Britain", "Bristol"],
        overallScore: 78,
        bidAccuracyScore: 72,
        onTimeScore: 83,
        qualityScore: 79,
        changeOrderScore: 80,
        totalProjectsWithBeantown: 3,
        totalProjectValue: 385000,
      },
    },
    {
      id: "user_contractor_3",
      supabaseId: "supa_contractor_3",
      email: "info@northeastreno.com",
      name: "Bob Fitzpatrick",
      role: "CONTRACTOR" as const,
      profile: {
        companyName: "Northeast Renovators LLC",
        licenseNumber: "CT-GC-0021109",
        licenseState: "CT",
        licenseExpiry: new Date("2026-03-31"),
        insuranceCurrent: false,
        insuranceExpiry: new Date("2024-08-31"),
        yearsInBusiness: 22,
        primaryTrade: "General Contractor",
        specialties: ["Historic Renovation", "Commercial Buildout"],
        serviceArea: ["Hartford County", "Tolland County"],
        overallScore: 61,
        bidAccuracyScore: 58,
        onTimeScore: 65,
        qualityScore: 68,
        changeOrderScore: 55,
        totalProjectsWithBeantown: 2,
        totalProjectValue: 210000,
      },
    },
    {
      id: "user_contractor_4",
      supabaseId: "supa_contractor_4",
      email: "info@bluelineelec.com",
      name: "Dan Chen",
      role: "CONTRACTOR" as const,
      profile: {
        companyName: "BlueLine Electrical",
        licenseNumber: "CT-E1-0098745",
        licenseState: "CT",
        licenseExpiry: new Date("2026-12-31"),
        insuranceCurrent: true,
        insuranceExpiry: new Date("2025-11-30"),
        yearsInBusiness: 11,
        primaryTrade: "Electrical",
        specialties: ["Full Rewire", "Panel Upgrades", "EV Charger Install"],
        serviceArea: ["Greater Hartford", "New Haven County"],
        overallScore: 88,
        bidAccuracyScore: 90,
        onTimeScore: 87,
        qualityScore: 92,
        changeOrderScore: 82,
        totalProjectsWithBeantown: 5,
        totalProjectValue: 185000,
      },
    },
  ];

  for (const c of contractors) {
    const { profile, ...userData } = c;
    const user = await prisma.user.upsert({
      where: { id: userData.id },
      update: {},
      create: userData,
    });
    await prisma.contractorProfile.upsert({
      where: { userId: user.id },
      update: profile,
      create: { ...profile, userId: user.id },
    });
  }
  console.log(`✓ ${contractors.length} contractors seeded`);

  // Sample properties + projects
  const property1 = await prisma.property.upsert({
    where: { id: "prop_maple_1" },
    update: {},
    create: {
      id: "prop_maple_1",
      address: "14 Maple Avenue",
      city: "Glastonbury",
      state: "CT",
      zip: "06033",
      propertyType: "single-family",
      squareFootage: 1850,
      yearBuilt: 1965,
      purchasePrice: 285000,
    },
  });

  const property2 = await prisma.property.upsert({
    where: { id: "prop_riverbend_1" },
    update: {},
    create: {
      id: "prop_riverbend_1",
      address: "47 Riverbend Drive",
      city: "Hartford",
      state: "CT",
      zip: "06103",
      propertyType: "multi-family",
      squareFootage: 3200,
      yearBuilt: 1952,
      purchasePrice: 410000,
    },
  });

  // Project 1 — Bidding Open with SOW and invited contractors
  const project1 = await prisma.project.upsert({
    where: { id: "proj_maple_1" },
    update: {},
    create: {
      id: "proj_maple_1",
      name: "14 Maple — Full Renovation",
      description: "Complete gut renovation: demo, new electric, plumbing, HVAC, kitchen, 2 baths, flooring throughout",
      propertyId: property1.id,
      ownerId: "user_pm_1",
      status: "BIDDING_OPEN",
      bidDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      bidOpenedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      budgetTarget: 85000,
      aiBenchmarkMid: 78500,
      aiBenchmarkLow: 62000,
      aiBenchmarkHigh: 98000,
    },
  });

  // SOW for project 1
  const sow1 = await prisma.scopeOfWork.upsert({
    where: { projectId: project1.id },
    update: {},
    create: {
      projectId: project1.id,
      aiGenerated: true,
      summary: "Full gut renovation of 1,850 SF single-family home. Property requires complete interior demo, all new mechanical systems, kitchen and 2 full bath renovations, and cosmetic finishes throughout.",
      conditionReport: "Property in poor condition. Water damage visible in master bathroom ceiling, outdated knob-and-tube wiring, original 1965 plumbing, single-pane windows, functional but dated HVAC. Priority: electrical and plumbing before cosmetics.",
      lineItems: {
        create: [
          { sortOrder: 1, category: "Demolition", description: "Full interior demo — remove all flooring, drywall, fixtures, cabinets", unit: "LS", estimatedQty: 1, benchmarkLow: 2500, benchmarkMid: 3800, benchmarkHigh: 5200, notes: "Confirm asbestos testing complete", required: true },
          { sortOrder: 2, category: "Electrical", description: "Full rewire — new panel, all circuits, outlets, fixtures", unit: "SF", estimatedQty: 1850, benchmarkLow: 8325, benchmarkMid: 11100, benchmarkHigh: 15725, required: true },
          { sortOrder: 3, category: "Plumbing", description: "Full plumbing replacement — supply and drain", unit: "LS", estimatedQty: 1, benchmarkLow: 5500, benchmarkMid: 10000, benchmarkHigh: 17500, required: true },
          { sortOrder: 4, category: "HVAC", description: "New forced-air system — furnace, AC, all ductwork", unit: "LS", estimatedQty: 1, benchmarkLow: 9000, benchmarkMid: 16500, benchmarkHigh: 32000, required: true },
          { sortOrder: 5, category: "Drywall", description: "Hang, tape, finish — all rooms", unit: "SF", estimatedQty: 1850, benchmarkLow: 2775, benchmarkMid: 4163, benchmarkHigh: 6475, required: true },
          { sortOrder: 6, category: "Kitchen", description: "Full kitchen renovation — mid-grade cabinets, quartz, appliances", unit: "LS", estimatedQty: 1, benchmarkLow: 14000, benchmarkMid: 26000, benchmarkHigh: 47000, required: true },
          { sortOrder: 7, category: "Bathroom", description: "Full bath renovation x2 — tile, vanity, fixtures", unit: "EA", estimatedQty: 2, benchmarkLow: 6000, benchmarkMid: 11000, benchmarkHigh: 19000, required: true },
          { sortOrder: 8, category: "Flooring", description: "LVP throughout — all rooms except tile baths", unit: "SF", estimatedQty: 1500, benchmarkLow: 6750, benchmarkMid: 11250, benchmarkHigh: 16500, required: true },
          { sortOrder: 9, category: "Painting", description: "Interior paint — all rooms, 2 coats", unit: "SF", estimatedQty: 1850, benchmarkLow: 2035, benchmarkMid: 2960, benchmarkHigh: 4070, required: true },
        ],
      },
    },
  });

  // Project 2 — AI Scored with bids
  const project2 = await prisma.project.upsert({
    where: { id: "proj_riverbend_1" },
    update: {},
    create: {
      id: "proj_riverbend_1",
      name: "47 Riverbend — Multi-Family Gut Reno",
      description: "Full gut renovation of 3-unit multi-family property",
      propertyId: property2.id,
      ownerId: "user_pm_1",
      status: "BIDDING_CLOSED",
      bidDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      bidOpenedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      bidClosedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      budgetTarget: 145000,
      aiBenchmarkMid: 138000,
      aiBenchmarkLow: 110000,
      aiBenchmarkHigh: 175000,
    },
  });

  // SOW for project 2
  const sow2 = await prisma.scopeOfWork.upsert({
    where: { projectId: project2.id },
    update: {},
    create: {
      projectId: project2.id,
      aiGenerated: true,
      summary: "Full renovation of 3-unit multi-family, 3,200 SF. All units require complete update.",
      conditionReport: "Property in poor condition. Original 1952 electrical and plumbing throughout. All 3 units need complete renovation. Roof is 12 years old and functional. Foundation is sound.",
      lineItems: {
        create: [
          { sortOrder: 1, category: "Demolition", description: "Full interior demo — all 3 units", unit: "SF", estimatedQty: 3200, benchmarkLow: 3840, benchmarkMid: 5600, benchmarkHigh: 7680, required: true },
          { sortOrder: 2, category: "Electrical", description: "Full rewire — 3 units + common areas", unit: "SF", estimatedQty: 3200, benchmarkLow: 14400, benchmarkMid: 19200, benchmarkHigh: 27200, required: true },
          { sortOrder: 3, category: "Plumbing", description: "Full plumbing — 3 units", unit: "LS", estimatedQty: 1, benchmarkLow: 16500, benchmarkMid: 30000, benchmarkHigh: 52500, required: true },
          { sortOrder: 4, category: "HVAC", description: "3 independent HVAC systems", unit: "LS", estimatedQty: 1, benchmarkLow: 27000, benchmarkMid: 49500, benchmarkHigh: 96000, required: true },
          { sortOrder: 5, category: "Flooring", description: "LVP — all units", unit: "SF", estimatedQty: 2800, benchmarkLow: 12600, benchmarkMid: 21000, benchmarkHigh: 30800, required: true },
          { sortOrder: 6, category: "Painting", description: "Interior — all 3 units", unit: "SF", estimatedQty: 3200, benchmarkLow: 3520, benchmarkMid: 5120, benchmarkHigh: 7040, required: true },
        ],
      },
    },
  });

  // Sample bids for project 2 (scored)
  const bids = [
    {
      id: "bid_summit_1",
      contractorId: "user_contractor_1",
      contractorProfileId: `contractor_${contractors[0].id}`,
      contractorCompany: "Summit General Contracting",
      contractorName: "Mike Torres",
      contractorEmail: "summit@summitgc.com",
      contractorPhone: "(860) 555-0101",
      licenseNumber: "CT-GC-0045821",
      yearsExperience: 14,
      primaryTrade: "General Contractor",
      insuranceOnFile: true,
      totalLaborCost: 72000,
      totalMaterialCost: 68500,
      totalBidAmount: 140500,
      proposedStartDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      estimatedDays: 90,
      paymentTerms: "30% mobilization, 40% rough-in complete, 30% final",
      status: "AI_SCORED" as const,
      aiOverallScore: 87.3,
      aiBidVsBenchmark: 91.0,
      aiHistoricalScore: 84.0,
      aiRiskScore: 88.0,
      aiRecommended: true,
      aiRationale: "Summit General Contracting is the recommended choice. Their total bid of $140,500 comes in 1.8% above benchmark mid — well within acceptable range. Combined with their 92-point historical performance score (94 bid accuracy, 91 on-time, 90 quality), this is the strongest overall package. Their 14 years of experience and 7 completed Beantown projects provide high confidence in execution. The change order score of 95 is particularly notable — virtually no budget surprises historically.",
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      aiScoredAt: new Date(Date.now() - 20 * 60 * 1000),
    },
    {
      id: "bid_riverside_1",
      contractorId: "user_contractor_2",
      contractorProfileId: `contractor_${contractors[1].id}`,
      contractorCompany: "Riverside Build Group",
      contractorName: "Chris Walsh",
      contractorEmail: "info@riversidebuild.com",
      contractorPhone: "(860) 555-0202",
      licenseNumber: "CT-GC-0067234",
      yearsExperience: 8,
      primaryTrade: "General Contractor",
      insuranceOnFile: true,
      totalLaborCost: 68000,
      totalMaterialCost: 74000,
      totalBidAmount: 142000,
      proposedStartDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      estimatedDays: 105,
      paymentTerms: "25% deposit, 50% midway, 25% completion",
      status: "AI_SCORED" as const,
      aiOverallScore: 74.2,
      aiBidVsBenchmark: 78.0,
      aiHistoricalScore: 68.0,
      aiRiskScore: 79.0,
      aiRecommended: false,
      aiRationale: "Riverside Build Group comes in $1,500 above Summit at $142,000 with a lower historical score. Their HVAC pricing ($53,200) is 7.5% above benchmark mid, and their timeline of 105 days is 17% longer than Summit's 90-day estimate. The lower bid accuracy score (72) suggests a moderate risk of final costs exceeding this bid.",
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      aiScoredAt: new Date(Date.now() - 20 * 60 * 1000),
    },
    {
      id: "bid_northeast_1",
      contractorId: "user_contractor_3",
      contractorProfileId: `contractor_${contractors[2].id}`,
      contractorCompany: "Northeast Renovators LLC",
      contractorName: "Bob Fitzpatrick",
      contractorEmail: "info@northeastreno.com",
      licenseNumber: "CT-GC-0021109",
      yearsExperience: 22,
      primaryTrade: "General Contractor",
      insuranceOnFile: false,
      totalLaborCost: 89000,
      totalMaterialCost: 78000,
      totalBidAmount: 167000,
      proposedStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      estimatedDays: 120,
      paymentTerms: "50% upfront, 50% completion",
      status: "AI_SCORED" as const,
      aiOverallScore: 52.1,
      aiBidVsBenchmark: 42.0,
      aiHistoricalScore: 58.0,
      aiRiskScore: 61.0,
      aiRecommended: false,
      aiRationale: "Northeast Renovators comes in at $167,000 — 21% above benchmark mid. Multiple line items show RED flags, particularly electrical ($31,000 vs benchmark $19,200) and HVAC ($58,000 vs benchmark $49,500). Their insurance is not current which creates liability exposure. Not recommended.",
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      aiScoredAt: new Date(Date.now() - 20 * 60 * 1000),
    },
  ];

  for (const bidData of bids) {
    const { id: bidId, ...rest } = bidData;
    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: rest.contractorId ?? "" },
    });

    await prisma.bid.upsert({
      where: { id: bidId },
      update: {},
      create: {
        id: bidId,
        projectId: project2.id,
        ...rest,
        contractorProfileId: contractorProfile?.id,
      },
    });
  }

  // Invitations for project 1
  await prisma.bidInvitation.upsert({
    where: { token: "token_invite_summit_1" },
    update: {},
    create: {
      id: "inv_summit_1",
      projectId: project1.id,
      contractorEmail: "summit@summitgc.com",
      contractorName: "Mike Torres",
      token: "token_invite_summit_1",
      status: "VIEWED",
      viewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.bidInvitation.upsert({
    where: { token: "token_invite_riverside_1" },
    update: {},
    create: {
      id: "inv_riverside_1",
      projectId: project1.id,
      contractorEmail: "info@riversidebuild.com",
      contractorName: "Chris Walsh",
      token: "token_invite_riverside_1",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✓ Sample properties and projects seeded");
  console.log("\n✅ Seed complete!");
  console.log("\nPublic bid portal URLs:");
  console.log("  http://localhost:3000/bid/token_invite_summit_1");
  console.log("  http://localhost:3000/bid/token_invite_riverside_1");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
