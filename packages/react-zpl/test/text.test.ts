import { describe, expect, it } from 'vitest';
import { measureText, wrapText } from '../src/text/font0';

describe('font 0 text', () => {
  it('measures with calibrated widths', () => {
    // H=0.6083, i=0.2583 of the font width
    expect(measureText('Hi', 100)).toBeCloseTo(86.66, 1);
  });

  it('wraps on words and splits long words', () => {
    const opts = { maxWidth: 100, fontWidth: 20, wrap: true };
    expect(wrapText('one two three four', opts)).toEqual(['one two', 'three four']);
    expect(wrapText('ABCDEFGHIJKLMNOP', opts)).toEqual(['ABCDEFGHI', 'JKLMNOP']);
    expect(wrapText('a\nb', opts)).toEqual(['a', 'b']);
  });

  it('clamps lines with an ellipsis', () => {
    const lines = wrapText('one two three four five six', { maxWidth: 100, fontWidth: 20, wrap: true, maxLines: 2, ellipsis: true });
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('...')).toBe(true);
    expect(measureText(lines[1], 20)).toBeLessThanOrEqual(100);
  });
});

describe('template placeholders', () => {
  it('keeps placeholders as written under text transforms', async () => {
    const { transformText } = await import('../src/text/font0');
    expect(transformText('ship to {{to.name}} now', 'uppercase')).toBe('SHIP TO {{to.name}} NOW');
    expect(transformText('{{a}}b c', 'capitalize')).toBe('{{a}}b C');
  });
  it('does not split a placeholder across lines', async () => {
    const { wrapText } = await import('../src/text/font0');
    const lines = wrapText('{{customer.company.name}}', { maxWidth: 40, fontWidth: 20, wrap: true });
    expect(lines).toEqual(['{{customer.company.name}}']);
  });
});
