import type {
  User,
  ContractorProfile,
  Property,
  PropertyPhoto,
  Project,
  ScopeOfWork,
  SowLineItem,
  BidInvitation,
  Bid,
  BidLineItem,
  Contract,
  ContractMilestone,
  BenchmarkDataPoint,
  Notification,
  UserRole,
  ProjectStatus,
  BidStatus,
  InvitationStatus,
  ContractStatus,
} from "@prisma/client";

export type {
  User,
  ContractorProfile,
  Property,
  PropertyPhoto,
  Project,
  ScopeOfWork,
  SowLineItem,
  BidInvitation,
  Bid,
  BidLineItem,
  Contract,
  ContractMilestone,
  BenchmarkDataPoint,
  Notification,
  UserRole,
  ProjectStatus,
  BidStatus,
  InvitationStatus,
  ContractStatus,
};

export type ProjectWithRelations = Project & {
  property: Property & { photos: PropertyPhoto[] };
  owner: User;
  scopeOfWork:
    | (ScopeOfWork & {
        lineItems: SowLineItem[];
      })
    | null;
  bids: BidWithRelations[];
  invitations: BidInvitation[];
  contract: Contract | null;
};

export type BidWithRelations = Bid & {
  lineItems: BidLineItem[];
  contractor: User | null;
  contractorProfile: ContractorProfile | null;
  invitation: BidInvitation | null;
};

export type ContractorWithProfile = User & {
  contractorProfile: ContractorProfile | null;
  submittedBids: Bid[];
};

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

export type ProjectFormData = {
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: string;
  squareFootage?: number;
  yearBuilt?: number;
  purchasePrice?: number;
  name: string;
  description?: string;
  budgetTarget?: number;
  bidDeadline?: string;
};

export type BidFormData = {
  contractorCompany: string;
  contractorName: string;
  contractorEmail: string;
  contractorPhone?: string;
  licenseNumber?: string;
  yearsExperience?: number;
  primaryTrade?: string;
  insuranceOnFile: boolean;
  lineItems: BidLineItemFormData[];
  proposedStartDate?: string;
  estimatedDays?: number;
  paymentTerms?: string;
  bidValidUntil?: string;
  exclusions?: string;
  allowances?: string;
  assumptions?: string;
  notes?: string;
};

export type BidLineItemFormData = {
  sowLineItemId?: string;
  sortOrder: number;
  category: string;
  description: string;
  unit?: string;
  quantity?: number;
  laborCost?: number;
  materialCost?: number;
  totalCost?: number;
  estimatedDays?: number;
  subcontracted: boolean;
  subcontractorName?: string;
  notes?: string;
};

export type InviteContractorData = {
  projectId: string;
  contractors: Array<{
    email: string;
    name: string;
  }>;
};

export type AiPhotoAnalysis = {
  overallCondition: "poor" | "fair" | "good";
  overallSummary: string;
  photos: Array<{
    photoIndex: number;
    tags: string[];
    severity: "low" | "medium" | "high";
    observation: string;
    likelyScopeItems: string[];
  }>;
  priorityItems: string[];
  estimatedScopeCategories: string[];
};

export type SowLineItemInput = {
  sortOrder: number;
  category: string;
  description: string;
  unit?: string;
  estimatedQty?: number;
  benchmarkLow?: number;
  benchmarkMid?: number;
  benchmarkHigh?: number;
  notes?: string;
  required: boolean;
};

export type ScoredBid = {
  bidId: string;
  compositeScore: number;
  aiBidVsBenchmark: number;
  aiHistoricalScore: number;
  aiRiskScore: number;
  isRecommended: boolean;
  rationale: string;
  lineItemFlags: Array<{
    sowLineItemId: string;
    flag: "GREEN" | "AMBER" | "RED" | "MISSING";
    deviationPct: number;
    reason: string;
  }>;
};

export type KpiData = {
  activeProjects: number;
  bidsThisMonth: number;
  avgAiScore: number;
  savedVsBenchmark: number;
  activeProjectsTrend: number;
  bidsThisMonthTrend: number;
  avgAiScoreTrend: number;
  savedVsBenchmarkTrend: number;
};

export type AnalyticsData = {
  bidVolumeByMonth: Array<{ month: string; count: number; amount: number }>;
  avgDeviationByMonth: Array<{ month: string; deviation: number }>;
  contractorScoreDistribution: Array<{ range: string; count: number }>;
  topContractors: Array<{
    id: string;
    name: string;
    company: string;
    score: number;
    trend: number;
    projects: number;
    totalValue: number;
  }>;
  categoryAccuracy: Array<{
    category: string;
    avgDeviation: number;
    bidCount: number;
  }>;
  aiStats: {
    bidsProcessed: number;
    avgScoringTimeMs: number;
    recommendationAcceptanceRate: number;
  };
  cumulativeSavings: Array<{ month: string; savings: number; cumulative: number }>;
};
