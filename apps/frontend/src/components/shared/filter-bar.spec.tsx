import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar, SearchInput, FilterSelect } from './filter-bar';

describe('FilterBar', () => {
  it('renders children', () => {
    render(
      <FilterBar>
        <span>filter content</span>
      </FilterBar>,
    );
    expect(screen.getByText('filter content')).toBeInTheDocument();
  });
});

describe('SearchInput', () => {
  it('renders with placeholder', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Buscar..." />);
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalledWith('test');
  });
});

describe('FilterSelect', () => {
  const options = [
    { value: 'A', label: 'Option A' },
    { value: 'B', label: 'Option B' },
  ];

  it('renders placeholder option', () => {
    render(<FilterSelect value="" onChange={() => {}} options={options} placeholder="Todos" />);
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<FilterSelect value="" onChange={() => {}} options={options} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('calls onChange on selection', () => {
    const onChange = vi.fn();
    render(<FilterSelect value="" onChange={onChange} options={options} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'A' } });
    expect(onChange).toHaveBeenCalledWith('A');
  });
});
