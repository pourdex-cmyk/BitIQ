-- Enable Row Level Security
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bid" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContractorProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScopeOfWork" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BidInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contract" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Beantown staff can see and modify all projects
CREATE POLICY "beantown_all_projects" ON "Project" FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."supabaseId" = auth.uid()::text
    AND u.role IN ('BEANTOWN_ADMIN','BEANTOWN_PM','BEANTOWN_PRINCIPAL','BEANTOWN_FINANCE')
  )
);

-- Beantown staff can see all bids
CREATE POLICY "beantown_all_bids" ON "Bid" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."supabaseId" = auth.uid()::text
    AND u.role IN ('BEANTOWN_ADMIN','BEANTOWN_PM','BEANTOWN_PRINCIPAL','BEANTOWN_FINANCE')
  )
);

-- Contractors can see only their own bids
CREATE POLICY "contractor_own_bids" ON "Bid" FOR ALL USING (
  "contractorEmail" = (
    SELECT email FROM "User" WHERE "supabaseId" = auth.uid()::text
  )
);

-- Users can see their own profile
CREATE POLICY "own_user_profile" ON "User" FOR SELECT USING (
  "supabaseId" = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."supabaseId" = auth.uid()::text
    AND u.role IN ('BEANTOWN_ADMIN','BEANTOWN_PM','BEANTOWN_PRINCIPAL','BEANTOWN_FINANCE')
  )
);

-- Beantown staff see all contractor profiles
CREATE POLICY "beantown_contractor_profiles" ON "ContractorProfile" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."supabaseId" = auth.uid()::text
    AND u.role IN ('BEANTOWN_ADMIN','BEANTOWN_PM','BEANTOWN_PRINCIPAL','BEANTOWN_FINANCE')
  )
);

-- Own notifications
CREATE POLICY "own_notifications" ON "Notification" FOR ALL USING (
  "userId" = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
);
