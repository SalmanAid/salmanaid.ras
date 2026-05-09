import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/hooks/applicationProgressStore', () => ({
  useApplicationProgressStore: vi.fn(),
}));

import { useApplicationProgressStore } from '@/hooks/applicationProgressStore';
import ApplicantForm_PersonalInformationSection from '@/components/ui/applicant-form/personal_information_section';

describe('ApplicantForm_PersonalInformationSection', () => {
  it('renders input fields with correct values from store', () => {
    (useApplicationProgressStore as any).mockImplementation((selector: any) => {
        const state = {
            application_progress: { step: 1 },
            full_name: 'John Doe',
            university_name: 'ITB',
            student_id_number: '123',
        };
        return selector(state);
    });

    render(<ApplicantForm_PersonalInformationSection />);
    
    expect(screen.getByDisplayValue('John Doe')).toBeDefined();
    expect(screen.getByDisplayValue('ITB')).toBeDefined();
    expect(screen.getByDisplayValue('123')).toBeDefined();
  });

  it('calls setFullName when name input changes', () => {
    const setFullName = vi.fn();
    (useApplicationProgressStore as any).mockImplementation((selector: any) => {
        const state = {
            application_progress: { step: 1 },
            full_name: '',
            setFullName,
        };
        return selector(state);
    });

    render(<ApplicantForm_PersonalInformationSection />);
    
    const input = screen.getByPlaceholderText(/masukkan nama anda/i);
    fireEvent.change(input, { target: { value: 'Jane Doe' } });
    
    expect(setFullName).toHaveBeenCalledWith('Jane Doe');
  });
});
