import {describe,expect,it} from 'vitest'
import {PDF_LAYOUT,calculateRowHeight,columnPositions,fittingFontSize,tableWidth,usablePageWidth,wrapMeasuredText} from './pdfLayout'

const measure=(text:string,size:number)=>text.length*size*.52

describe('PDF layout system',()=>{
  it('keeps all table columns inside the usable A4 width',()=>{
    expect(tableWidth()).toBe(usablePageWidth())
    const columns=columnPositions()
    expect(columns[0].x).toBe(PDF_LAYOUT.page.margin)
    expect(columns.at(-1)?.right).toBe(PDF_LAYOUT.page.width-PDF_LAYOUT.page.margin)
  })
  it('grows row height from measured description lines',()=>{
    expect(calculateRowHeight(4)).toBeGreaterThan(calculateRowHeight(1))
    expect(calculateRowHeight(1)).toBeGreaterThanOrEqual(PDF_LAYOUT.table.minRowHeight)
  })
  it('wraps normal text without exceeding its cell',()=>{
    const lines=wrapMeasuredText('Çok uzun Türkçe ürün ve hizmet açıklaması ölçüm çözümü',7,90,measure)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.every(line=>measure(line,7)<=90)).toBe(true)
  })
  it('splits long words without losing characters',()=>{
    const word='kesintisizçokuzunürünkodutanımlaması1234567890'
    const lines=wrapMeasuredText(word,7,55,measure)
    expect(lines.join('')).toBe(word)
    expect(lines.every(line=>measure(line,7)<=55)).toBe(true)
  })
  it('fits large financial values within numeric cells',()=>{
    const value='999.999.999.999,99 ₺'
    const size=fittingFontSize(value,90,measure,6.8,5.4)
    expect(size).toBeGreaterThanOrEqual(5.4)
    expect(measure(value,size)).toBeLessThanOrEqual(90)
  })
})
