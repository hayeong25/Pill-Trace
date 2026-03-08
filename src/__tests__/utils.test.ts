import { describe, it, expect } from 'vitest';
import { stripHtmlTags, formatPermitDate } from '@/lib/utils';

describe('stripHtmlTags', () => {
  it('removes simple HTML tags', () => {
    expect(stripHtmlTags('<p>Hello</p>')).toBe('Hello');
  });

  it('converts <br> to newline', () => {
    expect(stripHtmlTags('Line1<br>Line2')).toBe('Line1\nLine2');
  });

  it('converts <br/> and <br /> to newline', () => {
    expect(stripHtmlTags('A<br/>B<br />C')).toBe('A\nB\nC');
  });

  it('converts </p> to newline', () => {
    expect(stripHtmlTags('<p>Para1</p><p>Para2</p>')).toBe('Para1\nPara2');
  });

  it('decodes HTML entities', () => {
    expect(stripHtmlTags('&amp; &lt; &gt; &quot; &#39;')).toBe("& < > \" '");
  });

  it('collapses excessive newlines', () => {
    expect(stripHtmlTags('A\n\n\n\nB')).toBe('A\n\nB');
  });

  it('trims whitespace', () => {
    expect(stripHtmlTags('  <p>text</p>  ')).toBe('text');
  });

  it('handles empty string', () => {
    expect(stripHtmlTags('')).toBe('');
  });

  it('handles nested tags', () => {
    expect(stripHtmlTags('<div><span>nested</span></div>')).toBe('nested');
  });

  it('handles mixed content with entities and tags', () => {
    expect(stripHtmlTags('<b>Bold</b> &amp; <i>Italic</i>')).toBe('Bold & Italic');
  });
});

describe('formatPermitDate', () => {
  it('formats 8-digit date string', () => {
    expect(formatPermitDate('20230115')).toBe('2023.01.15');
  });

  it('returns non-8-digit string as-is', () => {
    expect(formatPermitDate('2023-01-15')).toBe('2023-01-15');
  });

  it('returns short string as-is', () => {
    expect(formatPermitDate('202301')).toBe('202301');
  });

  it('returns empty string as-is', () => {
    expect(formatPermitDate('')).toBe('');
  });

  it('formats another 8-digit date', () => {
    expect(formatPermitDate('19991231')).toBe('1999.12.31');
  });
});
