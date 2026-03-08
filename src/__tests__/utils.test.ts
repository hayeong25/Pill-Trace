import { describe, it, expect } from 'vitest';
import { stripHtmlTags, formatPermitDate, normalizeDrugName } from '@/lib/utils';

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

  it('converts &nbsp; to regular space', () => {
    expect(stripHtmlTags('Hello&nbsp;World')).toBe('Hello World');
  });

  it('removes tags with attributes including event handlers', () => {
    expect(stripHtmlTags('<img src="x" onerror="alert(1)">')).toBe('');
    expect(stripHtmlTags('<a href="javascript:void(0)">click</a>')).toBe('click');
  });

  it('removes script tags and their content', () => {
    expect(stripHtmlTags('<script>alert(1)</script>safe')).toBe('safe');
    expect(stripHtmlTags('<script type="text/javascript">code()</script>text')).toBe('text');
  });

  it('removes style tags and their content', () => {
    expect(stripHtmlTags('<style>body{color:red}</style>text')).toBe('text');
  });

  it('handles unclosed tags', () => {
    expect(stripHtmlTags('text<br')).toBe('text<br');
  });

  it('decodes numeric HTML entities', () => {
    expect(stripHtmlTags('&#60;script&#62;')).toBe('<script>');
  });

  it('decodes &apos; entity', () => {
    expect(stripHtmlTags("it&apos;s")).toBe("it's");
  });

  it('decodes hex HTML entities', () => {
    expect(stripHtmlTags('&#x41;&#x42;')).toBe('AB');
  });

  it('handles multiple script tags', () => {
    expect(stripHtmlTags('a<script>x</script>b<script>y</script>c')).toBe('abc');
  });

  it('handles self-closing tags', () => {
    expect(stripHtmlTags('before<hr/>after')).toBe('beforeafter');
  });

  it('handles real-world Korean drug info HTML', () => {
    const html = '<p>이 약은 <b>해열</b>&middot;진통에 사용합니다.</p><p>두통, 치통</p>';
    const result = stripHtmlTags(html);
    expect(result).toContain('해열');
    expect(result).toContain('진통에 사용합니다.');
    expect(result).toContain('두통, 치통');
    expect(result).not.toContain('<');
  });

  it('handles whitespace-only input', () => {
    expect(stripHtmlTags('   ')).toBe('');
  });

  it('handles consecutive br tags', () => {
    expect(stripHtmlTags('A<br><br><br>B')).toBe('A\n\nB');
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

  it('returns 9-digit string as-is', () => {
    expect(formatPermitDate('202301150')).toBe('202301150');
  });

  it('returns alphabetic string as-is', () => {
    expect(formatPermitDate('abcdefgh')).toBe('abcdefgh');
  });

  it('formats boundary date 00000000', () => {
    expect(formatPermitDate('00000000')).toBe('0000.00.00');
  });
});

describe('normalizeDrugName', () => {
  it('converts 밀리그램 to mg', () => {
    expect(normalizeDrugName('타이레놀정500밀리그램')).toBe('타이레놀정500mg');
  });

  it('converts 마이크로그램 to mcg', () => {
    expect(normalizeDrugName('약품10마이크로그램')).toBe('약품10mcg');
  });

  it('converts 밀리리터 to ml', () => {
    expect(normalizeDrugName('시럽100밀리리터')).toBe('시럽100ml');
  });

  it('converts 그램 to g (after 밀리그램 replacement)', () => {
    expect(normalizeDrugName('약품5그램')).toBe('약품5g');
  });

  it('converts 리터 to l (after 밀리리터 replacement)', () => {
    expect(normalizeDrugName('용액1리터')).toBe('용액1l');
  });

  it('removes whitespace and lowercases', () => {
    expect(normalizeDrugName('Drug Name 100MG')).toBe('drugname100mg');
  });

  it('normalizes identical drugs with different unit formats', () => {
    expect(normalizeDrugName('타이레놀정500밀리그램(아세트아미노펜)'))
      .toBe(normalizeDrugName('타이레놀정500mg(아세트아미노펜)'));
  });

  it('handles empty string', () => {
    expect(normalizeDrugName('')).toBe('');
  });
});
