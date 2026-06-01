# PPT Asset Exporter — Figma 플러그인

피그마에서 **프레임을 선택 → 웹 에디터용 에셋(model JSON)으로 내보내기**.
디자이너가 직접 에셋을 추가할 수 있어, 수동 추출 과정을 없앱니다.

## 설치 (개발 모드)
1. Figma Desktop → 메뉴 → **Plugins → Development → Import plugin from manifest…**
2. `figma-plugin/manifest.json` 선택
3. Plugins → Development → **PPT Asset Exporter** 실행

## 사용법
1. 내보낼 **프레임(또는 컴포넌트) 하나를 선택**
2. 플러그인 실행 → 자동으로 직렬화됨
3. **에셋 이름 / 종류(표지·목차·내지·종지)** 입력 (크기·치수·요소 수는 자동 표시)
4. 다음 중 하나로 등록:
   - **📋 복사** → `app/assets.js` 의 `assets:[ … ]` 배열에 붙여넣기
   - **⬇ JSON 다운로드** → 파일로 저장
   - **🚀 전송** → 백엔드 URL 입력 후 POST (SaaS 연동용)

## 출력 스키마
```jsonc
{
  "id": "시장의-문제점-16x9",
  "name": "시장의 문제점",
  "type": "내지",
  "size": "16:9",
  "model": {
    "size": "16:9", "w": 1920, "h": 1080, "bg": "#f7f5ef",
    "statics": [
      { "id":"t0", "type":"text", "x":60,"y":124,"w":1760,"h":62,
        "text":"…", "size":48, "weight":700, "color":"#5f4d42",
        "align":"left", "valign":"top", "lh":1.2 },
      { "id":"r1", "type":"rect", "x":60,"y":212,"w":600,"h":71,
        "fill":"#5f4d42", "radius":0, "line":{ "color":"#…","w":1.5 } }
    ],
    "groups": []
  }
}
```

## 동작 규칙
- 좌표는 프레임 기준 절대 좌표(px)로 변환됩니다.
- `TEXT` → text 요소(폰트 크기·굵기·색·정렬·행간 추출).
- 채움이 있는 `RECTANGLE/FRAME` → rect 요소(채움·모서리·테두리). 자식이 있으면 위에 다시 렌더.
- `LINE` → 얇은 rect 로 변환.
- **이미지 채움**은 플레이스홀더 박스로 들어가며 경고 표시 → 실제 로고/아이콘은 CDN 에셋 URL로 별도 등록 권장.
- 크기는 비율로 자동 판별(16:9 / 4:3 / custom).

## 한계 & 다음 단계
- 현재는 **flat `statics`** 로 내보냅니다(텍스트·색상 편집 가능).
- 에디터의 **오토레이아웃 그룹**(카드 삭제 시 자동 확장 등)은 아직 수동 정의입니다.
  → 다음 버전: 레이어 이름 규칙(`#group:row`, `#card`, `#role:title`)을 읽어 `groups` 로 자동 변환.
