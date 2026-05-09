-- Update loan status when confirmed repayments cover approved amount
CREATE OR REPLACE FUNCTION update_loan_status_on_repayment()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC;
  approved_amount NUMERIC;
BEGIN
  IF NEW.status IS DISTINCT FROM 'CONFIRMED' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(amount), 0)
  INTO total_paid
  FROM "Repayment"
  WHERE "loanId" = NEW."loanId"
    AND "status" = 'CONFIRMED';

  SELECT "approvedAmount"
  INTO approved_amount
  FROM "Loan"
  WHERE "id" = NEW."loanId";

  IF total_paid >= approved_amount THEN
    UPDATE "Loan"
    SET "status" = 'PAID'
    WHERE "id" = NEW."loanId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "repayment_status_update_loan" ON "Repayment";
CREATE TRIGGER "repayment_status_update_loan"
AFTER INSERT OR UPDATE OF "status", "amount" ON "Repayment"
FOR EACH ROW
EXECUTE FUNCTION update_loan_status_on_repayment();
