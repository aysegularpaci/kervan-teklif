import {mkdir,readFile,writeFile} from 'node:fs/promises'
import type {Quote,QuoteItem} from '../src/types'

const nativeFetch=globalThis.fetch
const font=await readFile('public/fonts/NotoSans-Regular.ttf')
globalThis.fetch=(async(input:any,init?:any)=>String(input).includes('NotoSans-Regular.ttf')?new Response(font):nativeFetch(input,init)) as typeof fetch
const {createQuotePdf}=await import('../src/lib/pdf2')
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+7RUT8QAAAABJRU5ErkJggg=='

const items:QuoteItem[]=Array.from({length:50},(_,i)=>({
  id:String(i),
  description:i===7
    ?`Boşluksuz ürün kodu: ${'KERVAN-ÇÖZÜM-1234567890'.repeat(32)}`
    :i===18
      ?`Tek bir satırda çok uzun açıklama: ${'Kurulum, ölçüm, analiz, danışmanlık ve uygulama sonrası destek hizmetlerini kapsayan ayrıntılı Türkçe açıklama. '.repeat(22)}`
      :`${i+1}. satır - Ölçüm, danışmanlık, uygulama ve Türkçe karakter kontrolü: ğüşiöç İĞÜŞÖÇ.`,
  quantity:i%7===0?'999,999':i%3===0?'0,125':'2',
  unit:i%2?'Hizmet':'Saat',
  unitPrice:i===11?'999999999.99':i%4===0?'1.234,56':'987.65',
  discountRate:i%5===0?'12.5':'0',
  vatRate:(['0','1','10','20'] as const)[i%4],
}))

await mkdir('output/pdf/qa',{recursive:true})
for(const template of ['modern','minimal','corporate','premium'] as const){
  const q:Quote={
    id:template,number:`KT-QA-${template.toUpperCase()}-2026-ÇOK-UZUN-NUMARA`,issueDate:'2026-11-03',validUntil:'2026-12-15',
    subject:'Kurumsal Dönüşüm, Danışmanlık ve Uygulama Hizmetleri Teklifi',
    description:'Uzun unvanlar, büyük fiyatlar, kesintisiz kelimeler ve çok sayfalı satırlar için yerleşim kalite kontrolü.',
    company:{name:'KERVAN GRUP DANIŞMANLIK ANONİM ŞİRKETİ - ÇOK UZUN FİRMA ÜNVANI TESTİ',phone:'+90 312 000 00 00',email:'bilgi@kervangrup.example',address:'Ragıp Tüzün Mahallesi İvedik Caddesi Çok Uzun Açık Adres Bilgisi Yenimahalle / Ankara',taxOffice:'Yenimahalle',taxNumber:'1234567890',logo:png,signature:png,stamp:png,showSignature:true,showBankDetails:true,bankName:'Örnek Katılım Bankası',iban:'TR00 0000 0000 0000 0000 0000 00',contactName:'Ayşe Örnek',contactTitle:'Genel Müdür'},
    customer:{name:'ÇOK UZUN MÜŞTERİ VE TİCARET ANONİM ŞİRKETİ ÜNVANI TESTİ',phone:'+90 212 000 00 00',email:'satinalma@musteri.example',address:'Uzun müşteri adresi Organize Sanayi Bölgesi İstanbul'},
    items,notes:'Bu teklif yalnızca belirtilen kapsam için geçerlidir. '.repeat(35),terms:'Ödeme, sözleşme tarihinden itibaren 30 gün içinde banka havalesi ile yapılacaktır. '.repeat(22),deliveryTime:'Sipariş onayından itibaren 15 iş günü',warrantyTerms:'Teslim tarihinden itibaren 12 ay hizmet garantisi.',otherTerms:'Kapsam dışı talepler ayrıca fiyatlandırılır. '.repeat(18),preparedBy:'Ayşe Örnek',status:'Gönderildi',template,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
  }
  const result=await createQuotePdf(q)
  await writeFile(`output/pdf/qa/${template}-stress.pdf`,new Uint8Array(await result.blob.arrayBuffer()))
  console.log(template,result.pageCount,result.blob.size)
}
