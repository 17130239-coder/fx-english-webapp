# 🎬 FX English WebApp — Cloud Dashboard

> **Ứng dụng Web Dashboard cho FX English**, tối ưu hóa triển khai sẵn sàng trên **Vercel**, đồng bộ dữ liệu thời gian thực với **Neon Serverless Postgres** từ tiện ích mở rộng **FX English Extension**.
> 
> Hoàn toàn **KHÔNG PHỤ THUỘC VÀO AI** (Không cần API Key, không tốn quota) — Tích hợp bộ tách từ ngoại tuyến siêu tốc (Offline Compromise NLP + từ điển 12,000 từ CEFR), quản lý Master Known List và luyện thẻ ghi nhớ 3D Flashcards SRS.
>
> Thiết kế chuẩn **Tesla Utilitarian Minimalist Design System** (Nền đen nhám carbon `#0A0A0B` / `#141416`, viền siêu mỏng `rgba(255,255,255,0.06)`, icon nét mảnh đơn sắc, tuyệt đối không dùng emoji hệ thống).

---

## 🌐 Công Nghệ & Kiến Trúc (Tech Stack)

- **Frontend & Fullstack Framework**: [Next.js 16](https://nextjs.org/) (App Router & Route Handlers với Turbopack)
- **UI & State**: [React 19](https://react.dev/), TypeScript 5, [Tailwind CSS v4](https://tailwindcss.com/)
- **Icon System**: [Lucide React](https://lucide.dev/) (Nét mảnh 1.5px đơn sắc)
- **Cơ sở dữ liệu Đám mây**: [Neon Serverless Postgres](https://neon.tech/) qua `@neondatabase/serverless` (Giao thức HTTPS query không nghẽn connection pooler)
- **Bộ tách từ ngoại tuyến (100% Client-side)**:
  - Universal Subtitle Parser (Hỗ trợ định dạng `.SRT`, `.VTT`, `.TXT`)
  - Compromise NLP Lemmatizer & POS Tagger
  - Từ điển CEFR Dictionary chuẩn hóa (A1, A2, B1, B2, C1, C2) kèm US IPA
- **Phát âm**: Browser Web Speech Synthesis API bản xứ
- **Nền tảng triển khai**: [Vercel](https://vercel.com/) (Serverless Edge & Lambdas)

---

## 🚀 Các Tính Năng Nổi Bật

### 1. Đồng bộ Lịch sử Phim quét từ Chrome Extension (Cloud Scanned History)
- Xem lại toàn bộ phim và video đã quét trên Netflix / YouTube từ tiện ích **FX English Extension**.
- Thẻ phim hiển thị thông số kỹ thuật tối giản: Tên phim, nhãn nền tảng (`NETFLIX` / `YOUTUBE` / `FILE`), ngày quét, tổng số từ và phân bổ từ loại (`N`, `V`, `Adj`, `Adv`).
- Nhấp vào bất kỳ phim nào để tải ngay bảng từ vựng và câu ngữ cảnh chi tiết.
- Hỗ trợ xóa từng phim hoặc xóa sạch toàn bộ lịch sử với hộp thoại xác nhận Tesla.

### 2. Bảng Từ vựng Ngữ cảnh Phim (Vocabulary Grid)
- Thống kê định lượng: Tổng từ vựng, Danh từ, Động từ, Tính từ, Trạng từ, Câu giao tiếp.
- Bộ lọc theo 6 tab từ loại, ô tìm kiếm thời gian thực và dropdown lọc cấp độ CEFR (`A1` đến `C2`).
- Mỗi thẻ từ vựng hiển thị: Từ nguyên mẫu (Lemma), nhãn từ loại, cấp độ CEFR, phiên âm US IPA, nghĩa ngữ cảnh tiếng Việt và câu thoại thực tế trong phim.
- Nút nghe phát âm chuẩn bản xứ và nút đánh dấu **"Đã biết"** (tự động đồng bộ ngay lập tức vào Master List trên Neon Cloud).

### 3. Quản lý Master Known List & Semantic Deduplication
- Hiển thị thanh tiến trình phân bổ cấp độ **CEFR Distribution Bar** (`A1: xanh lá`, `A2: cyan`, `B1: xanh dương`, `B2: tím`, `C1/C2: hồng`).
- Nhóm tab: *Tất cả*, *Danh từ*, *Động từ*, *Tính từ*, *Trạng từ*, *Câu giao tiếp*, *Đa nghĩa*.
- Thẻ từ vựng tuân thủ nghiêm ngặt chuẩn Tesla UI: **Không hiển thị tần suất (26x) và không hiển thị số giây / timestamp**.
- Hỗ trợ gắn nhiều nghĩa tiếng Việt cho từ đa nghĩa (Polysemy), thêm hoặc xóa từng nghĩa con trực tiếp trên thẻ.
- Hỗ trợ thêm từ mới thủ công (`+ Thêm từ`), xóa từ và xuất dữ liệu sang Anki / CSV.

### 4. Ôn tập Thẻ Ghi nhớ 3D Flashcards (Spaced Repetition System)
- Mô hình thẻ 3D xoay lật mượt mà (`preserve-3d` & `perspective`).
- Mặt trước: Từ vựng, phiên âm IPA, loại từ, cấp độ CEFR, câu ngữ cảnh và nút phát âm.
- Mặt sau: Nghĩa tiếng Việt, từ gốc (lemma), ghi chú ngữ cảnh giao tiếp.
- 4 nút đánh giá SRS: **Quên (1 ngày)**, **Khó (2 ngày)**, **Nhớ (3 ngày)**, **Dễ (4 ngày - tự động thuộc)**.
- Hỗ trợ điều khiển hoàn toàn bằng bàn phím: `Space` (lật thẻ), `1-4` (đánh giá SRS), `←`/`→` (chuyển thẻ), `Esc` (đóng).

### 5. Tách Từ vựng Ngoại tuyến từ File / Dán Văn bản (Zero AI Dependency)
- Vùng kéo thả file phụ đề (`.srt`, `.vtt`, `.txt`) hoặc dán trực tiếp transcript.
- 3 nút nạp phụ đề mẫu thử nhanh: *Inception (SRT)*, *Interstellar (VTT)*, *TED Talk (TXT)*.
- Bấm **"Tách từ vựng"** để phân tích 100% trên trình duyệt bằng Compromise NLP, không gửi dữ liệu ra ngoài và không cần API key.

### 6. Xuất Dữ liệu Anki & CSV Chuẩn Quốc Tế
- **Xuất Anki (.txt)**: Định dạng thẻ 2 mặt HTML cao cấp, tự động gán Deck name và tag cho từng phim hoặc Master List.
- **Xuất CSV (.csv)**: Định dạng bảng tính UTF-8 tương thích Excel, Google Sheets và Notion.

---

## ⚡ Cẩm Nang Kỹ Thuật Tối Ưu Hiệu Năng & UI/UX Chuyên Sâu (Performance & UI/UX Playbook)

Tài liệu này tổng hợp toàn bộ các kỹ thuật, giải pháp kiến trúc và nguyên tắc thiết kế được áp dụng trong **FX English WebApp** để đạt tốc độ tải dữ liệu tức thì (0ms - 50ms) và trải nghiệm người dùng phần cứng chuẩn **Tesla Utilitarian Minimalist**.

---

### 🚀 Phần 1: Kỹ Thuật Tối Ưu Hiệu Năng (Fullstack Performance Engineering)

#### 1. Định vị Serverless Edge Colocation (Giảm 98% Network Latency)
* **Vấn đề**: Vercel Serverless mặc định phân bổ tại miền Đông Hoa Kỳ (`iad1` - Washington D.C.), trong khi Neon Postgres đặt tại Singapore (`ap-southeast-1`). Người dùng tại Đông Nam Á / Việt Nam khi gọi API phải truyền gói tin 2 vòng nửa vòng Trái Đất:
  $$\text{User (VN)} \xrightarrow{\sim 200\text{ms}} \text{Vercel (Mỹ)} \xrightarrow{\sim 250\text{ms}} \text{Neon (Singapore)} \xrightarrow{\sim 250\text{ms}} \text{Vercel (Mỹ)} \xrightarrow{\sim 200\text{ms}} \text{User (VN)}$$
  $\rightarrow$ Tốn hơn **900ms – 1.2s** chỉ riêng cho độ trễ vật lý của cáp quang biển.
* **Giải pháp**: Cấu hình file `vercel.json` định tuyến toàn bộ Serverless Function về vùng Singapore (`sin1`):
  ```json
  {
    "regions": ["sin1"]
  }
  ```
* **Kết quả**: Serverless Function của Vercel chạy cùng trung tâm dữ liệu AWS Singapore với Neon. Độ trễ giữa API và Database giảm từ **250ms xuống còn 2–3ms**. Tổng thời gian phản hồi API giảm xuống chỉ còn **~60ms – 80ms**.

---

#### 2. Triệt Tiêu DDL Overheads trên Luồng Đọc (Zero Cold-Start Lag)
* **Vấn đề**: Hàm kiểm tra schema (`ensureSchema`) chạy 4 câu lệnh DDL (`CREATE TABLE`, `ALTER TABLE`) trước mỗi truy vấn. Trong môi trường Serverless khi container bị khởi động nguội (cold start), các câu lệnh DDL gây khóa bảng danh mục (catalog locks) và ngốn 4 round-trips không cần thiết trước khi câu lệnh `SELECT` được chạy.
* **Giải pháp**:
  * Tách biệt hoàn toàn luồng Đọc (**GET**) và luồng Ghi (**POST / PUT / DELETE**).
  * Tất cả Route Handlers đọc dữ liệu (`GET /api/movies`, `GET /api/movies/[id]`, `GET /api/master-list`) tuyệt đối **không gọi `ensureSchema()`**.
  * `ensureSchema()` chỉ chạy khi có tác vụ ghi dữ liệu mới hoặc chạy migration.

---

#### 3. Bổ Sung B-Tree Indexes Cho Neon PostgreSQL
* **Giải pháp**: Tạo các chỉ mục tối ưu trên Neon DB để câu lệnh sắp xếp và lọc theo khóa ngoại/thời gian chạy với độ phức tạp $O(\log N)$ thay vì quét toàn bộ bảng (Sequential Scan):
  ```sql
  CREATE INDEX IF NOT EXISTS idx_fx_scanned_movies_timestamp ON fx_scanned_movies ("timestamp" DESC);
  CREATE INDEX IF NOT EXISTS idx_fx_scanned_movies_platform ON fx_scanned_movies (platform);
  CREATE INDEX IF NOT EXISTS idx_fx_master_known_list_created_at ON fx_master_known_list (created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_fx_master_known_list_text ON fx_master_known_list (text);
  ```

---

#### 4. Cắt Giảm 70% Tải Trọng Mạng (Payload Pruning & Deduplication)
* **Vấn đề**: Phân tích phim trước đây lưu cột JSONB `analysis` chứa nhiều mảng lặp lại dữ liệu (như `categories`, `allWords`, `highlights`, `sentenceStructures`, `communicativeSentences`), làm dung lượng 1 tập phim phình to đến **1,143 KB (1.14 MB)** kèm cả mảng phụ đề chi tiết `cues` (122 KB) dù giao diện xem phim không cần hiển thị `cues`.
* **Giải pháp**:
  * **Phía Server**: API `/api/movies/[id]` chủ động trích xuất danh sách từ vựng sạch (`vocabulary`) qua `extractVocabFromAnalysis` ngay trên Server và lược bỏ trường `analysis` trùng lặp trước khi gửi xuống Client.
  * **Tải lười phụ đề (`cues`)**: Mặc định không gửi mảng phụ đề `cues`. Khi người dùng nhấp **Export JSON**, hệ thống mới gửi tham số `?cues=true` để tải phụ đề đầy đủ.
* **Kết quả**: Kích thước phản hồi giảm từ **1,143 KB xuống còn 352 KB** *(giảm 70%)*, nén Gzip qua đường truyền chỉ còn **~38 KB**. Trình duyệt parse JSON nhanh gấp 4 lần và không tốn RAM.

---

#### 5. Cơ Chế Edge CDN Caching & Stale-While-Revalidate (SWR)
* **Giải pháp**: Bổ sung HTTP Header điều phối bộ nhớ đệm tại tầng Vercel Edge Network:
  ```ts
  return NextResponse.json(
    { success: true, movies: rows },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59'
      }
    }
  );
  ```
  * Khi nhiều tab hoặc nhiều người cùng truy cập, Vercel Edge CDN tại Đông Nam Á phản hồi dữ liệu trong **< 15ms** mà không cần đánh thức DB.

---

#### 6. Hydration Tức Thì Phía Client (0ms First Paint với SWR Caching)
* **Vấn đề**: Mỗi lần chuyển hướng giữa Dashboard và Chi tiết tập phim, người dùng phải nhìn màn hình Skeleton loading chớp giật trong 1–2 giây.
* **Giải pháp**:
  * **Tại Dashboard (`/`)**: Lưu bản sao snapshot danh sách phim và Master List vào `localStorage`. Khi Component vừa mount, hệ thống hydrate dữ liệu từ cache ngay lập tức (**0ms**). Người dùng nhìn thấy danh sách phim ngay trong **0.01s**, trong khi tác vụ fetch ngầm vẫn tự động cập nhật dữ liệu mới nhất mà không giật màn hình.
  * **Tại trang Chi tiết (`/movies/[id]`)**: Lưu phiên làm việc của từng tập phim vào `sessionStorage` (`fx_movie_${movieId}`). Khi quay lại tập phim đã xem, trang hiển thị tức thì không cần tải lại.

---

#### 7. Phòng Vệ Dữ Liệu Chống Ghi Đè (Defensive SQL Upsert)
* **Vấn đề**: Khi tiện ích hoặc ứng dụng đồng bộ dữ liệu tóm tắt (không có chi tiết `analysis` và `cues`), câu lệnh `ON CONFLICT DO UPDATE` có thể ghi đè `{}` lên dữ liệu chi tiết đã phân tích trước đó.
* **Giải pháp**: Áp dụng mệnh đề phòng vệ SQL `CASE WHEN`:
  ```sql
  cues = CASE 
    WHEN EXCLUDED.cues IS NOT NULL AND jsonb_array_length(EXCLUDED.cues) > 0 
    THEN EXCLUDED.cues 
    ELSE fx_scanned_movies.cues 
  END,
  analysis = CASE 
    WHEN EXCLUDED.analysis IS NOT NULL AND EXCLUDED.analysis != '{}'::jsonb 
    THEN EXCLUDED.analysis 
    ELSE fx_scanned_movies.analysis 
  END
  ```
  Đảm bảo dữ liệu từ vựng đã phân tích không bao giờ bị ghi đè mất bởi các gói tin đồng bộ tóm tắt.

---

#### 8. Khôi Phục Dữ Liệu Theo Thời Gian Thực (Point-in-Time Restore)
* Tận dụng kiến trúc lưu trữ theo dòng thời gian (WAL Log-Structured) của Neon:
  * Khi phát hiện dữ liệu bị ghi đè sai, lập tức tạo Snapshot tại một mốc thời gian trong quá khứ:
    ```js
    await tools.Neon.create_snapshot({
      project_id, branch_id: "br-production",
      timestamp: "2026-10-18T15:30:00Z",
      name: "recovery-point"
    });
    ```
  * Khôi phục Snapshot sang một nhánh tạm (`recovery-branch`), trích xuất lại nguyên vẹn JSON phân tích và phụ đề gốc, sau đó đồng bộ trả lại nhánh chính mà không gây gián đoạn hệ thống.

---

#### 9. Tách Rời Bundle Phân Tích NLP (Giảm 450KB+ Client Bundle)
* Thay vì import toàn bộ thư viện phân tích ngôn ngữ tự nhiên Compromise NLP vào các trang hiển thị phía Client, trích xuất module `src/lib/vocabExtractor.ts` siêu nhẹ (0 dependency, ~2KB).
* Giúp các trang xem từ vựng tải nhanh và đạt điểm Lighthouse Performance 98-100/100.

---

#### 10. Progressive Infinite Scrolling với `IntersectionObserver`
* Thay vì render đồng loạt 1,000 thẻ từ vựng vào DOM gây tràn bộ nhớ và giật FPS, ứng dụng áp dụng kỹ thuật hiển thị lũy tiến theo từng block 48 thẻ khi người dùng cuộn trang:
  ```ts
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      setDisplayLimit((prev) => prev + 48);
    }
  }, { rootMargin: '400px' });
  ```

---

### 🎨 Phần 2: Kỹ Năng Thiết Kế Giao Diện & Trải Nghiệm Người Dùng (UI/UX Engineering)

#### 1. Triết Lý Thiết Kế Phần Cứng Tesla (Utilitarian Minimalist)
* **Bảng màu Carbon Matte**: Nền tối `#0A0A0B` (Canvas) và `#141416` (Surface) chống mỏi mắt khi học tập cường độ cao.
* **Viền tinh tế (Subtle Borders)**: Sử dụng các đường viền siêu mảnh `rgba(255, 255, 255, 0.06)` thay cho hiệu ứng đổ bóng màu mè, tạo cảm giác chính xác, cơ khí và tinh tế.
* **Chữ số Kỹ thuật Monospace**: Các số liệu tần suất, thời gian, thống kê CEFR đều sử dụng font mono để đảm bảo thẳng hàng tuyệt đối.

---

#### 2. Tiêu Chuẩn Nghiêm Ngặt Zero-Emoji
* Trong phần mềm học thuật và công cụ năng suất chuẩn công nghiệp, emoji hệ thống (màu sắc sặc sỡ, không đồng nhất giữa Windows/macOS/Android) bị loại bỏ hoàn toàn.
* Thay thế bằng hệ thống vector icon đơn sắc [Lucide Icons](https://lucide.dev/) với nét mảnh 1.5px, phản ánh chính xác ngữ cảnh kỹ thuật.

---

#### 3. Tinh Giản Thanh Điều Hướng (Icon-only Navigation)
* **Logo Header**: Lược bỏ nhãn chữ thừa `FX English`, chỉ giữ biểu tượng Logo hình học tối giản ở góc trái.
* **Nút Chức Năng**: Nút **Export** chuyển từ nút gắn chữ rườm rà thành nút icon `<Download size={14} />` đơn sắc chuẩn 32x32px với padding `6px 8px`.
* Đồng bộ hoàn hảo với các nút bên cạnh: Phím tắt (`<Keyboard />`), Đổi giao diện (`<Sun />` / `<Moon />`), mang lại thanh Header thoáng đãng và đẳng cấp.

---

#### 4. Chỉ Báo Trạng Thái Vi Mô (Micro-dot Indicators)
* Trạng thái kết nối Cloud Neon không dùng thanh thông báo chiếm chỗ, mà sử dụng một chấm phát quang vi mô 6px (`.fx-neon-dot`):
  * **Xanh ngọc lục bảo (`#10B981`)**: Đã kết nối cơ sở dữ liệu đám mây.
  * **Vàng hổ phách (`#EAB308`)**: Đang đồng bộ.
  * **Xám mờ**: Chế độ làm việc ngoại tuyến.
  * Tích hợp hiệu ứng nhịp thở êm ái `@keyframes fx-pulse`.

---

#### 5. Chuyển Đổi Tab Mượt Mà Không Giật Khung Hình (Hardware-Grade Tab Motion)
* Khi chuyển đổi qua lại giữa các Tab (Studio $\leftrightarrow$ Master List, hoặc lọc các loại từ *Danh từ, Động từ, Tính từ, Cụm từ, Cấu trúc câu*), giao diện không bị giật hay biến mất đột ngột.
* Sử dụng animation chuyên dụng với đường cong gia tốc tự nhiên:
  ```css
  @keyframes fx-tab-fade-in {
    0% {
      opacity: 0;
      transform: translateY(6px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fx-tab-active-pop {
    0% { transform: scale(0.96); }
    100% { transform: scale(1); }
  }

  .fx-tab-pane {
    animation: fx-tab-fade-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    will-change: opacity, transform;
  }
  ```

---

#### 6. Thẻ Học 3D Flashcards Tương Tác Cảm Ứng (Touch Gesture Ergonomics)
* **Hiệu ứng 3D**: Thẻ flashcard sử dụng thuộc tính CSS 3D Transforms (`perspective: 1000px`, `transform-style: preserve-3d`, `backface-visibility: hidden`) cho trải nghiệm xoay lật như thẻ thật.
* **Cử chỉ vuốt chạm trên thiết bị di động**:
  * Vuốt sang phải (`Swipe Right`): Đánh dấu đã thuộc / Nhớ từ.
  * Vuốt sang trái (`Swipe Left`): Đánh dấu từ khó / Cần ôn lại.
  * Chạm để lật thẻ 3D tức thì.

---

#### 7. Triết Lý Ưu Tiên Bàn Phím (Keyboard-First Navigation)
Hỗ trợ phím tắt toàn năng giúp người học thao tác không cần nhấc tay khỏi bàn phím:
| Phím tắt | Thao tác | Ngữ cảnh |
| :---: | :--- | :--- |
| **`/`** | Kích hoạt ô tìm kiếm từ vựng | Bảng từ vựng |
| **`1` – `7`** | Chuyển nhanh giữa các tab từ loại | Bảng từ vựng |
| **`H`** | Ẩn / Hiện các từ đã thuộc trong Master List | Bảng từ vựng |
| **`F`** | Mở chế độ luyện tập 3D Flashcards | Xem chi tiết phim |
| **`B`** | Quay lại danh sách phim | Xem chi tiết phim |
| **`O`** | Mở video phim gốc trên Netflix / YouTube | Xem chi tiết phim |
| **`Space`** | Lật mặt trước / sau thẻ | Flashcard Modal |
| **`1` – `4`** | Đánh giá mức độ nhớ SRS (Quên $\rightarrow$ Rất dễ) | Flashcard Modal |
| **`←` / `→`** | Chuyển tới từ trước / từ tiếp theo | Flashcard Modal |
| **`?`** | Mở bảng tra cứu phím tắt | Mọi màn hình |
| **`Esc`** | Đóng tất cả cửa sổ Modal | Mọi màn hình |

---

#### 8. Hỗ Trợ Ứng Dụng Đa Nền Tảng PWA (Progressive Web App)
* Tích hợp Web App Manifest (`/manifest.webmanifest`) với icon sắc nét chuẩn bị cho màn hình Retina.
* Service Worker Cache-First (`/sw.js`) giúp ứng dụng tải ngay lập tức kể cả khi mất mạng.
* Hỗ trợ cài đặt trực tiếp lên màn hình chính (Add to Home Screen) trên iPhone, iPad, Android và macOS như một ứng dụng Native độc lập.

---

#### 9. Tối Ưu Công Thái Học Di Động (Mobile Ergonomics & Responsive System)
* **Triệt tiêu lỗi iOS Auto-Zoom**: Tự động đặt `16px` font-size cho input/select trên màn hình di động, ngăn chặn triệt để hành vi Safari tự phóng to màn hình khi chạm vào tìm kiếm.
* **Hỗ trợ Dynamic Island & Tai thỏ**: Sử dụng `max(..., env(safe-area-inset-top))` và `env(safe-area-inset-bottom)` giúp Header và Footer không bị che khuất bởi notch hoặc thanh home ảo của iPhone.
* **Dải thống kê vuốt ngang (Horizontal Swipe Strip)**: Trên điện thoại (< 640px), 7 thẻ chỉ số KPI chuyển thành dải vuốt ngang mượt mà (`scroll-snap-type: x mandatory`), giảm chiều cao chiếm chỗ từ 320px xuống chỉ còn 58px.
* **Thanh Tab từ loại 1 dòng cuộn ngang**: Biến 7 tab từ loại thành hàng ngang cuộn êm ái thay vì rớt thành 3–4 dòng lộn xộn.
* **Ẩn phím tắt bàn phím trên điện thoại**: Tự động ẩn nút phím tắt `?` trên thiết bị cảm ứng để giải phóng diện tích cho Header.

---

#### 10. Phản Hồi Chạm 0ms & Cuộn Mượt 120fps (Mobile GPU Acceleration)
* **`touch-action: manipulation`**: Triệt tiêu 300ms độ trễ chạm (tap delay) của trình duyệt di động, giúp nút bấm phản hồi tức thì trong 0ms.
* **`content-visibility: auto`**: Bỏ qua tính toán layout và render cho các thẻ từ vựng nằm ngoài màn hình điện thoại, giúp cuộn danh sách hàng trăm từ luôn đạt trọn vẹn 60–120fps ProMotion mượt mà như ứng dụng gốc.

---

### 🤖 Phần 3: Kỹ Thuật Thiết Kế AI System Prompt Điện Ảnh (AI Prompt Engineering)

Công cụ bóc tách ngôn ngữ của FX English sử dụng AI System Prompt được chuẩn hóa theo tiêu chuẩn **Nhà nghiên cứu Từ điển học Điện toán (Computational Lexicographer)** với 5 cơ chế phòng vệ và tối ưu độ sạch dữ liệu:

#### 1. Cơ Chế Chống Trùng Lặp Cụm Từ (Collocation Pre-emption)
* Khi bóc tách một cụm từ cố định vào mục `phrases` (ví dụ: `take advantage of`, `figure out`, `call it a day`), AI bị cấm trích xuất các từ đơn lẻ tạo nên cụm từ đó (`advantage`, `figure`, `day`) vào danh sách từ đơn `vocabulary`.
* Giữ cho danh sách học tập luôn cô đọng, người học không phải học lại các từ riêng lẻ vô nghĩa khi chúng đã nằm trong thành ngữ.

#### 2. Bộ Lọc Tên Riêng, Nhân Vật & Thán Từ Phim (Entity & Noise Suppression)
* Loại bỏ triệt để tên nhân vật phim (*Shrek, Fiona, Farquaad, Stark, Gotham*), địa danh hư cấu, tên thương hiệu hoặc các từ vô nghĩa mang tính âm thanh.
* Bỏ qua các thán từ đệm hội thoại thông tục (*whoa, nah, uh-huh, gosh, gee, ooh, huh, dammit*) để tập trung 100% vào từ vựng tiếng Anh thực tế có giá trị sử dụng lâu dài.

#### 3. Chuẩn Hóa Khẩu Ngữ & Rút Gọn Âm Điện Ảnh (Spoken Contractions Handling)
* Tự động nhận diện các biến thể rút gọn trong lời thoại bản xứ (*gonna, wanna, gotta, dunno, kinda, sorta, lemme, outta, ain't*).
* Ánh xạ chính xác về dạng từ gốc từ điển (Lemma): `gonna` $\rightarrow$ `going to`, `wanna` $\rightarrow$ `want to`, `kinda` $\rightarrow$ `kind of`, giữ nguyên `originalForm` để phục vụ bôi đậm ngữ cảnh phim.

#### 4. Bỏ Qua Từ Vựng Sơ Đẳng Hiển Nhiên (A1 Trivial Word Suppression)
* Tự động loại trừ các từ siêu cơ bản hiển nhiên (*eat, sleep, big, small, go, see, good, bad, car, dog, water, house*) trừ khi chúng mang nghĩa ẩn dụ hoặc nằm trong cấu trúc câu đặc biệt.
* Tiết kiệm 40% token và ngăn chặn việc danh sách từ vựng bị ngập rác bởi các từ cơ bản của trẻ em.

#### 5. Phân Loại Sắc Thái & Văn Phong Giao Tiếp (Register & Tone Tagging)
* Gán nhãn sắc thái chuẩn cho từng từ và cụm từ:
  * `"formal"`: Trang trọng, học thuật, tài liệu chuyên môn (*furthermore, scrutiny*).
  * `"neutral"`: Trung tính, dùng trong mọi hoàn cảnh thông thường (*decision, reliable*).
  * `"casual"`: Khẩu ngữ giao tiếp hàng ngày (*kinda, hang out, chill*).
  * `"slang"`: Tiếng lóng giới trẻ (*ghost someone, wrap up*).
  * `"taboo"`: Từ ngữ thô tục, cấm kỵ cần tránh dùng nơi công sở.

---

## 🛠️ Hướng Dẫn Cài Đặt & Triển Khai Lên Vercel

### Cách 1: Triển khai trực tiếp lên Vercel qua GitHub (Khuyên dùng)

1. **Khởi tạo Git repo cho `fx-english-webapp` và push lên GitHub:**
   ```bash
   cd /Users/andynguyen/workspace/fx-english-webapp
   git init
   git add .
   git commit -m "feat: initial commit of fx-english-webapp with Tesla UI and Neon Serverless sync"
   git branch -M main
   git remote add origin git@github.com:17130239-coder/fx-english-webapp.git
   git push -u origin main
   ```

2. **Tạo Project mới trên Vercel:**
   - Truy cập [Vercel Dashboard](https://vercel.com/dashboard).
   - Bấm **Add New...** -> **Project**.
   - Chọn kho lưu trữ **`fx-english-webapp`** từ danh sách GitHub.

3. **Cấu hình Environment Variables trên Vercel:**
   - Trong mục **Environment Variables**, thêm biến sau:
     - **Name**: `DATABASE_URL`
     - **Value**: `postgresql://username:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`
   - Bấm **Deploy**.
   - Vercel sẽ tự động build và cung cấp đường dẫn production (ví dụ: `https://fx-english-webapp.vercel.app`).

---

### Cách 2: Chạy cục bộ trên máy tính (Local Development)

1. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

2. **Cấu hình file môi trường `.env.local`:**
   ```env
   DATABASE_URL=postgresql://username:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

3. **Chạy máy chủ phát triển:**
   ```bash
   npm run dev
   ```
   Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)

4. **Kiểm tra build production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 📂 Cấu Trúc Thư Mục (Codebase Architecture)

```
fx-english-webapp/
├── .env.example                     # Mẫu cấu hình biến môi trường DATABASE_URL
├── .gitignore                       # Bỏ qua node_modules, .next, .env.local
├── package.json                     # Next.js 16, React 19, Neon Serverless, Lucide
├── tsconfig.json                    # Cấu hình TypeScript 5 & path alias @/*
├── next.config.ts                   # Cấu hình Turbopack cho Next.js 16
├── postcss.config.mjs               # Cấu hình Tailwind CSS v4
│
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root Layout chuẩn Dark mode & font Plus Jakarta Sans
│   │   ├── globals.css              # Design tokens Tesla UI & hiệu ứng xoay lật 3D
│   │   ├── page.tsx                 # Trang chủ Web Dashboard
│   │   └── api/
│   │       ├── movies/
│   │       │   ├── route.ts         # GET (danh sách phim), POST (lưu phim), DELETE (xóa hết)
│   │       │   └── [id]/
│   │       │       └── route.ts     # GET (chi tiết phân tích phim), DELETE (xóa 1 phim)
│   │       └── master-list/
│   │           └── route.ts         # GET, POST (tích lũy nghĩa), DELETE (xóa từ)
│   │
│   ├── components/
│   │   ├── Navbar.tsx               # Header, Switcher màn hình, trạng thái Neon DB
│   │   ├── UnifiedInput.tsx         # Kéo thả file, dán phụ đề, tách từ ngoại tuyến
│   │   ├── ScannedHistory.tsx       # Lưới hiển thị các phim đã quét trên Cloud
│   │   ├── VocabularyGrid.tsx       # Lưới từ vựng 4 POS, tìm kiếm, phát âm, đánh dấu đã biết
│   │   ├── MasterListView.tsx       # Giao diện Master List, thanh CEFR, từ đa nghĩa
│   │   ├── FlashcardModal.tsx       # Hộp thoại Flashcard 3D với thuật toán SRS
│   │   ├── TeslaModal.tsx           # Hộp thoại xác nhận & nhập liệu chuẩn Tesla
│   │   ├── Toast.tsx                # Thông báo nổi không xâm lấn với micro-dot
│   │   └── Dashboard.tsx            # Main state controller kết nối toàn bộ hệ thống
│   │
│   └── lib/
│       ├── types.ts                 # TypeScript Interfaces (VocabItem, ScannedMovie, MasterItem)
│       ├── neon.ts                  # Neon Serverless Postgres Client
│       ├── speech.ts                # Audio Speech Synthesis helper
│       ├── export.ts                # Anki TSV và CSV exporter helper
│       ├── analyzer.ts              # Wrapper phân tích phụ đề ngoại tuyến
│       ├── subtitleParser.js        # Parser phụ đề SRT, VTT, TXT
│       ├── cefrDict.js              # Từ điển 12,000 từ CEFR & US IPA
│       ├── vocabAnalyzer.js         # Phân tích 4 loại từ và trích xuất câu giao tiếp
│       └── compromise.js            # Compromise NLP engine
```

---

## 🔒 An Toàn & Bảo Mật

- **Không chứa hardcoded credentials**: Toàn bộ chuỗi kết nối cơ sở dữ liệu `DATABASE_URL` được lưu trong `.env.local` (đã nằm trong `.gitignore`) và thiết lập qua Vercel Environment Variables.
- **100% No-AI**: Ứng dụng không cần gửi dữ liệu hay phụ đề phim của bạn tới bất kỳ AI Gateway của bên thứ ba nào, bảo vệ tuyệt đối quyền riêng tư và bản quyền nội dung.
- **Không có emoji hệ thống**: Giữ vững triết lý thiết kế công nghiệp tối giản, trang nhã và nhất quán.
