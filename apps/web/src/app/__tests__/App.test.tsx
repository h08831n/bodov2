import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import App from '../App';

describe('Web App Component', () => {
  it('renders navbar, current database badge, and sales module by default', () => {
    render(<App />);
    expect(screen.getByText('bodo')).toBeInTheDocument();
    expect(screen.getByText('erp_dev')).toBeInTheDocument();
    expect(screen.getAllByText('فروش و پیش‌فاکتورها').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('پیش‌فاکتور جدید')).toBeInTheDocument();
  });

  it('toggles theme when dark mode button is clicked', () => {
    render(<App />);
    const themeButton = screen.getByTitle(/تغییر حالت شب\/روز/i);
    expect(themeButton).toBeInTheDocument();

    const initialDark = document.documentElement.classList.contains('dark');
    fireEvent.click(themeButton);
    expect(document.documentElement.classList.contains('dark')).toBe(!initialDark);
  });

  it('opens Odoo app switcher grid when 9-dots button is clicked', () => {
    render(<App />);
    const appGridButton = screen.getByTitle(/شبکه برنامه‌ها \(App Switcher\)/i);
    fireEvent.click(appGridButton);
    expect(screen.getByText('شبکه برنامه‌های bodo ERP')).toBeInTheDocument();
  });
});
