import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingPageComponent from '@/components/ui/loading';

describe('LoadingPageComponent', () => {
  it('renders without crashing', () => {
    const { container } = render(<LoadingPageComponent />);
    // Check for some skeleton elements (gray-200/300 bg)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
