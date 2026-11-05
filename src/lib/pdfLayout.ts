export type TextMeasure = (text: string, size: number) => number

export const PDF_LAYOUT = {
  page: { width: 595, height: 842, margin: 38, footerTop: 52, contentBottom: 64 },
  type: { documentTitle: 18, sectionTitle: 7.2, tableHeader: 6.4, tableBody: 6.8, tableMeta: 6.1, body: 8, footer: 6.5 },
  table: {
    headerHeight: 24, headerGap: 9, lineHeight: 9.2, metaLineHeight: 8.2,
    paddingTop: 7, paddingBottom: 7, minRowHeight: 31,
    columns: [
      { key: 'number', label: 'No', width: 24, align: 'left' },
      { key: 'description', label: 'Ürün / Hizmet', width: 240, align: 'left' },
      { key: 'quantity', label: 'Miktar / Birim', width: 65, align: 'right' },
      { key: 'unitPrice', label: 'Birim Fiyat', width: 90, align: 'right' },
      { key: 'total', label: 'Tutar', width: 100, align: 'right' },
    ] as const,
  },
  spacing: { section: 14, block: 10 },
} as const

export const usablePageWidth = () => PDF_LAYOUT.page.width - PDF_LAYOUT.page.margin * 2
export const tableWidth = () => PDF_LAYOUT.table.columns.reduce((sum, column) => sum + column.width, 0)
export function columnPositions() { let x = PDF_LAYOUT.page.margin; return PDF_LAYOUT.table.columns.map(column => { const result = { ...column, x, right: x + column.width }; x += column.width; return result }) }

export function wrapMeasuredText(text: string, size: number, maxWidth: number, measure: TextMeasure): string[] {
  const result: string[] = []
  for (const paragraph of (text || '').split('\n')) {
    const words = paragraph.trim() ? paragraph.trim().split(/\s+/) : ['']
    let line = ''
    for (const rawWord of words) {
      let word = rawWord
      while (word && measure(word, size) > maxWidth) {
        let end = 1
        while (end < word.length && measure(word.slice(0, end + 1), size) <= maxWidth) end += 1
        if (line) result.push(line)
        result.push(word.slice(0, end)); word = word.slice(end); line = ''
      }
      if (!word) continue
      const candidate = line ? `${line} ${word}` : word
      if (measure(candidate, size) <= maxWidth) line = candidate
      else { if (line) result.push(line); line = word }
    }
    if (line) result.push(line)
    else if (!paragraph.trim()) result.push('')
  }
  return result.length ? result : ['—']
}

export function calculateRowHeight(descriptionLineCount: number, includeMeta = true) {
  const contentHeight = descriptionLineCount * PDF_LAYOUT.table.lineHeight + (includeMeta ? PDF_LAYOUT.table.metaLineHeight : 0)
  return Math.max(PDF_LAYOUT.table.minRowHeight, PDF_LAYOUT.table.paddingTop + contentHeight + PDF_LAYOUT.table.paddingBottom)
}

export function fittingFontSize(text: string, maxWidth: number, measure: TextMeasure, preferred: number = PDF_LAYOUT.type.tableBody, minimum: number = 5.4) {
  let size = preferred
  while (size > minimum && measure(text, size) > maxWidth) size -= .2
  return Math.max(minimum, Number(size.toFixed(1)))
}
