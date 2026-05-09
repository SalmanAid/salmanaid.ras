import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorComponent from '@/components/ui/error';

describe('ErrorComponent', () => {
  it('renders default message when no props provided', () => {
    render(<ErrorComponent />);
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('We couldn’t load the data. Please try again.')).toBeDefined();
  });

  it('renders custom title and message', () => {
    render(<ErrorComponent title="Custom Title" message="Custom Message" />);
    expect(screen.getByText('Custom Title')).toBeDefined();
    expect(screen.getByText('Custom Message')).toBeDefined();
  });

  it('calls onRetry when button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorComponent onRetry={onRetry} />);
    
    const button = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(button);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
