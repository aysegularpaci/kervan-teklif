import type { CompanySettings, Quote } from '../types';
const COMPANY='kervan-teklif:v1:company', QUOTES='kervan-teklif:v1:quotes';
const safe=<T,>(key:string,fallback:T):T=>{try{const x=localStorage.getItem(key);return x?JSON.parse(x) as T:fallback}catch{return fallback}};
export const loadCompany=()=>safe<CompanySettings|null>(COMPANY,null);
export const saveCompany=(x:CompanySettings)=>localStorage.setItem(COMPANY,JSON.stringify(x));
export const loadQuotes=()=>{const x=safe<unknown>(QUOTES,[]);return Array.isArray(x)?x as Quote[]:[]};
export const saveQuotes=(x:Quote[])=>localStorage.setItem(QUOTES,JSON.stringify(x));
export const clearAll=()=>{localStorage.removeItem(COMPANY);localStorage.removeItem(QUOTES)};
