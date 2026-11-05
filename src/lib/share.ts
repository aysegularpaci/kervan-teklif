import type { Quote } from '../types'; import { calculateQuote,formatTry } from './calculations';
export const whatsappUrl=(q:Quote)=>`https://wa.me/?text=${encodeURIComponent(`${q.company.name}\n${q.customer.name} için teklif\nTeklif no: ${q.number}\nToplam: ${formatTry(calculateQuote(q.items).total)}`)}`;
export const safeFilename=(n:string)=>`Teklif-${n.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g,'-').slice(0,80)||'teklif'}.pdf`;
