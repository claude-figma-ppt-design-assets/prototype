# Figma → PPT 템플릿 빌더 (사업자용) — 프로토타입

사업자용 PPT 템플릿의 **Canva** 같은 웹 덱 빌더 + 피그마 연동 라이브러리 관리.
사업계획서 / IR Deck / 제안서 등 **여러 페이지 템플릿**을 불러오고, **요소를 페이지에 삽입**해
편집한 뒤 **.pptx로 내보냅니다.** 완전 정적이라 외부 호스팅·파일 더블클릭 모두 동작.

```
prototype/                  ← Vercel 루트 그대로 배포 (index.html 이 루트에 있음)
├── index.html              에디터(페이지·캔버스·템플릿/요소/속성/AI 탭)
├── library.js              라이브러리(TEMPLATES 덱 + ELEMENTS 삽입요소)
├── pptxgen.bundle.js
└── figma-plugin/           PPT Library Manager (Figma 플러그인)
    ├── manifest.json · code.js · ui.html · README.md
```

> **Vercel 배포**: 이 저장소를 그대로 import 하면 됩니다(루트에 `index.html` 존재 → 빌드 설정 불필요).
> 만약 하위 폴더 구조로 둔다면 Vercel 프로젝트 설정의 **Root Directory** 를 해당 폴더로 지정하세요.

## 1) 웹 덱 빌더 (루트)
- **왼쪽 페이지 패널**: 썸네일 목록, **드래그 앤 드롭 순서변경**, 추가/삭제
- **가운데 캔버스**: 텍스트 더블클릭 편집, **요소 드래그 이동**, **빈 곳 드래그=영역(다중) 선택**, **Shift+클릭 다중선택**, 함께 이동, **Delete 삭제**
- **오른쪽 탭**
  - **📚 템플릿**: 검색·카테고리 + **작업 사이즈 16:9 / 4:3 택1**. 카드 클릭 → 모든 페이지 미리보기 → `새로 시작` / 체크한 페이지만 `덱에 추가`
  - **🧩 요소**: 검색·카테고리 → 클릭 시 **현재 페이지 중앙에 삽입**(작업 사이즈에 맞게 자동 스케일)
  - **⚙ 속성**: 글자/색/크기/정렬, 오토레이아웃 카드 삭제·순서, 다중선택 일괄 색/삭제
  - **✨ AI**: 설명 입력 → 템플릿 + 색상 추천(키워드 스텁 → 추후 Claude API)
- **상단**: ↶/↷ **실행취소·다시실행**(⌘Z / ⌘⇧Z), 🌙/☀️ **다크·화이트 토글**, **덱 전체 PPTX**
- 16:9 = 13.33×7.5″, 4:3 = 10×7.5″ 로 사이즈별 출력. PowerPoint에서 재편집 가능.

### 실행
```bash
python3 -m http.server 8080   # 루트에서 실행, 또는 index.html 더블클릭
```
> 폰트는 **Freesentation** 기준. 시스템 설치 또는 운영 시 웹폰트로 호스팅.

## 2) Figma 플러그인 — PPT Library Manager (`figma-plugin/`)
- 프레임 다중선택 → **템플릿(여러 페이지)** 등록 / 단일 → **요소** 등록
- **라이브러리 탭**에서 등록된 템플릿·요소를 **썸네일로 조회**, 삭제, `library.js`로 내보내기·백엔드 전송
- 설치/사용: [`figma-plugin/README.md`](figma-plugin/README.md)

## 🔗 자동 연동 (Vercel KV) — 피그마 등록분이 앱에 자동 표시
플러그인 등록분을 **공용 원격 저장소**에 두고, 앱이 시작 시 불러옵니다.
```
[Figma 플러그인] --POST--> [/api/library + Vercel KV] <--GET-- [웹 앱(시작 시 병합)]
```
- `api/library.js` : 서버리스 함수 (GET 전체조회 / POST 병합저장 / DELETE). 저장소 = **Vercel KV(Upstash)**.
- 앱: 시작 시 `GET /api/library` → 내장 시드 + 원격 등록분을 **id 기준 병합** (없으면 시드만).
- 플러그인: 라이브러리 탭 **"🚀 앱에 동기화"** 칸에 `https://<프로젝트>.vercel.app/api/library` 입력 → 전송.

### 설정 (한 번만)
1. Vercel 대시보드 → 프로젝트 → **Storage → Create Database → KV** → 이 프로젝트에 **Connect**
   (env `KV_REST_API_URL`, `KV_REST_API_TOKEN` 자동 주입 → 자동 재배포)
2. Figma 플러그인 → 라이브러리 탭 → 동기화 URL 입력 후 **🚀 앱에 동기화**
3. 웹앱 새로고침 → 등록한 템플릿·요소가 보임 ✅
> KV 미연결 시 `/api/library`는 500을 반환하고, 앱은 조용히 **내장 시드만** 사용합니다(앱은 정상 동작).

## 📦 저장 용량 / 확장성 점검
현재 저장 모델: **단일 KV 키 `ppt_library`** 에 `{templates,elements}` 전체 JSON 1개.
읽기=전체 GET, 쓰기=전체 다시 SET(POST마다 read-whole→write-whole).

**대략 크기**
- 요소 1개 ≈ 1~2.5KB · 템플릿 페이지 1장 ≈ 1.5~10KB · 4페이지 템플릿 ≈ 15~40KB
- 템플릿 50개 ≈ ~1.5MB, 요소 200개 ≈ ~0.3MB

**판정**
- 🟢 **프로토타입(수십 개 이하): 전혀 부담 없음.** 블롭 수백 KB, 쓰기 빈도 낮음.
- 🟠 **단일-블롭 구조라 확장성은 나쁨.** 대략 **템플릿 수십 개(~1MB)** 넘으면:
  - KV 단일 값/요청 한도(무료 ~1MB)에 근접 → 쓰기 실패 위험
  - **앱 로드마다 전체를 받음** → 읽기 트래픽이 라이브러리 크기 × 접속수로 선형 증가
  - POST마다 전체 재기록(O(N))

**확장 시 개선(필요해질 때)**
1. **인덱스 + 항목별 키 분리**: `idx`(id·name·type·size 만, 가벼움) + `tpl:<id>`/`el:<id>`(본문). 앱은 인덱스만 받아 갤러리 표시 → 템플릿 열 때 본문 **lazy-load**. 로드 비용이 라이브러리 크기와 무관해짐.
2. **GET 캐싱(CDN, s-maxage)** — 목록은 자주 안 바뀌므로 edge 캐시로 읽기↓.
3. 썸네일은 **이미지(R2/S3+CDN)**, DB엔 URL만.
4. 본격 규모 → **Postgres/Supabase(JSONB row per item)** + 검색 인덱스·페이지네이션·워크스페이스(멀티테넌트) 분리.

> 지금 단계에서는 **추가 작업 불필요**. 위 1·2번은 “템플릿 수십 개를 넘기 시작할 때” 도입하면 됩니다.

## SaaS 전환 메모
`library.js`(TEMPLATES/ELEMENTS)가 곧 DB 초안. **Postgres(JSONB)+CDN**으로 옮기고
유저 편집은 **오버라이드만** 저장(`card.ov` 패턴). 플러그인 등록분을 API로 동기화하면 디자이너가 직접 라이브러리 확장.

## 로드맵
- [x] 정적 웹 덱 빌더 + pptx, 템플릿/요소 라이브러리, 갤러리/검색
- [x] 멀티페이지·DnD, 마퀴·다중선택, Undo/Redo, 다크/화이트, 사이즈 택1+자동 스케일
- [x] Figma 라이브러리 매니저 플러그인(등록/조회/내보내기)
- [ ] 플러그인: 오토레이아웃 그룹 자동 변환, 백엔드(API+DB)+CDN, 서버 pptx/pdf, AI 실연동

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
