# Clean code refactor — Portfolio (src/)

## 1. Bối cảnh và vấn đề
Project portfolio cá nhân (React 19 + Vite + TypeScript + three.js, deploy Vercel) đã qua nhiều vòng chỉnh sửa. Hệ quả: còn sót file cũ không được dùng (ví dụ `src/Contact.tsx`, `src/SkillMarquee.tsx` song song với `src/sections/Contact.tsx`, `src/components/SkillMarquee.tsx`), và có thể có trùng lặp logic, đặt tên chưa nhất quán. Người bảo trì (chủ portfolio) mất thời gian khi đọc/sửa vì không chắc file nào là bản thật.

## 2. Mục tiêu
- Code trong `src/` dễ đọc, dễ bảo trì hơn: tên rõ nghĩa, hàm/component gọn, không trùng lặp.
- Không còn file/code chết: mọi file trong `src/` đều đang được sử dụng.
- Người xem trang web không nhận thấy bất kỳ khác biệt nào.

## 3. Phạm vi
### Trong phạm vi
- Toàn bộ `src/`: `App.tsx`, `main.tsx`, `data.ts`, `hooks.ts`, `components/`, `sections/`, `three/` (HeroScene, PipelineScene, SkillsOrb).
- Xóa file, export, biến, import, CSS class không còn được dùng *bên trong* code TS/TSX.
- Gộp logic trùng lặp (vd. bộ icon định nghĩa lại trong file cũ so với `components/icons.tsx`).

### Ngoài phạm vi
- Thay đổi giao diện, animation, nội dung chữ, dữ liệu cá nhân trong `data.ts`.
- Thêm tính năng, sửa bug logic, tối ưu hiệu năng.
- Nâng cấp/thêm/bỏ thư viện trong `package.json`.
- `qa/*.mjs`, `README.md`, file config (`vite.config.ts`, `tsconfig*`, `.oxlintrc.json`, `vercel.json`, `index.html`).
- Refactor `styles.css` (dù nằm trong `src/`) — chỉ được xóa selector chắc chắn không còn dùng nếu phát sinh do xóa component; không tổ chức lại file CSS. *(xem giả định G2)*
- Đổi cấu trúc thư mục hiện tại (`components/`, `sections/`, `three/`).

## 4. Mô tả chi tiết
### 4.1 Dọn file chết
- Một file được coi là "chết" khi không được import (trực tiếp hoặc gián tiếp) từ `src/main.tsx`.
- Ứng viên đã thấy: `src/Contact.tsx` (có FORM_ENDPOINT, bộ Icon riêng), `src/SkillMarquee.tsx`. Phải xác nhận không còn import nào trỏ tới trước khi xóa.
- Trước khi xóa, đối chiếu với bản đang dùng: nếu file cũ có hành vi mà bản mới không có, **không tự gộp** — ghi lại vào báo cáo để chủ project quyết định.

### 4.2 Làm sạch code đang dùng
- Đặt tên biến/hàm/component thể hiện đúng ý nghĩa, nhất quán quy ước trong project.
- Loại bỏ trùng lặp giữa các component/section.
- Xóa import, biến, export không dùng; xóa code bị comment-out.
- Giữ nguyên các comment giải thích "tại sao" (project đang dùng nhiều comment dạng này).
- Ba scene three.js: được phép làm sạch, nhưng không đổi shader, tham số hình ảnh, hay thứ tự khởi tạo/dispose của WebGL.

### 4.3 Cách thực hiện ở mức quy trình
- Chia theo nhóm file, mỗi nhóm kiểm tra build riêng để dễ khoanh vùng khi có lỗi.
- Có danh sách thay đổi (file xóa, file sửa, lý do) để chủ project duyệt.

## 5. Tiêu chí hoàn thành
- [ ] `npm run build` (tsc -b + vite build) chạy thành công, không lỗi TypeScript.
- [ ] `npm run dev` khởi động được và trang mở tại localhost không có lỗi đỏ trong console trình duyệt.
- [ ] Cả 7 section (Hero, About, Experience, Projects, Skills, Education, Contact) hiển thị khi cuộn trang ở `npm run dev`.
- [ ] Không còn file nào trong `src/` mà không được import từ `main.tsx`.
- [ ] `src/Contact.tsx` và `src/SkillMarquee.tsx` đã bị xóa (hoặc có ghi chú lý do giữ lại).
- [ ] Không có thay đổi nào trong `package.json`, `qa/`, file config.
- [ ] Nội dung hiển thị lấy từ `data.ts` không đổi.
- [ ] Có danh sách thay đổi kèm lý do cho từng file.

## 6. Trường hợp biên và cách xử lý
| Tình huống | Hành vi mong muốn |
|---|---|
| File "chết" có tính năng bản đang dùng không có (vd. `FORM_ENDPOINT` trong `src/Contact.tsx`) | Không gộp tự động; ghi vào báo cáo, hỏi chủ project trước khi xóa |
| Một file chỉ được `qa/*.mjs` hoặc `index.html` tham chiếu, không qua `main.tsx` | Không coi là file chết; giữ nguyên |
| CSS class chỉ dùng trong file bị xóa | Được xóa selector đó; nếu không chắc có nơi khác dùng (vd. class tạo động bằng chuỗi) thì giữ |
| Dọn code trong scene three.js làm hình ảnh/animation khác đi | Hoàn tác thay đổi đó, giữ bản cũ |
| Refactor khiến build pass nhưng dev báo lỗi runtime | Coi là chưa đạt; hoàn tác nhóm thay đổi gây lỗi |
| File dài (three/*.tsx >200 dòng) | Không bắt buộc tách; README đã chấp nhận ngoại lệ này |
| Thư mục `node_modules`, `dist` | Không đụng |

## 7. Ràng buộc
- Giữ nguyên stack và phiên bản: React 19, Vite 8, TypeScript ~6.0, three 0.186, oxlint.
- Không thêm dependency mới.
- Project deploy trên Vercel: output `dist/` phải build được như hiện tại.
- Máy làm việc là Windows.

## 8. Giả định chưa xác nhận
- **G1**: `src/Contact.tsx` và `src/SkillMarquee.tsx` là bản cũ, không còn giá trị. Nếu sai → mục 4.1 phải đổi từ "xóa" sang "gộp".
- **G2**: `styles.css` không nằm trong mục tiêu refactor dù ở trong `src/`. Nếu sai → phải bổ sung phạm vi và tiêu chí so sánh giao diện.
- **G3**: Kiểm tra bằng mắt khi chạy `npm run dev` là đủ; không cần chạy `qa/*.mjs` hay so screenshot. Nếu sai → mục 5 cần thêm tiêu chí QA script/visual diff.
- **G4**: `npm run lint` không bắt buộc sạch (không được chọn làm tiêu chí). Nếu sai → thêm vào mục 5.
- **G5**: Không có deadline cụ thể.
- **G6**: Không cần giữ lịch sử của file bị xóa ngoài git (giả định project có git hoặc có bản sao lưu).

## 9. Câu hỏi còn mở
- Có muốn giữ khả năng POST form qua endpoint (`FORM_ENDPOINT`) như trong file cũ không? — chủ project.
- Có muốn cập nhật `README.md` phần "Structure" nếu cấu trúc file thay đổi không? — chủ project.
- Refactor nên làm trên branch riêng / nhiều commit nhỏ hay một lần? — chủ project.
