import { describe, it, expect, beforeEach } from 'vitest';
import { useDonationStore } from '@/hooks/donationStore';
import { act, renderHook } from '@testing-library/react';

describe('useDonationStore', () => {
  beforeEach(() => {
    act(() => {
      useDonationStore.setState({
        donation: {
          amount: 0,
          payment_method: "",
          va_bank: ""
        },
        step: 1
      });
    });
  });

  it('should update donation details', () => {
    const { result } = renderHook(() => useDonationStore());

    act(() => {
      result.current.setAmount(500000);
      result.current.setPaymentMethod("VA");
      result.current.setVABank("BCA");
    });

    expect(result.current.donation.amount).toBe(500000);
    expect(result.current.donation.payment_method).toBe("VA");
    expect(result.current.donation.va_bank).toBe("BCA");
  });
});
