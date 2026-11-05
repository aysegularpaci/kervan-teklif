import {PDFDocument,PDFImage,PDFFont,PDFPage,rgb} from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type {Quote} from '../types'
import {calculateQuote,normalizeNumber} from './calculations'
import {safeFilename} from './share'
import {PDF_LAYOUT,calculateRowHeight,columnPositions,fittingFontSize,tableWidth,usablePageWidth,wrapMeasuredText} from './pdfLayout'

type Template='modern'|'minimal'|'corporate'|'premium';type Color=[number,number,number];type Theme={accent:Color;dark:Color;muted:Color;head:Color}
const themes:Record<Template,Theme>={modern:{accent:[.04,.38,.72],dark:[.05,.1,.2],muted:[.37,.42,.5],head:[.93,.96,.99]},minimal:{accent:[.18,.18,.18],dark:[.05,.05,.05],muted:[.42,.42,.42],head:[.97,.97,.97]},corporate:{accent:[.08,.25,.42],dark:[.04,.12,.22],muted:[.35,.4,.46],head:[.88,.92,.95]},premium:{accent:[.72,.53,.17],dark:[.03,.09,.17],muted:[.37,.4,.45],head:[.96,.94,.88]}}
export const validHex=(v?:string)=>!!v&&/^#[0-9a-f]{6}$/i.test(v)
const color=(v:Color)=>rgb(...v),hex=(v:string):Color=>[parseInt(v.slice(1,3),16)/255,parseInt(v.slice(3,5),16)/255,parseInt(v.slice(5),16)/255]
const trDate=(v:string)=>{const d=new Date(v);return Number.isNaN(d.valueOf())?'—':new Intl.DateTimeFormat('tr-TR').format(d)}
export const formatPdfMoney=(v:string)=>`${new Intl.NumberFormat('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v))} ₺`
async function image(pdf:PDFDocument,data?:string){if(!data)return;try{const bytes=await fetch(data).then(r=>r.arrayBuffer());return data.startsWith('data:image/png')?pdf.embedPng(bytes):pdf.embedJpg(bytes)}catch{return}}

export async function createQuotePdf(q:Quote):Promise<{blob:Blob;filename:string;pageCount:number}>{
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit)
 const bytes=await fetch(`${import.meta.env.BASE_URL}fonts/NotoSans-Regular.ttf`).then(r=>r.arrayBuffer()),font=await pdf.embedFont(bytes,{subset:true})
 const template:Template=q.template||'modern',base=themes[template],theme={...base,accent:validHex(q.accentColor)?hex(q.accentColor!):base.accent}
 const logo=await image(pdf,q.company.logo),signature=q.company.showSignature?await image(pdf,q.company.signature):undefined,stamp=q.company.showSignature?await image(pdf,q.company.stamp):undefined,totals=calculateQuote(q.items)
 const {width:W,height:H,margin:M,contentBottom}=PDF_LAYOUT.page,measure=(s:string,size:number)=>font.widthOfTextAtSize(s,size),wrap=(s:string,size:number,width:number)=>wrapMeasuredText(s,size,width,measure)
 let page!:PDFPage,y=0
 const txt=(s:string,x:number,yy:number,size:number=PDF_LAYOUT.type.body,c:Color=theme.muted)=>page.drawText(s,{x,y:yy,size,font,color:color(c)})
 const right=(s:string,x:number,yy:number,size:number=PDF_LAYOUT.type.tableBody,c:Color=theme.dark)=>txt(s,x-measure(s,size),yy,size,c)
 const fitImage=(img:PDFImage,x:number,yy:number,maxW:number,maxH:number)=>{const scale=Math.min(maxW/img.width,maxH/img.height);page.drawImage(img,{x,y:yy-img.height*scale,width:img.width*scale,height:img.height*scale})}
 const ellipsis=(s:string,width:number,size:number)=>{if(measure(s,size)<=width)return s;let r=s;while(r.length>1&&measure(`${r}…`,size)>width)r=r.slice(0,-1);return`${r}…`}

 const title=()=>{
  if(template==='modern'){page.drawRectangle({x:0,y:H-112,width:W,height:112,color:color(theme.dark)});if(logo)fitImage(logo,M,H-28,90,45);else txt(ellipsis(q.company.name,285,13),M,H-50,13,[1,1,1]);right('FİYAT TEKLİFİ',W-M,H-48,20,[1,1,1])}
  else if(template==='minimal'){if(logo)fitImage(logo,M,H-28,85,42);else txt(ellipsis(q.company.name,285,12),M,H-45,12,theme.dark);right('FİYAT TEKLİFİ',W-M,H-44,17,theme.dark);page.drawLine({start:{x:M,y:H-65},end:{x:W-M,y:H-65},thickness:.6,color:color(theme.dark)})}
  else if(template==='corporate'){page.drawRectangle({x:M,y:H-82,width:usablePageWidth(),height:49,borderColor:color(theme.accent),borderWidth:1});if(logo)fitImage(logo,M+10,H-43,90,31);else txt(ellipsis(q.company.name,285,11),M+10,H-58,11,theme.dark);right('FİYAT TEKLİFİ',W-M-10,H-58,15,theme.dark)}
  else{page.drawRectangle({x:0,y:H-105,width:W,height:105,color:color(theme.dark)});page.drawRectangle({x:0,y:H-108,width:W,height:3,color:color(theme.accent)});if(logo)fitImage(logo,M,H-27,90,43);else txt(ellipsis(q.company.name,285,12),M,H-50,12,[1,1,1]);right('FİYAT TEKLİFİ',W-M,H-50,18,theme.accent)}
  y=H-(template==='minimal'?85:130);txt(ellipsis(`Teklif No  ${q.number}`,165,8),M,y,8,theme.dark);txt(`Tarih  ${trDate(q.issueDate)}`,220,y,8);right(`Geçerlilik  ${trDate(q.validUntil)}`,W-M,y,8);y-=24
 }
 const newPage=()=>{page=pdf.addPage([W,H]);title()}
 const infoBlock=(heading:string,values:string[],x:number,width:number)=>{const lines=values.filter(Boolean).flatMap(v=>wrap(v,7,width-16)),height=25+lines.length*10;page.drawRectangle({x,y:y-height+8,width,height,color:color(theme.head),borderColor:template==='corporate'?color(theme.accent):color(theme.head),borderWidth:template==='corporate'?1:0});txt(heading,x+8,y-9,7,theme.accent);lines.forEach((line,i)=>txt(line,x+8,y-23-i*10,7,theme.dark));return height}
 const columns=columnPositions()
 const tableHeader=()=>{const h=PDF_LAYOUT.table.headerHeight;page.drawRectangle({x:M,y:y-h,width:tableWidth(),height:h,color:color(theme.head)});columns.forEach(col=>col.align==='right'?right(col.label,col.right-5,y-16,PDF_LAYOUT.type.tableHeader,theme.dark):txt(col.label,col.x+5,y-16,PDF_LAYOUT.type.tableHeader,theme.dark));page.drawLine({start:{x:M,y:y-h},end:{x:M+tableWidth(),y:y-h},thickness:template==='minimal'?.4:1,color:color(theme.accent)});y-=h+PDF_LAYOUT.table.headerGap}
 const newTablePage=()=>{newPage();tableHeader()}

 newPage()
 const giver=[q.company.name,q.company.address,[q.company.phone,q.company.email].filter(Boolean).join(' · '),[q.company.taxOffice,q.company.taxNumber].filter(Boolean).join(' / ')],receiver=[q.customer.name,q.customer.address,[q.customer.phone,q.customer.email].filter(Boolean).join(' · ')],gap=19,blockW=(usablePageWidth()-gap)/2
 const infoH=Math.max(infoBlock('TEKLİFİ VEREN',giver,M,blockW),infoBlock('SAYIN / TEKLİF ALAN',receiver,M+blockW+gap,blockW));y-=infoH+PDF_LAYOUT.spacing.block
 if(q.subject){txt('TEKLİF KONUSU',M,y,PDF_LAYOUT.type.sectionTitle,theme.accent);y-=14;for(const line of wrap(q.subject,10,usablePageWidth())){txt(line,M,y,10,theme.dark);y-=12}for(const line of wrap(q.description||'',8,usablePageWidth())){txt(line,M,y,8);y-=10}y-=7}
 tableHeader()

 q.items.forEach((item,index)=>{let lines=wrap(item.description,PDF_LAYOUT.type.tableBody,columns[1].width-10),first=true;while(lines.length){const available=y-contentBottom,maxLines=Math.max(0,Math.floor((available-PDF_LAYOUT.table.paddingTop-PDF_LAYOUT.table.paddingBottom)/PDF_LAYOUT.table.lineHeight));if(maxLines<1){newTablePage();continue}const includeMeta=lines.length+1<=maxLines,take=Math.min(lines.length,includeMeta?maxLines-1:maxLines),chunk=lines.splice(0,Math.max(1,take)),rowH=calculateRowHeight(chunk.length,includeMeta);if(y-rowH<contentBottom){lines.unshift(...chunk);newTablePage();continue}const baseline=y-PDF_LAYOUT.table.paddingTop-PDF_LAYOUT.type.tableBody;txt(first?String(index+1):'devam',columns[0].x+3,baseline,first?PDF_LAYOUT.type.tableBody:5.5,theme.muted);chunk.forEach((line,i)=>txt(line,columns[1].x+5,baseline-i*PDF_LAYOUT.table.lineHeight,PDF_LAYOUT.type.tableBody,theme.dark));if(includeMeta)txt(`İndirim: %${item.discountRate||0}   ·   KDV: %${item.vatRate}`,columns[1].x+5,baseline-chunk.length*PDF_LAYOUT.table.lineHeight,PDF_LAYOUT.type.tableMeta,theme.muted);if(first){const p=normalizeNumber(item.unitPrice,2)?.toFixed(2)||'0.00',values=[`${item.quantity} ${item.unit}`,formatPdfMoney(p),formatPdfMoney(totals.items[index].total)];[columns[2],columns[3],columns[4]].forEach((col,i)=>{const size=fittingFontSize(values[i],col.width-10,measure);right(values[i],col.right-5,baseline,size,theme.dark)})}page.drawLine({start:{x:M,y:y-rowH+3},end:{x:M+tableWidth(),y:y-rowH+3},thickness:.35,color:color([.84,.86,.89])});y-=rowH;first=false;if(lines.length)newTablePage()}})

 const ensure=(need:number)=>{if(y-need<contentBottom)newPage()};ensure(160)
 const sw=230,sx=W-M-sw;page.drawRectangle({x:sx,y:y-93,width:sw,height:102,color:color(theme.head)});const summary=[['İndirim öncesi toplam',totals.gross],['Toplam indirim',`-${totals.discount}`],['KDV hariç toplam',totals.net],['Toplam KDV',totals.vat]];summary.forEach(([label,value],i)=>{txt(label,sx+10,y-i*18,7);const shown=value.startsWith('-')?`-${formatPdfMoney(value.slice(1))}`:formatPdfMoney(value);right(shown,sx+sw-10,y-i*18,fittingFontSize(shown,95,measure,7,5.6),theme.dark)});y-=109;page.drawRectangle({x:sx,y:y-5,width:sw,height:34,color:color(theme.accent)});txt('GENEL TOPLAM',sx+10,y+5,9,template==='premium'?theme.dark:[1,1,1]);const grand=formatPdfMoney(totals.total);right(grand,sx+sw-10,y+4,fittingFontSize(grand,108,measure,10,7),template==='premium'?theme.dark:[1,1,1]);y-=52
 const section=(heading:string,value?:string)=>{if(!value?.trim())return;const lines=wrap(value,PDF_LAYOUT.type.body,usablePageWidth());ensure(34);txt(heading,M,y,PDF_LAYOUT.type.sectionTitle,theme.accent);y-=PDF_LAYOUT.spacing.section;for(const line of lines){if(y-PDF_LAYOUT.type.body<contentBottom){newPage();txt(`${heading} (DEVAM)`,M,y,PDF_LAYOUT.type.sectionTitle,theme.accent);y-=PDF_LAYOUT.spacing.section}txt(line,M,y,PDF_LAYOUT.type.body);y-=10}y-=PDF_LAYOUT.spacing.block}
 section('TESLİM SÜRESİ',q.deliveryTime);section('ÖDEME KOŞULLARI',q.terms);section('GARANTİ KOŞULLARI',q.warrantyTerms);section('DİĞER TİCARİ ŞARTLAR',q.otherTerms);section('NOTLAR',q.notes);if(q.company.showBankDetails&&(q.company.bankName||q.company.iban))section('BANKA BİLGİLERİ',[q.company.bankName,q.company.iban].filter(Boolean).join(' · '));if(q.company.contactName||signature||stamp){ensure(94);txt('YETKİLİ / İMZA',M,y,PDF_LAYOUT.type.sectionTitle,theme.accent);y-=16;txt([q.preparedBy||q.company.contactName,q.company.contactTitle].filter(Boolean).join(' · '),M,y,8,theme.dark);if(signature)fitImage(signature,M,y-8,100,55);if(stamp)fitImage(stamp,M+115,y-8,80,55);y-=70}
 const pages=pdf.getPages();pages.forEach((p,i)=>{page=p;page.drawLine({start:{x:M,y:37},end:{x:W-M,y:37},thickness:.35,color:color([.75,.78,.82])});txt(ellipsis([q.company.name,q.company.phone,q.company.email].filter(Boolean).join(' · '),430,PDF_LAYOUT.type.footer),M,23,PDF_LAYOUT.type.footer);right(`Sayfa ${i+1} / ${pages.length}`,W-M,23,PDF_LAYOUT.type.footer)});const out=await pdf.save();return{blob:new Blob([out.buffer as ArrayBuffer],{type:'application/pdf'}),filename:safeFilename(q.number),pageCount:pages.length}
}
