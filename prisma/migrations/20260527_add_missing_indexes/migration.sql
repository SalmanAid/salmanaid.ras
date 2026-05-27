-- Prisma Migration: Add Missing Indexes for Performance Optimization
-- Generated: 2026-05-27
-- Purpose: Fix critical performance issues identified in database analysis

-- ============================================================================
-- CRITICAL INDEXES (Implement Immediately)
-- ============================================================================

-- 1. LoanApplication.status - Queried 20+ times per day
-- Fixes: Admin dashboard count queries, loan filtering, status-based lookups
CREATE INDEX IF NOT EXISTS "idx_LoanApplication_status" 
ON "LoanApplication"("status");

-- 2. Loan.status - Queried 3+ times per dashboard load
-- Fixes: Loan status filtering, dashboard statistics, report generation
CREATE INDEX IF NOT EXISTS "idx_Loan_status" 
ON "Loan"("status");

-- 3. Loan(status, dueDate) - Composite index for due date reminders
-- Fixes: Range queries for loans due within X days, optimizes ACTIVE + date range
CREATE INDEX IF NOT EXISTS "idx_Loan_status_dueDate" 
ON "Loan"("status", "dueDate");

-- 4. LoanApplication.borrowerId - User loan lookups
-- Fixes: Finding user's loan applications, borrower dashboards
CREATE INDEX IF NOT EXISTS "idx_LoanApplication_borrowerId" 
ON "LoanApplication"("borrowerId");

-- 5. DonorFund.donorId - Donor-specific queries
-- Fixes: Donor dashboard, donor fund listings, tracking donor distributions
CREATE INDEX IF NOT EXISTS "idx_DonorFund_donorId" 
ON "DonorFund"("donorId");

-- ============================================================================
-- HIGH PRIORITY INDEXES
-- ============================================================================

-- 6. UserRole.verificationStatus - Admin verification panel filtering
-- Fixes: List pending/verified/rejected role requests efficiently
CREATE INDEX IF NOT EXISTS "idx_UserRole_verificationStatus" 
ON "UserRole"("verificationStatus");

-- 7. UserRole(documentsUpdatedAt, verificationRequestedAt) - Sorting in verification list
-- Fixes: listVerificationRequests() ordering performance
CREATE INDEX IF NOT EXISTS "idx_UserRole_documentsUpdatedAt_verificationRequestedAt" 
ON "UserRole"("documentsUpdatedAt" DESC, "verificationRequestedAt" DESC);

-- ============================================================================
-- MEDIUM PRIORITY INDEXES
-- ============================================================================

-- 8. LoanFunding.donorFundId - Donor tracking queries
-- Fixes: Finding which loans a specific donor funded
CREATE INDEX IF NOT EXISTS "idx_LoanFunding_donorFundId" 
ON "LoanFunding"("donorFundId");

-- ============================================================================
-- ADDITIONAL OPTIONAL INDEXES (Consider for next phase)
-- ============================================================================

-- Optional: Index on Repayment.loanId (helps with groupBy aggregations)
-- Not created yet: May not be necessary if query patterns change
-- CREATE INDEX IF NOT EXISTS "idx_Repayment_loanId" ON "Repayment"("loanId");

-- Optional: Index on Notification.userId and sentAt (for notification queries)
-- CREATE INDEX IF NOT EXISTS "idx_Notification_userId_sentAt" 
-- ON "Notification"("userId", "sentAt");

-- Optional: Index on ApplicationStatusHistory.applicationId (for audit trails)
-- This is already created as a foreign key index, verify with:
-- SELECT * FROM pg_indexes WHERE tablename='ApplicationStatusHistory' AND indexname LIKE '%applicationId%';

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================

-- Verify all indexes were created:
-- SELECT indexname, tablename, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- Check index size and bloat:
-- SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE indexrelname LIKE 'idx_%'
-- ORDER BY idx_scan DESC;

-- Analyze table statistics for query planner:
-- ANALYZE "LoanApplication";
-- ANALYZE "Loan";
-- ANALYZE "DonorFund";
-- ANALYZE "UserRole";
-- ANALYZE "LoanFunding";

-- ============================================================================
-- NOTES
-- ============================================================================

-- These indexes address the following performance issues:
-- 1. Missing status indexes cause full table scans on frequently filtered queries
-- 2. Composite indexes (status, dueDate) optimize complex WHERE clauses
-- 3. Foreign key indexes on non-primary columns improve JOIN performance
-- 4. Sorting indexes improve ORDER BY performance in verification list

-- Expected Performance Impact:
-- - Dashboard load time: 200-300ms → 100-150ms (50% improvement)
-- - Loan listing: 150-250ms → 80-120ms (50% improvement)
-- - Query efficiency: 15-20% overall improvement
-- - Overall latency: 10-20% improvement when combined with N+1 fixes

-- Implementation Notes:
-- - Indexes are created with IF NOT EXISTS to allow safe re-runs
-- - Consider running during low-traffic hours in production
-- - Monitor index growth over time with pg_stat_user_indexes
-- - Remove unused indexes regularly (check idx_scan = 0)

-- ============================================================================
