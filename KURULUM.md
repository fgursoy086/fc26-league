# FC26 Lig Yönetim Sistemi — Kurulum Kılavuzu

## Özellikler
- ✅ Kullanıcı kaydı (ad, soyad, kullanıcı adı, e-posta, PS/Xbox/Origin ID, pozisyon)
- ✅ E-posta doğrulama (Supabase Auth)
- ✅ Şifremi unuttum / e-posta ile sıfırlama
- ✅ Takım kurma talebi (logo yükleme dahil)
- ✅ **Admin Paneli**: talepleri onayla/reddet, maç oluştur, skor gir, oyuncu yönet
- ✅ Transfer teklifi sistemi (kaptan → oyuncu)
- ✅ Kontratlar sayfası (oyuncu kabul/red)
- ✅ Kadro görüntüleme (pozisyona göre gruplu)
- ✅ Puan durumu + gol krallığı
- ✅ Fikstür & sonuçlar
- ✅ Oyuncu arama/filtreleme
- ✅ Mobil uyumlu tasarım

---

## ADIM 1: Supabase Kurulumu

### 1.1 Proje Oluştur
1. [supabase.com](https://supabase.com) → New Project
2. Proje adı, şifre ve bölge seçin (Europe West önerilir)

### 1.2 Veritabanı Şemasını Yükle
1. Supabase Dashboard → **SQL Editor** → New Query
2. `supabase_schema.sql` dosyasının tamamını yapıştırın → **Run**
3. Hata yoksa tüm tablolar oluşturulur

### 1.3 Storage Bucket Oluştur
1. Dashboard → **Storage** → New Bucket
2. Bucket adı: `team-logos`
3. **Public bucket** seçeneğini açın
4. Oluştur

### 1.4 E-posta Ayarları (Auth)
1. Dashboard → **Authentication** → Email Templates
2. Confirm signup ve Reset password şablonlarını Türkçe'ye çevirebilirsiniz
3. Dashboard → **Authentication** → URL Configuration:
   - Site URL: `https://SITENIZ.netlify.app`
   - Redirect URLs: `https://SITENIZ.netlify.app/reset-password`

### 1.5 API Keys
1. Dashboard → **Settings** → API
2. **Project URL** ve **anon public** key'i kopyalayın

---

## ADIM 2: Netlify Kurulumu

### 2.1 Siteyi Deploy Et
**Yöntem A: GitHub üzerinden (önerilen)**
1. Bu projeyi GitHub'a push edin
2. [netlify.com](https://netlify.com) → Add New Site → Import from GitHub
3. Repo seçin, build ayarları otomatik gelir (`netlify.toml` sayesinde)

**Yöntem B: Manuel upload**
1. `npm run build` çalıştırın
2. Netlify → Add New Site → Deploy manually → `build` klasörünü sürükleyin

### 2.2 Environment Variables
Netlify Dashboard → Site Settings → **Environment Variables** → Add:
```
REACT_APP_SUPABASE_URL = https://XXXXXX.supabase.co
REACT_APP_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5...
```
Sonra **Trigger Deploy** yapın.

---

## ADIM 3: İlk Admin Kullanıcı

1. Siteye gidip **normal kullanıcı olarak kayıt olun**
2. E-postanızı onaylayın
3. Supabase Dashboard → **SQL Editor**:
```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'admin@emailiniz.com';
```
4. Siteye tekrar giriş yapın → Admin paneli görünür olacak

---

## ADIM 4: Kullanım

### Oyuncu Akışı:
1. Kayıt ol → E-postayı onayla → Giriş yap
2. "Takım Kur" → Takım adı + logo yükle → Talep gönder
3. Admin onaylarsa kaptan olarak atanırsın
4. Kaptan olarak → "Takımı Yönet" → Takımsız oyunculara transfer teklifi gönder
5. Oyuncu → "Kontratlar" → Teklifi kabul/reddet

### Admin Akışı:
1. Admin paneline gir
2. "Takım Talepleri" → Onayla veya Reddet
3. "Maçlar" → Maç oluştur → Skor gir
4. "Oyuncular" → Rating güncelle, admin yetkisi ver

---

## Lokal Geliştirme

```bash
cd fc26-league
cp .env.example .env
# .env'i doldurun

npm install
npm start
```

---

## Sorun Giderme

**"Invalid API key" hatası**: .env dosyasını kontrol edin, Netlify'da env variables ekleyin ve redeploy yapın.

**"Row level security" hatası**: SQL şemasındaki tüm policy'lerin çalıştığından emin olun.

**E-posta gelmiyor**: Supabase Auth → Settings → SMTP ayarlarını kontrol edin. Ücretsiz planda günlük 3 e-posta limiti var; Resend.com veya SendGrid entegre edebilirsiniz.

**Logo yüklenmiyor**: Storage bucket'ın `team-logos` adında ve public olduğunu kontrol edin.
