import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../../src/components/UnitToggle';

describe('UnitToggle', () => {
  it('inicia em Celsius e permite mudar unidade por teclado', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);
    const celsius = screen.getByRole('radio', { name: 'Celsius (°C)' });
    const fahrenheit = screen.getByRole('radio', { name: 'Fahrenheit (°F)' });
    expect(celsius).toBeChecked();
    expect(fahrenheit).not.toBeChecked();
    celsius.focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('fahrenheit');
    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    expect(fahrenheit).toBeChecked();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('celsius');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
