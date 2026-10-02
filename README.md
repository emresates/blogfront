# Margin — Blog frontend

Next.js App Router, strict TypeScript, React, Tailwind CSS 4 ve Lucide ile hazırlanmış Türkçe blog arayüzü. Gerçek Railway API'sini kullanır; mock içerik veya sahte istatistik yoktur.

## Kurulum

Node.js 22.18+ (Node 24 önerilir) ve npm gereklidir.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

`http://localhost:3000` adresini açın.

```dotenv
NEXT_PUBLIC_API_URL=https://blogappbackend-production-2f19.up.railway.app
# Production canonical URL için kendi frontend adresinizi ekleyin:
NEXT_PUBLIC_SITE_URL=https://your-blog.example
```

Backend adresi yalnızca ortam yapılandırmasında yer alır. `NEXT_PUBLIC_SITE_URL` verilmezse geliştirme canonical adresi `http://localhost:3000` olur. Production'da frontend'in gerçek HTTPS adresini kullanın.

```bash
npm run lint
npm test
npm run build
npm start
```

## Ekranlar

- `/`: editorial hero, son yazılar, kategoriler ve topluluk çağrısı.
- `/posts`: URL ile senkronize debounce arama, kategori filtresi, sunucu pagination.
- `/posts/[slug]`: TipTap JSON ile güvenli read-only article rendering, metadata, beğeni, paylaşım ve yorumlar.
- `/categories`, `/login`, `/register`, `/profile`.
- `/dashboard`: Author alanı; kendi yazılarını listeleme, oluşturma, düzenleme, silme.
- `/admin`: Admin/SuperAdmin overview, yazılar, kategori CRUD ve yazı bazlı yorum moderasyonu.
- Her iki panelde `/posts/new` ve `/posts/[id]/edit`.

## Mimari ve oturum

- `lib/api/`: ortak API client, tipli endpoint modülleri ve endpoint/HTTP verb allowlist.
- `types/`: API wrapper, pagination ve domain tipleri.
- Public veri Server Components üzerinden doğrudan backend'den alınır.
- Tarayıcı istekleri aynı origin'deki `/api/backend/...` Next.js BFF route'una gider. JWT, JavaScript'in okuyamadığı HttpOnly, SameSite=Lax cookie'de tutulur; production'da Secure kullanılır. Cookie oturum sürelidir; token geçerliliğinin kaynağı backend'dir.
- Proxy JWT'yi backend'e Bearer olarak iletir; login/register sonucundaki token tarayıcı JavaScript'ine verilmez. Logout frontend oturumunu siler; backend'e uydurma logout endpoint'i çağrılmaz.
- Mutasyonlarda Origin kontrolü uygulanır. Reverse proxy kurulumunda orijinal Host/Origin korunmalıdır. Production HTTPS gereklidir.
- Register yalnızca `name`, `email`, `password`; post yalnızca `title`, `content`, `categoryIds`; yorum yalnızca `content` gönderir. Role, slug ve userId istemciden atanmaz.
- 401 oturumu temizler ve korumalı işlemlerde login'e yönlendirir; 403 ve backend `message`/`errCode` API katmanından yönetilir.
- Role-aware UI güvenlik sınırı değildir; nihai yetkilendirme backend'dedir.
- Auth verisinde ve API isteklerinde `no-store` kullanılır.
- Article çağrısı `React.cache` ile metadata/page arasında tekilleştirilir. Detay linklerinde prefetch kapalıdır; beğeni/yorum mutasyonları article endpoint'ini yeniden çağırmaz.
- Post içeriği `JSONContent` olarak tutulur. Admin/Author ortak `RichTextEditor` bileşeninde `editor.getJSON()` çıktısı state üzerinden create/update requestinin `content` alanına object olarak verilir; HTML veya JSON string gönderilmez.
- `RichTextRenderer`, aynı StarterKit şemasıyla `editable: false` ve `immediatelyRender: false` kullanır. Geçersiz/boş belgeler için fallback bulunur; HTML enjeksiyonu yapılmaz ve link protokolleri filtrelenir.
- `lib/utils/richText.ts` doğrulama, güvenli linkler ve recursive plain-text extraction içerir. Kart önizlemesi, okuma süresi ve metadata bu metni kullanır.
- Editör başlıklar, kalın/italik/underline/strike, listeler, alıntı, kod bloğu, link ve undo/redo destekler. Başlık en az 3 karakter, içerik dolu ve en az bir kategori zorunludur. Arama başlıklar için mevcut backend query parametresini kullanır.

## Backend sözleşmesi ve bilinçli sınırlar

İlk kontrolde listeler boştu. Rich-text güncellemesinde canlı `/api/posts` yanıtında `content: { type: "doc", content: [...] }`, sayısal `userId` ve nullable `updatedAt` doğrulandı. Swagger JSON erişilebilir bir şema vermedi. Geçersiz login canlı olarak 401 ve PascalCase `Data/Message/ErrCode/StatusCode` döndürdü; adapter başarı ve hata yanıtlarında camelCase/PascalCase farkını normalize eder. Diğer DTO ve mutasyon payload'ları verilen sözleşmeye göre uygulandı; gerçek farklar `lib/api` modüllerinde uyarlanabilir.

- `isLiked` varsayılmaz. Beğeni durumu ilk yüklemede bilinmez; kullanıcı beğenebilir veya önceki beğenisini kaldırabilir. `postAlreadyLiked` yanıtı bilinen duruma geçirir. Bileşen ileride opsiyonel `initialLiked` alabilir.
- Güvenilir toplam yazı sayısı pagination'dan, kategori sayısı kategori listesinden gelir. Tüm site görüntülenme/beğeni/yorum toplamları istatistik endpoint'i olmadan gösterilmez.
- Global yorum endpoint'i yoktur; yönetici bir yazıyı seçerek gerçek yorum endpoint'leriyle moderasyon yapar.
- User listesi/role değiştirme endpoint'i yoktur; kullanıcı CRUD'u eklenmemiştir.
- GET-by-id ve yazar filtresi garanti edilmediği için edit yüklemesi ve Author listesi mevcut paginated post listesinden bulunur. Author listesi önce tüm sayfaları okuyup sahipliğe göre filtreler; büyük veri için backend'de authorId filtresi/GET-by-id gerekir. Eksik toplamları doğruymuş gibi göstermemek için 1000 sayfa sınırında açıklayıcı hata verilir.
- Comment count detay başlığında ilk server snapshot'ıdır; yorum bölümü mutasyonlardan sonra kendi listesini/sayısını yeniler. Bu yaklaşım tekrar article GET ile view count artmasını önler.

## Doğrulama

- Strict TypeScript production build ve ESLint.
- `npm test`: rol izinleri, proxy endpoint/verb kısıtlaması, path traversal, dış adrese dönüş yönlendirmesi, rich-text extraction, boş/bozuk belgeler, güvenli linkler ve gerçek StarterKit şemasıyla JSON round-trip kontrolleri.
- TipTap editörü izole geçici test ekranında mevcut JSON yükleme, bold mark çıktısı ve undo/redo ile tarayıcıda doğrulandı; bu ekran production projesinden kaldırıldı.
- Gerçek API public listeleri ve boş durumlar kontrol edildi.
- Tarayıcıda açık/koyu tema, 390 px mobil taşma kontrolü, mobil menü, URL araması (sayfa reseti dahil) ve oturumsuz `/admin` → `/login?next=...` yönlendirmesi doğrulandı.
- Proxy entegrasyonunda public posts yanıtı 200, geçersiz Origin 403, GET ile logout isteği 404 döndü.
- Gerçek backend geçersiz giriş yanıtı 401 olarak doğrulandı; PascalCase response normalizasyonu için regresyon testi eklendi.
- Yetkili test hesabı sağlanmadığı için başarılı login/register, içerik oluşturma/düzenleme/silme, beğeni ve yorum mutasyonlarının uçtan uca doğrulaması ayrıca yapılmalıdır. Test amacıyla production'a örnek içerik veya hesap eklenmedi.

Açık/koyu tema kalıcı tercihle çalışır. Mobil navigasyon, klavye focus durumları, native modal focus yönetimi, loading/empty/error ekranları ve toast bildirimleri bulunur.
