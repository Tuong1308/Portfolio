# refactor(src): clean code pass — dead files, naming, split long scene/marquee code

## Tóm tắt

Refactor thuần, **không đổi hành vi hay giao diện**. Dọn 2 file chết, gỡ prop luôn `false`, đổi tên cho rõ nghĩa, tách phần dữ liệu/shader khỏi `PipelineScene` và tách hàm dài trong `SkillsOrb`, `SkillMarquee`.

- Yêu cầu: `general_requirement.md`
- Báo cáo rà soát + trạng thái từng mục: `.codereview/report-2026-09-15-1122.md`
- Kiến trúc sau refactor: `ARCHITECTURE.md`

## Thay đổi

| ID | File | Thay đổi |
|---|---|---|
| H-01 | `src/Contact.tsx` | Xóa — bản cũ, không được import; mọi tính năng đã có ở `sections/Contact.tsx` + `ContactForm.tsx` |
| H-02 | `src/SkillMarquee.tsx` | Xóa — bản cũ, không được import |
| H-03 | `components/SkillMarquee.tsx` | Bỏ prop `paused` (luôn `false`, đổi tên thành `stopped`, trùng tên biến nội bộ) và các nhánh chết |
| M-01 | `three/PipelineScene.tsx` → `three/pipelineStages.ts`, `three/pipelineShaders.ts` | Tách `STAGES` và GLSL; `Experience.tsx` import `STAGES` từ file mới. 356 → 321 dòng |
| M-04 | `three/SkillsOrb.tsx` | Tách `addLights`, `buildCages`, `buildNodes`, `buildHeart`; giữ nguyên thứ tự `add` |
| M-05 | `components/SkillMarquee.tsx` | Tách `trackScrollKick`, `bindHoverPause` khỏi `useEffect` 78 dòng |
| M-06 | `data.ts`, `Experience.tsx`, `Education.tsx` | `h` → `heading`, `p` → `summary`, `yr` → `kind` (class CSS `yr` giữ nguyên) |
| L-01 | `data.ts` | Xóa `PROFILE.title` không dùng |
| L-02 | `PipelineScene.tsx`, `SkillsOrb.tsx` | Bỏ export `Stage`, `SKILLS` chỉ dùng nội bộ (hết 1 cảnh báo `only-export-components`) |
| L-03 | `hooks.ts`, `Nav.tsx`, `ToTop.tsx`, `GlowCursor.tsx` | Handler: `on`/`esc`/`move` → `onScroll`/`onKeyDown`/`onChange`/`onMove` |
| L-04 | `PipelineScene.tsx` | `cb` → `onStageRef`, `fine` → `canHover` |

**12 file sửa/thêm, 2 file xóa.** Không đổi `package.json`, config, `styles.css`, `qa/`.

## Cố ý không làm trong PR này

| ID | Lý do |
|---|---|
| H-04 gộp dispose WebGL ở 3 scene | Không có test phủ; để PR riêng |
| M-02, M-03 tách `useEffect` của `PipelineScene`, `HeroScene` | Rủi ro lệch hình ảnh; chưa duyệt |
| Q-01 … Q-04 | Cần quyết định nghiệp vụ |

## Kiểm tra

Chạy trên bản build production (`vite preview`) của **trước** và **sau** refactor, cùng kịch bản Playwright + Chromium (WebGL qua SwiftShader), 2 viewport 1280 và 390.

| Kiểm tra | Trước | Sau |
|---|---|---|
| `tsc -b` | ✓ | ✓ |
| `vite build` | ✓ 41 modules | ✓ 43 modules (+2 file tách) |
| `oxlint src` | 10 cảnh báo | 8 cảnh báo, **không cảnh báo mới** |
| Lỗi JS / `pageerror` (cả 2 viewport) | 0 | 0 |
| Nội dung `main.innerText` | — | **giống hệt**, trừ chữ đang gõ dở của typewriter (phụ thuộc thời điểm) |
| Nhãn pipeline, nav, heading Experience, nhãn Education | — | giống hệt |
| Số canvas WebGL | 3 | 3 |
| Marquee nghiêng khi cuộn (scroll kick) | ✓ | ✓ |
| Hover quả cầu hiện nhãn skill | ✓ | ✓ |
| Menu mobile mở / đóng bằng Esc (`inert`) | ✓ | ✓ |
| Nút ToTop hiện khi cuộn | ✓ | ✓ |
| Form trống → 3 lỗi validate | ✓ | ✓ |
| Diff ảnh chụp 7 section × 2 viewport | — | 0.00–0.20% pixel khác (vùng animation/typewriter) |

Kịch bản: `.codereview/parity-2026-09-15.mjs`.

**Giới hạn của kiểm tra:** vài phép đo marquee (đang chạy / dừng khi hover) cho kết quả giống nhau ở trước và sau, nhưng không đáng tin trong headless (dải có thể nằm ngoài vùng quan sát lúc đo). Scene 3D chạy bằng WebGL phần mềm. → Cần xem tay trên trình duyệt thật, mục checklist bên dưới.

## Checklist cho reviewer

- [ ] `npm ci && npm run build` trên máy
- [ ] `npm run dev`: quả cầu kỹ năng xoay, kéo được, hover hiện tên (M-04)
- [ ] Pipeline: packet chạy, node sáng lần lượt, legend bên dưới đổi theo (M-01, L-04)
- [ ] Dải kỹ năng: chạy liên tục, dừng khi rê chuột, nghiêng khi cuộn (H-03, M-05)
- [ ] Mobile 390px: menu mở/đóng, Esc đóng menu (L-03)
- [ ] Xác nhận tên `kind` cho field Education (Q-04)

## Ghi chú review (senior)

Không thấy lỗi chặn merge. Các ý kiến không chặn:

1. **`README.md` mục Structure đã cũ** — thiếu `three/pipelineStages.ts`, `three/pipelineShaders.ts`. README nằm ngoài phạm vi requirement; đề xuất sửa trong cùng PR hoặc follow-up ngay.
2. **Không commit `.codereview/backup-2026-09-15/`** — đó là sao lưu thủ công do chưa có git. Đề xuất thêm `.codereview/backup-*/` vào `.gitignore` hoặc xóa sau khi merge.
3. **`trackScrollKick().decay`** viết `() => (kick *= 0.9)` — gán trong biểu thức, đúng nhưng hơi khó đọc. Nit, có thể đổi thành thân hàm 2 dòng.
4. **`buildHeart` thiếu doc comment** trong khi 3 hàm cùng nhóm có. Nit.
5. **Cảnh báo `react(refs)` tại `PipelineScene.tsx:20`** (`onStageRef.current = onStage` trong render) có từ trước, chỉ đổi tên. Không xử lý trong PR refactor; nên tách ticket.
6. **Bundle 829 kB** (three.js) — không liên quan PR này; ghi nhận cho tối ưu sau.

## Gợi ý chia commit

Dự án chưa có git. Nếu khởi tạo, nên tạo commit gốc từ bản sao lưu rồi mới đưa refactor vào để diff review được:

```bash
git init
# 1) baseline: code trước refactor (lấy từ .codereview/backup-2026-09-15/src)
git add -A && git commit -m "chore: baseline before refactor"
# 2) các commit refactor, theo thứ tự rủi ro tăng dần
git commit -m "refactor: remove dead Contact/SkillMarquee copies and always-false marquee prop (H-01 H-02 H-03 L-01 L-02)"
git commit -m "refactor: clearer handler and data field names (L-03 L-04 M-06)"
git commit -m "refactor: split pipeline stages/shaders, orb builders, marquee helpers (M-01 M-04 M-05)"
```
