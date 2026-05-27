-- CreateIndex
CREATE INDEX "ApplicationAttachment_applicationId_idx" ON "ApplicationAttachment"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_idx" ON "ApplicationStatusHistory"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_createdAt_idx" ON "ApplicationStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "DonorFund_donorId_idx" ON "DonorFund"("donorId");

-- CreateIndex
CREATE INDEX "DonorFund_createdAt_idx" ON "DonorFund"("createdAt");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "Loan"("status");

-- CreateIndex
CREATE INDEX "Loan_status_dueDate_idx" ON "Loan"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Loan_approvedAt_idx" ON "Loan"("approvedAt");

-- CreateIndex
CREATE INDEX "LoanApplication_status_idx" ON "LoanApplication"("status");

-- CreateIndex
CREATE INDEX "LoanApplication_borrowerId_idx" ON "LoanApplication"("borrowerId");

-- CreateIndex
CREATE INDEX "LoanApplication_createdAt_idx" ON "LoanApplication"("createdAt");

-- CreateIndex
CREATE INDEX "LoanFunding_loanId_idx" ON "LoanFunding"("loanId");

-- CreateIndex
CREATE INDEX "LoanFunding_donorFundId_idx" ON "LoanFunding"("donorFundId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_sentAt_idx" ON "Notification"("sentAt");

-- CreateIndex
CREATE INDEX "Repayment_loanId_idx" ON "Repayment"("loanId");

-- CreateIndex
CREATE INDEX "Repayment_status_idx" ON "Repayment"("status");

-- CreateIndex
CREATE INDEX "UserRole_verificationStatus_idx" ON "UserRole"("verificationStatus");

-- CreateIndex
CREATE INDEX "UserRole_documentsUpdatedAt_verificationRequestedAt_idx" ON "UserRole"("documentsUpdatedAt", "verificationRequestedAt");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_isVerified_idx" ON "users"("isVerified");
