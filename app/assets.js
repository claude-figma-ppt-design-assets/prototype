/* =====================================================================
   PPT 에셋 라이브러리 (정적 임베드 — file://·정적호스팅 양쪽에서 동작)
   구조: 크기(16:9 / 4:3) × 종류(표지/목차/내지/종지) → 에셋 목록
   각 에셋.model = { size, w, h, bg, statics:[...], groups:[...] }
   ===================================================================== */
(function(){
  const t = (o)=> Object.assign({type:'text', weight:400, color:'#15100e', align:'left', valign:'top', lh:1.3, size:24}, o);
  const r = (o)=> Object.assign({type:'rect', fill:'#ffffff', radius:0}, o);

  // ---------- 내지 (16:9) : 시장의 문제점 (Figma slide 04 실제 추출) ----------
  const INJI_MARKET = {
    size:'16:9', w:1920, h:1080, bg:'#f7f5ef',
    statics:[
      r({id:'badgeRect', x:60,y:60,w:256,h:48, fill:'#b39258', radius:6}),
      t({id:'badgeTxt', x:60,y:60,w:256,h:48, text:'문제인식(Problem)', size:30, weight:700, color:'#ffffff', align:'center', valign:'middle', lh:1.2}),
      t({id:'subtitle', x:332,y:60,w:520,h:48, text:'창업아이템 목표시장(고객) 현황 및 필요성', size:32, weight:600, color:'#b39258', valign:'middle', lh:1.2}),
      t({id:'logo', x:1460,y:58,w:360,h:48, text:'LIFLOW', size:30, weight:700, color:'#5f4d42', align:'right', valign:'middle', lh:1.2}),
      t({id:'title', x:60,y:124,w:1760,h:62, text:'시장의 문제점 ─ 5060세대의 온라인 식품 구매 장벽', size:48, weight:700, color:'#5f4d42', valign:'top', lh:1.2}),
      r({id:'lhBar', x:60,y:212,w:600,h:71, fill:'#5f4d42'}),
      t({id:'lhTxt', x:60,y:212,w:600,h:71, text:'온라인 식품 시장 현황', size:46, weight:700, color:'#ffffff', align:'center', valign:'middle', lh:1.2}),
      r({id:'btmBar', x:690,y:885,w:1170,h:94, fill:'#5f4d42', radius:10}),
      t({id:'btmTxt', x:784,y:885,w:990,h:94, text:'5060세대는 한 번 신뢰를 주면 절대 이탈하지 않는다. 그 신뢰를 얻는 과정이 기존 이커머스에는 부재했다.', size:28, weight:700, color:'#ffffff', valign:'middle', lh:1.2}),
      t({id:'pageNo', x:1780,y:1000,w:60,h:40, text:'04', size:24, weight:400, color:'#b59b6c', align:'right', valign:'top', lh:1.3}),
    ],
    groups:[
      { id:'leftStats', dir:'col', x:60, y:301, w:600, h:678, gap:18, label:'온라인 식품 시장 현황 (좌측 통계)',
        cards:[
          { id:'ls1', pillW:196, t:{pill:'국내 온라인 식품 시장', num:'70조', desc:'연간 시장 규모 (TAM), 매년 15% 이상 성장 중'}, ov:{} },
          { id:'ls2', pillW:248, t:{pill:'5060세대 온라인 구매 비중', num:'38%', desc:'전체 온라인 식품 구매자 중 5060 비중 (급증 추세)'}, ov:{} },
          { id:'ls3', pillW:172, t:{pill:'5060 재구매 의향', num:'72%', desc:'한 번 신뢰를 얻으면 재구매 의향이 압도적으로 높음'}, ov:{} },
        ]},
      { id:'rightCols', dir:'row', x:690, y:212, w:1170, h:655, gap:18, label:'문제점 카드 (우측 컬럼)',
        cards:[
          { id:'rc1', t:{icon:'✆', title:'복잡한 앱 UI/ 디지털 진입 장벽', body:'기존 이커머스 앱은 젊은 세대 중심으로 설계되어 5060세대에게 복잡하고 낯선 인터페이스를 제공합니다.', stat:'5060 앱 이탈률\n대형 플랫폼 대비 2.3배 높음'}, ov:{} },
          { id:'rc2', t:{icon:'▦', title:'정보 과잉으로 인한 선택 피로도', body:'수천 개의 상품과 광고 속에서\n무엇을 믿고 살지 판단하기 어렵습니다.\n큐레이션 없는 정보는 오히려\n구매를 막습니다.', stat:'5060 구매 결정 소요 시간\n평균 18분 (2030의 3배)'}, ov:{} },
          { id:'rc3', t:{icon:'?', title:'품질에 대한 불신 및 불안감', body:'직접 보고 만질 수 없는\n온라인 식품 구매에서 5060세대는\n품질 신뢰를 가장 중요하게 여깁니다.', stat:'5060 온라인 식품\n구매 포기 이유 1위 "품질 불신"'}, ov:{} },
        ]},
    ]
  };

  // ---------- 표지 (4:3) : 다크 커버 (Figma 실제 추출) ----------
  const COVER_43 = {
    size:'4:3', w:1024, h:768, bg:'#171717',
    statics:[
      t({id:'logo', x:60,y:78,w:360,h:32, text:'FUNDABLE', size:26, weight:700, color:'#ffffff', valign:'middle', lh:1}),
      t({id:'title', x:60,y:141,w:900,h:60, text:'타이틀', size:54, weight:700, color:'#ffffff', valign:'top', lh:1.05}),
      t({id:'subtext', x:60,y:214,w:820,h:32, text:'서브텍스트', size:24, weight:500, color:'#ffffff', valign:'top', lh:1.2}),
      r({id:'line', x:60,y:624,w:904,h:2, fill:'#ffffff'}),
      t({id:'fL1t', x:60,y:648,w:160,h:24, text:'타이틀', size:20, weight:500, color:'#ffffff'}),
      t({id:'fL1v', x:60,y:684,w:160,h:24, text:'텍스트', size:20, weight:400, color:'#ffffff'}),
      t({id:'fL2t', x:165,y:648,w:160,h:24, text:'타이틀', size:20, weight:500, color:'#ffffff'}),
      t({id:'fL2v', x:165,y:684,w:160,h:24, text:'텍스트', size:20, weight:400, color:'#ffffff'}),
      t({id:'company', x:664,y:684,w:300,h:24, text:'기업명 표기', size:20, weight:500, color:'#ffffff', align:'right'}),
    ],
    groups:[]
  };

  // ---------- 표지 (16:9) : 다크 커버 (4:3 → 와이드 적용) ----------
  const COVER_169 = {
    size:'16:9', w:1920, h:1080, bg:'#171717',
    statics:[
      t({id:'logo', x:96,y:110,w:500,h:44, text:'FUNDABLE', size:36, weight:700, color:'#ffffff', valign:'middle', lh:1}),
      t({id:'title', x:96,y:396,w:1600,h:130, text:'타이틀', size:104, weight:700, color:'#ffffff', valign:'top', lh:1.05}),
      t({id:'subtext', x:96,y:548,w:1400,h:52, text:'서브텍스트', size:40, weight:500, color:'#ffffff', valign:'top', lh:1.2}),
      r({id:'line', x:96,y:892,w:1728,h:2, fill:'#ffffff'}),
      t({id:'fL1t', x:96,y:920,w:240,h:32, text:'타이틀', size:26, weight:500, color:'#ffffff'}),
      t({id:'fL1v', x:96,y:962,w:240,h:32, text:'텍스트', size:26, weight:400, color:'#ffffff'}),
      t({id:'fL2t', x:300,y:920,w:240,h:32, text:'타이틀', size:26, weight:500, color:'#ffffff'}),
      t({id:'fL2v', x:300,y:962,w:240,h:32, text:'텍스트', size:26, weight:400, color:'#ffffff'}),
      t({id:'company', x:1400,y:962,w:424,h:32, text:'기업명 표기', size:26, weight:500, color:'#ffffff', align:'right'}),
    ],
    groups:[]
  };

  // ---------- 목차 (16:9) : CONTENTS ----------
  const row = (i,y,no,title)=>([
    t({id:'toc'+i+'no', x:120,y:y,w:120,h:64, text:no, size:56, weight:700, color:'#af9360', valign:'middle', lh:1}),
    t({id:'toc'+i+'tt', x:260,y:y,w:1300,h:64, text:title, size:40, weight:600, color:'#5f4d42', valign:'middle', lh:1.1}),
    r({id:'toc'+i+'ln', x:120,y:y+92,w:1680,h:2, fill:'#e3ddcf'}),
  ]);
  const TOC_169 = {
    size:'16:9', w:1920, h:1080, bg:'#f7f5ef',
    statics:[
      r({id:'badgeRect', x:120,y:96,w:200,h:48, fill:'#b39258', radius:6}),
      t({id:'badgeTxt', x:120,y:96,w:200,h:48, text:'CONTENTS', size:26, weight:700, color:'#ffffff', align:'center', valign:'middle', lh:1}),
      t({id:'title', x:120,y:168,w:1000,h:110, text:'목차', size:88, weight:700, color:'#5f4d42', valign:'top', lh:1.1}),
      ...row(1, 360, '01', '시장 분석 및 문제 정의'),
      ...row(2, 488, '02', '솔루션 및 핵심 기능'),
      ...row(3, 616, '03', '비즈니스 모델'),
      ...row(4, 744, '04', '시장 진입 전략'),
      ...row(5, 872, '05', '재무 계획 및 로드맵'),
      t({id:'pageNo', x:1780,y:1000,w:60,h:40, text:'02', size:24, weight:400, color:'#b59b6c', align:'right'}),
    ],
    groups:[]
  };

  // ---------- 종지 (16:9) : 감사합니다 ----------
  const CLOSING_169 = {
    size:'16:9', w:1920, h:1080, bg:'#5f4d42',
    statics:[
      t({id:'logo', x:0,y:300,w:1920,h:48, text:'FUNDABLE', size:34, weight:700, color:'#af9360', align:'center', valign:'middle', lh:1}),
      t({id:'thanks', x:0,y:400,w:1920,h:160, text:'감사합니다', size:130, weight:700, color:'#ffffff', align:'center', valign:'middle', lh:1}),
      t({id:'sub', x:0,y:580,w:1920,h:60, text:'Thank You', size:40, weight:500, color:'#d8c9a8', align:'center', valign:'middle', lh:1}),
      r({id:'line', x:760,y:700,w:400,h:2, fill:'#8a7560'}),
      t({id:'contact', x:0,y:740,w:1920,h:40, text:'marketing@fundable.co.kr   ·   www.fundable.co.kr', size:26, weight:400, color:'#e3ddcf', align:'center', valign:'middle', lh:1.3}),
    ],
    groups:[]
  };

  window.ASSET_LIB = {
    sizes: {
      '16:9': { w:1920, h:1080, inW:13.333, inH:7.5 },
      '4:3':  { w:1024, h:768,  inW:10,     inH:7.5 },
    },
    // 종류 순서(표지→목차→내지→종지)
    types: ['표지','목차','내지','종지'],
    assets: [
      { id:'cover-dark-169',  name:'다크 표지 (와이드)', type:'표지', size:'16:9', model: COVER_169 },
      { id:'cover-dark-43',   name:'다크 표지 (4:3)',    type:'표지', size:'4:3',  model: COVER_43 },
      { id:'toc-basic-169',   name:'목차 · CONTENTS',    type:'목차', size:'16:9', model: TOC_169 },
      { id:'inji-market-169', name:'시장의 문제점',       type:'내지', size:'16:9', model: INJI_MARKET },
      { id:'closing-169',     name:'감사합니다',          type:'종지', size:'16:9', model: CLOSING_169 },
    ]
  };
})();
