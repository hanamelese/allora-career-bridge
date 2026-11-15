import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SelectionBar } from './SelectionBar.jsx';

describe('a selection question', () => {
  it('shows its choices from the start, with the bar still able to fold them away', () => {
    const html = renderToStaticMarkup(
      createElement(
        SelectionBar,
        { question: { label: 'Your level', language: 'en' }, summary: '', hasError: false },
        createElement('button', { 'data-option': true }, 'Beginner'),
      ),
    );

    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('Hide the choices');
    expect(html).not.toMatch(/fe-select__panel"[^>]*hidden/);
    expect(html).toContain('Beginner');
  });
});
