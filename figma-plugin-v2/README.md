# PPT 섹션 라이브러리 v2 — Figma 플러그인

디자이너가 Figma에서 만든 **섹션 블록**을 v2 빌더 모델(트리 + 색상 6역할)로 등록해 라이브러리/백엔드에 공급합니다.
유저는 빌더의 **＋섹션 추가**에서 이 섹션들을 골라 페이지에 끼워넣고 빈칸만 채웁니다.

> 옛 `figma-plugin/`(PPT Library Manager, statics 모델)과 **별개**입니다. 옛 것은 보존, 이 v2를 새로 임포트해 사용.

## 설치
Figma Desktop → Plugins → Development → **Import plugin from manifest…** → `figma-plugin-v2/manifest.json`

## 개념
- **섹션 = 프레임 1개** → 단일 v2 노드. 여러 프레임 선택 시 각각 1섹션으로 등록.
- 템플릿(완성 슬라이드)은 플러그인이 아니라 **어드민(웹 빌더)**에서 섹션을 조립해 저장합니다.

## 직렬화 방식 — 충실(faithful) 보존 (깨짐 방지)
**디자인한 그대로**(위치·크기·비율) `fig` 노드(절대배치)로 직렬화합니다. 빌더는 원본 w×h를 칸에 종횡비 유지로 맞춰 렌더 → **레이아웃이 절대 깨지지 않습니다.** (옛 '균등 분배' 방식은 폐기 — 그게 깨짐의 원인이었음)
- 텍스트 → 편집 가능한 텍스트(위치·폰트·크기·색 보존)
- 단색 도형/배경 → 색 사각형(둥근모서리·테두리 보존)
- 사진 채움 → JPG, 벡터/아이콘/텍스트 없는 그룹 → 고화질 PNG로 통째 보존

## 디자이너 작성 규약 (간단)
1. 섹션으로 쓸 **프레임 선택**. 오토레이아웃이든 절대배치든 **그린 그대로** 들어옵니다(특별한 규칙 불필요).
2. **색상 6역할(선택) = Figma Variables**: 색 변수 이름을 `accent / bg / surface / text / subtext / line` 으로 만들고 바인딩하면, 빌더 테마에 맞춰 자동 retone(특히 `accent`=덱 포인트색). → **🎨 색역할 스캔**으로 확인. 안 써도 원본 색 그대로 보존.
3. 텍스트는 유저가 편집할 부분이면 명확한 placeholder 문구로(예: "채팅내용").

## 사용
1. 프레임 선택 → 이름·카테고리·태그 입력 → **섹션 등록**
2. 라이브러리 탭의 동기화 URL(기본 `https://prototype-sigma-weld.vercel.app/api/library`)로 **등록 즉시 자동 push**
3. 빌더에서 ＋섹션 추가 → 등록한 섹션이 카드로 떠 클릭 삽입

## 출력 스키마 (api/library 의 `sections[]`)
```jsonc
{ "id","v":2,"kind":"section","name","category","tags":[],
  "theme":{ "accent","bg","surface","text","subtext","line" },   // 6역할 hex(미바인딩=null)
  "node": { "t":"frame|card|block", … },                          // v2 서브트리(역할색 포함)
  "w","h","preview" }
```

## 다음
표/막대 데이터 추출, 슬롯(빈칸 안내문), 컴포넌트/Variants 수용, 카테고리/검색 큐레이션.
