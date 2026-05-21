import { describe, it, expect, beforeEach } from 'vitest';
import { useApplicationProgressStore } from '@/hooks/applicationProgressStore';
import { act, renderHook } from '@testing-library/react';

describe('useApplicationProgressStore', () => {
  beforeEach(() => {
    act(() => {
      useApplicationProgressStore.setState({
        application_progress: { step: 1 },
        full_name: "",
        university_name: "",
        student_id_number: "",
        loan_title: "",
        requested_amount: 0,
        loan_purpose: "",
        student_id_card: null,
        family_card: null,
        comply_to_terms_and_agreement: false,
      });
    });
  });

  it('should increment and decrement steps within bounds', () => {
    const { result } = renderHook(() => useApplicationProgressStore());

    act(() => { result.current.incrementStep(); });
    expect(result.current.application_progress?.step).toBe(2);

    act(() => { result.current.incrementStep(); });
    act(() => { result.current.incrementStep(); });
    expect(result.current.application_progress?.step).toBe(3);

    act(() => { result.current.incrementStep(); }); // Should stay at 3
    expect(result.current.application_progress?.step).toBe(3);

    act(() => { result.current.decrementStep(); });
    expect(result.current.application_progress?.step).toBe(2);
  });

  it('should update personal information', () => {
    const { result } = renderHook(() => useApplicationProgressStore());

    act(() => {
      result.current.setFullName("John Doe");
      result.current.setUniversityName("ITB");
    });

    expect(result.current.full_name).toBe("John Doe");
    expect(result.current.university_name).toBe("ITB");
  });
});
