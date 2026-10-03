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

- `lib/api/client.ts`: mevcut endpoint modüllerinin ortak giriş noktası; public Server Component çağrıları kullanıcı state'i olmadan çalışır.
- `lib/api/transport.ts`: tek fetch katmanı; base URL, PascalCase/camelCase adapter, hata tipleri, 15 saniye timeout ve `credentials: "include"`.
- `lib/auth/session.ts`: tarayıcı belleğindeki access token/current user, başlangıç restore promise'i, refresh kuyruğu ve tek retry. Sunucuda kullanıcılar arasında paylaşılan auth state oluşturulmaz.
- `lib/api/auth.ts` ve mevcut `AuthProvider`: login/register/logout, refreshAccessToken, loadCurrentUser, accessToken, currentUser, isAuthenticated ve isAuthLoading sağlar. Mevcut `user`/`loading` alanları korunur.
- Tarayıcı artık `NEXT_PUBLIC_API_URL` adresine doğrudan istek gönderir. Backend refresh tokenı kendi origin'inde HttpOnly cookie olarak set eder; frontend tokenı okumaz, state/localStorage/sessionStorage'a yazmaz. Access token yalnızca memory'dedir.
- Eski `/api/backend/...` access-token-cookie proxy'si kaldırıldı. Önceki sürümün `margin_session` cookie'si artık kullanılmaz; geçerli backend refresh cookie'si bulunmayan eski oturumlarda bir defalık yeniden giriş gerekir.
- Login/register sonucu `data.accessToken` belleğe yazılır ve Bearer ile `/api/auth/me` alınır. Register yalnızca `name`, `email`, `password` gönderir.
- Açılışta bodiesiz `POST /api/auth/refresh`, ardından `/me` çağrılır. Strict Mode effect tekrarları aynı initialization promise'ini paylaşır. Tamamlanana kadar route guard loading gösterir; normal restore başarısızlığı guest state ile sonuçlanır.
- Normal request 401 alınca bir refresh promise'i paylaşılır. Yeni Bearer token ile orijinal method/body bir kez tekrar gönderilir. Geç gelen eski-token 401, zaten alınmış yeni tokenı kullanır. Retry 401 veya refresh hatası state'i temizler ve aktif işlemde login'e yönlendirir.
- Login/register/refresh/logout 401 yanıtları refresh tetiklemez. 403 refresh tetiklemez ve backend mesajı gösterilir. `userDisabled` state'i temizler, login'e yönlendirir ve açıklayıcı toast gösterir.
- Logout gerçek backend `/api/auth/logout` endpoint'ini çağırır; yanıt başarısız olsa bile memory temizlenir ve ana sayfaya dönülür. Devam eden cookie rotation tamamlandıktan sonra revoke isteği yapılır; geç gelen refresh/login cevabı memory oturumunu yeniden açamaz. Ağ hatasında backend revoke işlemi doğrulanamaz; hata toast ile görünür olur.
- Auth generation kontrolü eski isteğin yeni login'i silmesini önler. Tek refresh garantisi aynı tarayıcı uygulama instance'ındaki istekler içindir; ayrı sekmeler arasında koordinasyon yapılmaz.
- Role-aware UI güvenlik sınırı değildir; nihai yetkilendirme backend'dedir. Bütün API isteklerinde `no-store` kullanılır.
- Article çağrısı `React.cache` ile metadata/page arasında tekilleştirilir. Detay linklerinde prefetch kapalıdır; beğeni/yorum mutasyonları article endpoint'ini yeniden çağırmaz.
- Post `JSONContent` olarak tutulur. Ortak `RichTextEditor`, `editor.getJSON()` çıktısını create/update requestine object olarak verir. `RichTextRenderer` salt okunur StarterKit ile render eder; bozuk içerik fallback'i ve güvenli link filtresi korunur.

### Cross-origin cookie gereksinimleri

Backend CORS, gerçek frontend origin'ini (geliştirmede örneğin `http://localhost:3000`) açıkça döndürmeli: `Access-Control-Allow-Origin` için `*` kullanılamaz, `Access-Control-Allow-Credentials: true` gereklidir. Preflight, Authorization/Content-Type header'larını ve GET/POST/PUT/PATCH/DELETE method'larını kabul etmelidir. Farklı site cookie'si backend'de `HttpOnly; Secure; SameSite=None` ve auth endpoint'lerini kapsayan Path ile set edilmelidir. Tarayıcının üçüncü taraf cookie politikası da cookie'yi engellememelidir. Cookie header'larını backend yönetir; frontend bu ayarları taklit etmez.

2026-10-03 refresh geçişi kontrolünde verilen Railway adresindeki `POST /api/auth/refresh` 404 döndürdü. Yanıtta `Access-Control-Allow-Origin: *` vardı ve `Access-Control-Allow-Credentials` yoktu. Endpoint deployment'ı ve credential destekli CORS düzelmeden tarayıcıda başarılı login/restore/rotation/logout akışı doğrulanamaz.

## Backend sözleşmesi ve bilinçli sınırlar

İlk kontrolde listeler boştu. Rich-text güncellemesinde canlı `/api/posts` yanıtında `content: { type: "doc", content: [...] }`, sayısal `userId` ve nullable `updatedAt` doğrulandı. Swagger JSON erişilebilir bir şema vermedi. Geçersiz login canlı olarak 401 ve PascalCase `Data/Message/ErrCode/StatusCode` döndürdü; adapter başarı ve hata yanıtlarında camelCase/PascalCase farkını normalize eder. Diğer DTO ve mutasyon payload'ları verilen sözleşmeye göre uygulandı; gerçek farklar `lib/api` modüllerinde uyarlanabilir.

- `isLiked` varsayılmaz. Beğeni durumu ilk yüklemede bilinmez; kullanıcı beğenebilir veya önceki beğenisini kaldırabilir. `postAlreadyLiked` yanıtı bilinen duruma geçirir. Bileşen ileride opsiyonel `initialLiked` alabilir.
- Güvenilir toplam yazı sayısı pagination'dan, kategori sayısı kategori listesinden gelir. Tüm site görüntülenme/beğeni/yorum toplamları istatistik endpoint'i olmadan gösterilmez.
- Global yorum endpoint'i yoktur; yönetici bir yazıyı seçerek gerçek yorum endpoint'leriyle moderasyon yapar.
- `/admin/users` ve `/admin/users/[id]`: gerçek kullanıcı listesi/detayı, rol ve hesap durumu yönetimi. `lib/api/users.ts` GET `/api/users`, GET `/api/users/{id}`, PATCH `/api/users/{id}/role` ve PATCH `/api/users/{id}/status` kullanır. JWT merkezi memory store'dan Bearer olarak iletilir.
- Kullanıcı filtreleri URL'ye yazılır; `status=active/disabled` API'ye `isActive=true/false` olarak çevrilir. Varsayılan sayfa boyutu 20, üst sınır 100.
- Admin yalnızca User/Author hesaplarını yönetebilir ve bu rolleri atayabilir. SuperAdmin tüm rolleri yönetebilir. Kendi rolünü/durumunu değiştirme aksiyonları kapalıdır; backend son yetki kaynağıdır. Her değişiklik için onay alınır; 403 mesajı görünür, 401 mevcut oturum yönlendirmesini kullanır.
- Başarılı mutasyonlar yerel satırı günceller ve listeyi arka planda yeniler; filtre dışına çıkan kayıtlar ve boşalan son sayfa yeniden hesaplanır.
- GET-by-id ve yazar filtresi garanti edilmediği için edit yüklemesi ve Author listesi mevcut paginated post listesinden bulunur. Author listesi önce tüm sayfaları okuyup sahipliğe göre filtreler; büyük veri için backend'de authorId filtresi/GET-by-id gerekir. Eksik toplamları doğruymuş gibi göstermemek için 1000 sayfa sınırında açıklayıcı hata verilir.
- Comment count detay başlığında ilk server snapshot'ıdır; yorum bölümü mutasyonlardan sonra kendi listesini/sayısını yeniler. Bu yaklaşım tekrar article GET ile view count artmasını önler.

## Doğrulama

- Strict TypeScript production build ve ESLint başarılı.
- Refresh geçişinde 21 test geçti. Gerçek tarayıcı açılışında bir adet `/api/auth/refresh` isteği, kullanılabilir guest login formu ve auth/token storage anahtarı oluşturulmadığı doğrulandı. Başarılı cookie rotation senaryoları canlı backend erişim sorunu nedeniyle yalnızca izole oturum testlerinde doğrulanabildi.
- `npm test`: auth initialization, login/register, 401 tek retry, eşzamanlı/geç gelen 401, 403, disabled kullanıcı, revoked refresh, logout hatası ve logout/refresh yarışları; ayrıca mevcut rol, URL query ve rich-text kontrolleri. Auth testleri izole transport yanıtlarıyla çalışır; üretim uygulamasında fake/mock auth veya API yoktur.
- TipTap editörü izole geçici test ekranında mevcut JSON yükleme, bold mark çıktısı ve undo/redo ile tarayıcıda doğrulandı; bu ekran production projesinden kaldırıldı.
- Gerçek API public listeleri ve boş durumlar kontrol edildi.
- Tarayıcıda açık/koyu tema, 390 px mobil taşma kontrolü, mobil menü, URL araması (sayfa reseti dahil) ve oturumsuz `/admin` → `/login?next=...` yönlendirmesi doğrulandı.
- Gerçek backend geçersiz giriş yanıtı 401 olarak doğrulandı; PascalCase response normalizasyonu için regresyon testi eklendi.
- Yetkili test hesabı sağlanmadığı için başarılı login/register, içerik oluşturma/düzenleme/silme, beğeni ve yorum mutasyonlarının uçtan uca doğrulaması ayrıca yapılmalıdır. Test amacıyla production'a örnek içerik veya hesap eklenmedi.

2026-10-03 canlı kontrolde verilen Railway adresinde `/api/posts` 200, `/api/users?page=1&pageSize=20` ve `/api/users/1` ise 404 döndürdü. Yeni kullanıcı endpoint'lerinin deployment durumu doğrulanmalıdır; bu koşulda yetkili kullanıcı yönetimi uçtan uca doğrulanamadı.

User management için rol matrisi, self-management engeli ve status/query eşlemesi regresyon testleri korunur. Yetkili test hesabı olmadan gerçek kullanıcı rolü veya hesap durumu değiştirilmedi.

Açık/koyu tema kalıcı tercihle çalışır. Mobil navigasyon, klavye focus durumları, native modal focus yönetimi, loading/empty/error ekranları ve toast bildirimleri bulunur.

## Yorum yanıtları

`Comment` tipi recursive `replies` ve nullable `parentCommentId` içerir. `lib/api/comments.ts` içindeki `createCommentReply(commentId, content)`, mevcut JWT/refresh destekli client üzerinden `POST /api/comments/{commentId}/replies` çağırır; body yalnızca `{ content }` içerir. Yanıtlar mevcut PUT/DELETE comment endpoint'lerini kullanır.

`CommentItem` bütün seviyeleri recursive render eder; girinti üç seviyede sabitlenir ve mobilde azaltılır. `ReplyForm` yanıt ve düzenleme için paylaşılır; loading, double-submit kilidi, iptal ve inline hata gösterimi içerir. Guest kullanıcıya textarea yerine login bağlantısı gösterilir. Sahip, Admin ve SuperAdmin düzenleme/silme aksiyonlarını görür; backend son yetki kaynağıdır.

Mutasyonlardan sonra yalnızca yorum listesi yeniden alınır; article endpoint'i ve view count etkilenmez. Başarılı silme alt ağacı yerel olarak da kaldırır, ardından backend'deki cascade sonucu refetch edilir. Eksik/bozuk replies alanı adapter'da boş diziye dönüşür. Bölüm sayacı yanıtlar dahil bütün node'ları sayar.

Reply güncellemesinde lint, 25 test ve production build başarılı. Canlı `/api/posts/3/comments` 200 ve boş liste döndürdü. Nested tree, hatalı replies, alt ağaç silme ve izinler birim testleriyle doğrulandı. Yetkili hesap olmadan canlı create/reply/edit/delete veya admin moderasyon mutasyonu yapılmadı.
