import {beforeAll,describe,expect,it,vi} from 'vitest'
import {readFile} from 'node:fs/promises'
import type {Quote,QuoteItem} from '../types'
import {createQuotePdf,formatPdfMoney,validHex} from './pdf2'

let font:Uint8Array
beforeAll(async()=>{
  font=new Uint8Array(await readFile('public/fonts/NotoSans-Regular.ttf'))
  vi.stubGlobal('fetch',vi.fn(async(input:string)=>({arrayBuffer:async()=>input.includes('NotoSans')?font:new Uint8Array()})))
})

const row=(i:number):QuoteItem=>({id:String(i),description:`Uzun Türkçe ürün ve hizmet açıklaması ${i} ölçü çalışma çözümü`,quantity:'1',unit:'Hizmet',unitPrice:'100.25',discountRate:'5',vatRate:'20'})
const sample=(template?:Quote['template'],count=2):Quote=>({id:'q',number:'KT-TEST',issueDate:'2026-11-03',validUntil:'2026-12-03',company:{name:'Çok Uzun Şirket Ünvanı Çözüm Danışmanlık A.Ş.',phone:'555',email:'bilgi@ornek.com',address:'İstanbul',taxOffice:'Şişli',taxNumber:'123'},customer:{name:'Örnek Müşteri Şirketi',phone:'',email:'',address:'Ankara'},items:Array.from({length:count},(_,i)=>row(i)),notes:'Türkçe karakterler: ğüşiöç İĞÜŞÖÇ',terms:'Otuz gün içinde ödeme.',status:'Taslak',template,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()})

describe('professional PDFs',()=>{
  it.each(['modern','minimal','corporate','premium'] as const)('creates %s template',async template=>{
    const result=await createQuotePdf(sample(template))
    expect(result.blob.size).toBeGreaterThan(1000)
    expect(result.pageCount).toBeGreaterThan(0)
  })
  it('defaults old quotes to modern and paginates 50 rows',async()=>{
    const result=await createQuotePdf(sample(undefined,50))
    expect(result.pageCount).toBeGreaterThan(1)
  })
  it('paginates one extremely long row without failing',async()=>{
    const quote=sample('modern',1)
    quote.items[0].description='çokuzunboşluksuzürünkodu'.repeat(120)
    const result=await createQuotePdf(quote)
    expect(result.pageCount).toBeGreaterThan(1)
  })
  it('formats PDF money with Turkish separators and suffix',()=>{
    expect(formatPdfMoney('125000.75')).toBe('125.000,75 ₺')
  })
  it('validates six-digit HEX colors',()=>{
    expect(validHex('#123ABC')).toBe(true)
    expect(validHex('#fff')).toBe(false)
    expect(validHex('blue')).toBe(false)
  })
})
