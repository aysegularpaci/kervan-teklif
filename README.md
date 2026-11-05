# Kervan Teklif

Tarayıcıda çalışan, küçük işletmeler için fiyat teklifi oluşturma MVP'si. Bir e-Fatura/e-Arşiv sistemi değildir.

## Kurulum ve komutlar

```bash
npm install
npm run dev
npm test
npm run build
```

## GitHub Pages

Depo kök alan adında yayınlanacaksa varsayılan ayarla build alınır. Proje alt dizininde (`github.io/depo/`) yayınlanacaksa workflow veya build ortamına aşağıdakini ekleyin:

```bash
VITE_BASE_PATH=/depo/ npm run build
```

`main` dalına gönderim `.github/workflows/deploy.yml` ile test, build ve GitHub Pages dağıtımını başlatır. GitHub repository ayarlarından Pages kaynağını **GitHub Actions** seçin. Özel alan adı için Pages ayarlarından alan adını tanımlayın; uygulama mutlak yönlendirme kullanmadığından kök dizinde çalışır.

## Gizlilik ve sınırlamalar

Firma ayarları ve teklifler yalnızca tarayıcının localStorage alanında saklanır. Tarayıcı verileri silinirse veya başka bir cihaza geçilirse kayıtlar gelmez. En çok 100 teklif saklanır. PDF paylaşımı cihazın Web Share desteğine bağlıdır; destek yoksa PDF indirilir. WhatsApp paylaşımı yalnızca metin özeti açar, PDF eklemez.

PDF için proje içindeki Noto Sans (SIL Open Font License 1.1) gömülür ve Türkçe karakterleri seçilebilir metin olarak üretir.
