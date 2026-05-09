import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SummaryOfAspect from '@/components/ui/admin-dashboard/summary_of_aspect';
import { DollarSign } from 'lucide-react';

describe('SummaryOfAspect', () => {
  it('renders all information correctly', () => {
    render(
      <SummaryOfAspect
        title="Test Title"
        value="Rp 1.000.000"
        update_caption="+10%"
        icon={DollarSign}
        icon_bg_color="#000"
        value_color="#000"
        update_caption_color="#000"
      />
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Rp 1.000.000')).toBeDefined();
    expect(screen.getByText('+10%')).toBeDefined();
  });
});
