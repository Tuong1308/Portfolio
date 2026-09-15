# Progress — Portfolio clean code refactor

> File này ghi lại những gì **đã thực sự hoàn thành**, cập nhật sau mỗi bước.
> Kế hoạch gốc: [`general_requirement.md`](general_requirement.md) · Báo cáo rà soát: [`.codereview/report-2026-09-15-1122.md`](.codereview/report-2026-09-15-1122.md) · Kiến trúc: [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

## Tổng quan

| Giai đoạn | Mốc | Trạng thái |
|---|---|---|
| 1. Làm rõ yêu cầu | `general_requirement.md` | ✅ Xong |
| 2. Rà soát (plan-refactor Pha 1) | Báo cáo 14 mục + 4 câu hỏi | ✅ Xong |
| 3. Áp dụng (plan-refactor Pha 2) | 11/11 mục đã duyệt được áp dụng | ✅ Xong |
| 4. Test + review + chuẩn bị PR | Parity test trước/sau, `PR-refactor-2026-09-15.md` | 🟡 Test cloud xong; còn kiểm tra tay trên máy |
| 5. Mục còn treo | M-02, M-03, H-04, Q-01…Q-04 | ⬜ Chưa làm |

---

## Nhật ký

### 1. Làm rõ yêu cầu — 2026-09-15
- [x] Đọc cấu trúc project (React 19 + Vite 8 + TS 6 + three 0.186, deploy Vercel)
- [x] Chốt: mục tiêu = dễ đọc + dọn code thừa; phạm vi = toàn bộ `src/` trừ `styles.css`; tiêu chí = build pass + dev chạy được
- [x] Ghi `general_requirement.md` (6 giả định G1–G6, 3 câu hỏi mở)

### 2. Rà soát — 2026-09-15 11:22
- [x] Quét 26 file, 4 lượt (naming, duplication, file-length, structure)
- [x] Kết quả: Cao 4 · Trung bình 6 · Thấp 4 · Câu hỏi 4
- [x] Xác nhận `src/Contact.tsx`, `src/SkillMarquee.tsx` là file chết, bản mới không mất tính năng (kể cả `FORM_ENDPOINT`)

### 3. Áp dụng — 2026-09-15
- [x] Sao lưu `src/` gốc → `.codereview/backup-2026-09-15/src/`
- [x] Mốc ban đầu: build ✓ 41 modules, oxlint 10 cảnh báo
- [x] Nhóm 1 — gỡ code chết: H-03 (prop `paused` luôn false trong `SkillMarquee`), L-01 (`PROFILE.title`), L-02 (bỏ export `Stage`, `SKILLS`)
- [x] Nhóm 2 — đổi tên: L-03 (handler `on`/`esc`/`move` → `onScroll`/`onKeyDown`/`onMove`/`onChange`), L-04 (`cb` → `onStageRef`, `fine` → `canHover`), M-06 (`h`/`p`/`yr` → `heading`/`summary`/`kind`)
- [x] Nhóm 3 — tách file/hàm: M-01 (`pipelineStages.ts`, `pipelineShaders.ts`), M-04 (`SkillsOrb`: `addLights`, `buildCages`, `buildNodes`, `buildHeart`), M-05 (`SkillMarquee`: `trackScrollKick`, `bindHoverPause`)
- [x] Kết quả: build ✓ 43 modules, oxlint 8 cảnh báo, headless browser thấy đủ 7 section / 3 canvas / 5 nhãn pipeline, không lỗi JS
- [x] H-01, H-02 — xóa `src/Contact.tsx`, `src/SkillMarquee.tsx` (commit `1b77b20`)

**Mốc:** refactor lần đầu áp dụng xong mà build và runtime không hồi quy.

### 4. Test, review, chuẩn bị PR — 2026-09-15
- [x] Parity test Playwright trên build production trước/sau (1280 + 390): 0 lỗi JS, nội dung giống hệt, canvas 3 = 3, hover quả cầu / menu mobile / ToTop / validate form giống nhau, diff ảnh 0.00–0.20%
- [x] tsc ✓, build ✓ (41 → 43 modules), oxlint 10 → 8
- [x] Review senior: không có lỗi chặn merge; 6 ghi chú không chặn (README cũ, gitignore backup, 2 nit, cảnh báo refs có sẵn, bundle lớn)
- [x] Viết `.codereview/PR-refactor-2026-09-15.md` (mô tả, bảng kiểm tra, checklist reviewer, gợi ý chia commit)
- [x] Push lên GitHub `Tuong1308/Portfolio`, nhánh `refactor/clean-code-2026-09-15`: `7b24641` refactor + `1b77b20` dọn file chết và artefact local. Clone lại từ GitHub: `src/` khớp bản đã test, build ✓
- [ ] Tạo `main` / mở PR (nhánh hiện là nhánh duy nhất trên repo)
- [ ] `npm run build` trên Windows
- [ ] `npm run dev` — xem lại bằng mắt quả cầu kỹ năng (M-04), pipeline (M-01), dải kỹ năng (M-05)
- [ ] Cập nhật mục "Structure" trong `README.md` (thêm 2 file mới trong `three/`)

### 5. Mục còn treo
- [ ] M-02 — tách `useEffect` ~300 dòng của `PipelineScene` (bạn chưa duyệt)
- [ ] M-03 — tách `useEffect` ~215 dòng của `HeroScene` (bạn chưa duyệt)
- [ ] H-04 — gộp đoạn dispose WebGL lặp ở 3 scene (cần test hoặc kiểm tra hình ảnh trước)
- [ ] Q-01 reduced-motion đọc 1 lần vs live · Q-02 danh sách skill ở 3 nơi · Q-03 `ABOUT_FACTS` ghi cứng · Q-04 nghĩa của `kind`

---

## Vấn đề / quyết định

- **2026-09-15 — Shell trên máy không mount được thư mục** (lỗi Windows update 08/09). Build/dev phải chạy trên bản sao trong cloud; file sửa được ghi ngược về máy. Hệ quả: không xóa được file → H-01, H-02 chờ xóa tay.
- **2026-09-15 — Không có git.** Thay bằng sao lưu thủ công trong `.codereview/backup-2026-09-15/`. Nên `git init` trước lần refactor sau.
- **2026-09-15 — Bỏ M-02, M-03** theo quyết định của bạn: rủi ro lệch hình ảnh WebGL khi chỉ kiểm tra được bằng build. Chỉ làm M-04.
- **2026-09-15 — Áp dụng các mục đổi export** (M-01, M-06, L-01, L-02) sau khi bạn xác nhận riêng.
- **2026-09-15 — Q-04 chốt tạm `yr` → `kind`**; class CSS `yr` giữ nguyên để không đổi giao diện.
- **2026-09-15 — Lần 2 thử xóa H-01, H-02 vẫn không được** (shell trên máy vẫn lỗi mount; công cụ ghi file không xóa được). Đã xóa trong bản test ở cloud và kiểm tra build/runtime không có 2 file; trên máy cần xóa tay.
- **2026-09-15 — Code được push từ thư mục trên máy thành 1 commit** (không dùng bundle 4 commit), nên repo không có `main` gốc để so diff. Lần push đầu lẫn backup/bundle/bat và còn 2 file chết; đã dọn bằng commit `1b77b20`. Lưu ý: nhánh trên máy tên `master`, trên GitHub tên `refactor/clean-code-2026-09-15` → phải push kèm tên nhánh (`git push origin master:refactor/clean-code-2026-09-15`).
- **2026-09-15 — Chưa có git nên chưa mở PR thật**; mô tả PR + gợi ý chia commit viết sẵn để dùng khi `git init`.
- **2026-09-15 — `PipelineScene.tsx` còn 321 dòng** sau M-01, vẫn trên ngưỡng 300; phần còn lại cần M-02.
