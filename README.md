# Figma → PPT 디자인 에셋 / 편집 SaaS — 프로토타입

피그마에서 만든 **PPT 템플릿**을 웹에서 불러와 **텍스트·색상을 자유롭게 편집**하고,
편집본을 그대로 **.pptx 로 내보내는** SaaS의 프로토타입입니다.

```
prototype/
├── app/                  웹 에디터 (정적 — 서버 불필요)
│   ├── index.html        에디터 + 템플릿 갤러리
│   ├── assets.js         에셋 라이브러리 (템플릿 model 임베드)
│   └── pptxgen.bundle.js PptxGenJS (클라이언트 pptx 생성)
└── figma-plugin/         Figma 에셋 추출 플러그인
    ├── manifest.json
    ├── code.js
    └── ui.html
```

## 1) 웹 에디터 (`app/`)
- **완전 정적** — `app/index.html` 더블클릭으로 열거나, 정적 호스팅(Netlify/Vercel/GitHub Pages/S3+CDN)에 올리면 외부에서 그대로 동작합니다. (런타임에 Figma 연결 불필요)
- **기능**
  - 📁 **템플릿 갤러리**: 크기(16:9 / 4:3) × 종류(표지·목차·내지·종지) 필터 + 라이브 미리보기 → 선택해 로드
  - ✍️ **텍스트 편집**: 더블클릭 후 수정
  - 🎨 **색상 편집**: 요소별 글자색/채움/테두리 + 상단 **테마 색상**으로 같은 색 일괄 변경
  - 🧩 **오토레이아웃 카드**: 드래그로 그룹 내 순서 변경, 카드 삭제 시 나머지 자동 확장
  - ⬇️ **PPTX 다운로드**: 편집본을 크기에 맞춰(16:9 = 13.33×7.5″, 4:3 = 10×7.5″) 도형·텍스트로 출력 → PowerPoint에서 재편집 가능

### 실행
```bash
# 그냥 더블클릭해도 되고, 로컬 서버로:
cd app && python3 -m http.server 8080   # → http://localhost:8080
```
> 폰트: 템플릿은 **Freesentation** 기준. 시스템에 설치돼 있거나, 운영 시 웹폰트로 호스팅하세요.

## 2) Figma 플러그인 (`figma-plugin/`)
디자이너가 **프레임 선택 → 에셋 model JSON 으로 내보내기** → `app/assets.js` 에 붙여넣거나 백엔드로 POST.
설치/사용법은 [`figma-plugin/README.md`](figma-plugin/README.md) 참고.

## 에셋 = 템플릿 DB 의 씨앗
`assets.js` 의 `assets[]` 배열이 곧 템플릿 DB의 초안입니다.
SaaS 전환 시 이 배열을 **Postgres(JSONB) + CDN** 으로 옮기고, 갤러리가 API에서 목록을 받아오게 하면 됩니다.
유저 편집은 **오버라이드(변경분)만** 저장(현재 `card.ov` 패턴)하는 구조를 권장합니다.

## 로드맵
- [x] 정적 웹 에디터 + pptx 내보내기
- [x] 크기·종류별 에셋 라이브러리 + 갤러리
- [x] Figma 추출 플러그인 (flat statics)
- [ ] 플러그인: 오토레이아웃 그룹 자동 변환(레이어 네이밍 규칙)
- [ ] 백엔드(API + DB) + 에셋/폰트 CDN
- [ ] 서버사이드 pptx/pdf 내보내기

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
