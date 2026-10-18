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
