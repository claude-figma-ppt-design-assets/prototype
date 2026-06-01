/* =====================================================================
   라이브러리: 2개 카탈로그
   1) TEMPLATES — 문서 종류별 "여러 페이지로 된 덱" (검색/카테고리)
   2) ELEMENTS  — 현재 페이지에 삽입하는 "요소" 컴포넌트 (검색/카테고리)
   사업자용 PPT(사업계획서/IR Deck/제안서)의 Canva.
   ===================================================================== */
(function(){
  const t=(o)=>Object.assign({type:'text',weight:400,color:'#15100e',align:'left',valign:'top',lh:1.3,size:24},o);
  const r=(o)=>Object.assign({type:'rect',fill:'#ffffff',radius:0},o);

  /* ---------- 페이지 모델(템플릿의 구성 페이지) ---------- */
  const COVER_169 = { size:'16:9', w:1920, h:1080, bg:'#171717', kind:'표지', statics:[
    t({id:'logo',x:96,y:110,w:500,h:44,text:'FUNDABLE',size:36,weight:700,color:'#ffffff',valign:'middle',lh:1}),
    t({id:'title',x:96,y:396,w:1600,h:130,text:'사업계획서 제목',size:104,weight:700,color:'#ffffff',lh:1.05}),
    t({id:'subtext',x:96,y:548,w:1400,h:52,text:'서브 타이틀 / 한 줄 소개',size:40,weight:500,color:'#ffffff',lh:1.2}),
    r({id:'line',x:96,y:892,w:1728,h:2,fill:'#ffffff'}),
    t({id:'fL1t',x:96,y:920,w:240,h:32,text:'작성일',size:26,weight:500,color:'#ffffff'}),
    t({id:'fL1v',x:96,y:962,w:240,h:32,text:'2026.06',size:26,weight:400,color:'#ffffff'}),
    t({id:'company',x:1300,y:962,w:524,h:32,text:'기업명 표기',size:26,weight:500,color:'#ffffff',align:'right'}),
  ], groups:[] };

  const TOC_169 = { size:'16:9', w:1920, h:1080, bg:'#f7f5ef', kind:'목차', statics:[
    r({id:'badgeRect',x:120,y:96,w:200,h:48,fill:'#b39258',radius:6}),
    t({id:'badgeTxt',x:120,y:96,w:200,h:48,text:'CONTENTS',size:26,weight:700,color:'#ffffff',align:'center',valign:'middle',lh:1}),
    t({id:'title',x:120,y:168,w:1000,h:110,text:'목차',size:88,weight:700,color:'#5f4d42',lh:1.1}),
    ...[['01','시장 분석 및 문제 정의',360],['02','솔루션 및 핵심 기능',488],['03','비즈니스 모델',616],['04','시장 진입 전략',744],['05','재무 계획 및 로드맵',872]].flatMap(([no,tt,y])=>([
      t({id:'toc'+no+'n',x:120,y:y,w:120,h:64,text:no,size:56,weight:700,color:'#af9360',valign:'middle',lh:1}),
      t({id:'toc'+no+'t',x:260,y:y,w:1300,h:64,text:tt,size:40,weight:600,color:'#5f4d42',valign:'middle',lh:1.1}),
      r({id:'toc'+no+'l',x:120,y:y+92,w:1680,h:2,fill:'#e3ddcf'}),
    ])),
    t({id:'pageNo',x:1780,y:1000,w:60,h:40,text:'02',size:24,weight:400,color:'#b59b6c',align:'right'}),
  ], groups:[] };

  const INJI_169 = { size:'16:9', w:1920, h:1080, bg:'#f7f5ef', kind:'내지', statics:[
    r({id:'badgeRect',x:60,y:60,w:256,h:48,fill:'#b39258',radius:6}),
    t({id:'badgeTxt',x:60,y:60,w:256,h:48,text:'문제인식(Problem)',size:30,weight:700,color:'#ffffff',align:'center',valign:'middle',lh:1.2}),
    t({id:'subtitle',x:332,y:60,w:520,h:48,text:'창업아이템 목표시장(고객) 현황 및 필요성',size:32,weight:600,color:'#b39258',valign:'middle',lh:1.2}),
    t({id:'logo',x:1460,y:58,w:360,h:48,text:'LIFLOW',size:30,weight:700,color:'#5f4d42',align:'right',valign:'middle',lh:1.2}),
    t({id:'title',x:60,y:124,w:1760,h:62,text:'시장의 문제점 ─ 5060세대의 온라인 식품 구매 장벽',size:48,weight:700,color:'#5f4d42',lh:1.2}),
    r({id:'lhBar',x:60,y:212,w:600,h:71,fill:'#5f4d42'}),
    t({id:'lhTxt',x:60,y:212,w:600,h:71,text:'온라인 식품 시장 현황',size:46,weight:700,color:'#ffffff',align:'center',valign:'middle',lh:1.2}),
    r({id:'btmBar',x:690,y:885,w:1170,h:94,fill:'#5f4d42',radius:10}),
    t({id:'btmTxt',x:784,y:885,w:990,h:94,text:'5060세대는 한 번 신뢰를 주면 절대 이탈하지 않는다. 그 신뢰를 얻는 과정이 기존 이커머스에는 부재했다.',size:28,weight:700,color:'#ffffff',valign:'middle',lh:1.2}),
    t({id:'pageNo',x:1780,y:1000,w:60,h:40,text:'04',size:24,weight:400,color:'#b59b6c',align:'right'}),
  ], groups:[
    { id:'leftStats', dir:'col', x:60,y:301,w:600,h:678,gap:18, label:'좌측 통계', cards:[
      { id:'ls1', pillW:196, t:{pill:'국내 온라인 식품 시장',num:'70조',desc:'연간 시장 규모 (TAM), 매년 15% 이상 성장 중'}, ov:{} },
      { id:'ls2', pillW:248, t:{pill:'5060세대 온라인 구매 비중',num:'38%',desc:'전체 온라인 식품 구매자 중 5060 비중 (급증 추세)'}, ov:{} },
      { id:'ls3', pillW:172, t:{pill:'5060 재구매 의향',num:'72%',desc:'한 번 신뢰를 얻으면 재구매 의향이 압도적으로 높음'}, ov:{} },
    ]},
    { id:'rightCols', dir:'row', x:690,y:212,w:1170,h:655,gap:18, label:'우측 컬럼', cards:[
      { id:'rc1', t:{icon:'✆',title:'복잡한 앱 UI/ 디지털 진입 장벽',body:'기존 이커머스 앱은 젊은 세대 중심으로 설계되어 5060세대에게 복잡하고 낯선 인터페이스를 제공합니다.',stat:'5060 앱 이탈률\n대형 플랫폼 대비 2.3배 높음'}, ov:{} },
      { id:'rc2', t:{icon:'▦',title:'정보 과잉으로 인한 선택 피로도',body:'수천 개의 상품과 광고 속에서\n무엇을 믿고 살지 판단하기 어렵습니다.\n큐레이션 없는 정보는 오히려\n구매를 막습니다.',stat:'5060 구매 결정 소요 시간\n평균 18분 (2030의 3배)'}, ov:{} },
      { id:'rc3', t:{icon:'?',title:'품질에 대한 불신 및 불안감',body:'직접 보고 만질 수 없는\n온라인 식품 구매에서 5060세대는\n품질 신뢰를 가장 중요하게 여깁니다.',stat:'5060 온라인 식품\n구매 포기 이유 1위 "품질 불신"'}, ov:{} },
    ]},
  ]};

  const CLOSING_169 = { size:'16:9', w:1920, h:1080, bg:'#5f4d42', kind:'종지', statics:[
    t({id:'logo',x:0,y:300,w:1920,h:48,text:'FUNDABLE',size:34,weight:700,color:'#af9360',align:'center',valign:'middle',lh:1}),
    t({id:'thanks',x:0,y:400,w:1920,h:160,text:'감사합니다',size:130,weight:700,color:'#ffffff',align:'center',valign:'middle',lh:1}),
    t({id:'sub',x:0,y:580,w:1920,h:60,text:'Thank You',size:40,weight:500,color:'#d8c9a8',align:'center',valign:'middle',lh:1}),
    r({id:'line',x:760,y:700,w:400,h:2,fill:'#8a7560'}),
    t({id:'contact',x:0,y:740,w:1920,h:40,text:'marketing@fundable.co.kr   ·   www.fundable.co.kr',size:26,weight:400,color:'#e3ddcf',align:'center',valign:'middle',lh:1.3}),
  ], groups:[] };

  /* ---------- 1) TEMPLATES (덱) ---------- */
  const templates = [
    { id:'biz-plan-gov', name:'정부지원 사업계획서', docType:'사업계획서',
      tags:['예비창업패키지','초기창업패키지','정부지원사업','창업','사업계획서','지원사업'],
      desc:'예비/초기창업패키지 등 정부지원사업 양식에 맞춘 브라운 톤 사업계획서.',
      palette:['#f7f5ef','#5f4d42','#af9360','#b39258','#f0ecdf','#15100e'],
      pages:[COVER_169, TOC_169, INJI_169, CLOSING_169] },
    { id:'ir-deck', name:'IR 투자유치 덱', docType:'IR Deck',
      tags:['IR','투자유치','시리즈A','피칭','VC','투자자','데모데이'],
      desc:'투자자 대상 피칭용 IR 덱. 문제→솔루션→시장 흐름.',
      palette:['#0f1115','#1d2433','#3b82f6','#7c5cff','#e8edf6','#0b0d12'],
      pages:[COVER_169, INJI_169, CLOSING_169] },
    { id:'proposal', name:'사업 제안서', docType:'제안서',
      tags:['제안서','협력','파트너십','RFP','입찰','B2B'],
      desc:'B2B 협력/입찰 제안용 표준 제안서 구성.',
      palette:['#ffffff','#1f3a5f','#2e7d6b','#f0a500','#eef2f6','#10243a'],
      pages:[COVER_169, TOC_169, CLOSING_169] },
  ];

  /* ---------- 2) ELEMENTS (페이지 삽입형) ---------- */
  // nodes 좌표는 요소 로컬(0,0 기준). 삽입 시 페이지 중앙으로 평행이동.
  const elements = [
    { id:'kpi', name:'KPI 숫자', category:'통계', tags:['숫자','지표','kpi','성과','통계'], w:360, h:200, nodes:[
      t({type:'text',x:0,y:0,w:360,h:130,text:'70%',size:96,weight:700,color:'#5f4d42',align:'center',valign:'middle',lh:1}),
      t({type:'text',x:0,y:140,w:360,h:40,text:'핵심 지표 설명',size:24,weight:400,color:'#15100e',align:'center',valign:'top',lh:1.2}),
    ]},
    { id:'stat-card', name:'통계 카드', category:'통계', tags:['카드','통계','박스','지표'], w:380, h:220, nodes:[
      r({type:'rect',x:0,y:0,w:380,h:220,fill:'#f0ecdf',radius:8,line:{color:'#5f4d42',w:1.5}}),
      r({type:'rect',x:0,y:0,w:8,h:220,fill:'#5f4d42'}),
      r({type:'rect',x:96,y:18,w:188,h:41,fill:'#af9360',radius:10}),
      t({type:'text',x:96,y:18,w:188,h:41,text:'라벨',size:24,weight:700,color:'#ffffff',align:'center',valign:'middle',lh:1.2}),
      t({type:'text',x:0,y:62,w:380,h:104,text:'38%',size:80,weight:700,color:'#5f4d42',align:'center',valign:'middle',lh:1.1}),
      t({type:'text',x:0,y:172,w:380,h:32,text:'설명 텍스트를 입력하세요',size:22,weight:400,color:'#15100e',align:'center',valign:'middle',lh:1.3}),
    ]},
    { id:'quote', name:'인용구', category:'강조', tags:['인용','quote','강조','메시지'], w:760, h:150, nodes:[
      r({type:'rect',x:0,y:0,w:8,h:150,fill:'#af9360'}),
      t({type:'text',x:36,y:0,w:724,h:150,text:'“여기에 핵심 메시지를 한 문장으로 강조합니다.”',size:40,weight:700,color:'#5f4d42',valign:'middle',lh:1.3}),
    ]},
    { id:'icon-feature', name:'아이콘 + 설명', category:'텍스트', tags:['아이콘','기능','특징','feature'], w:340, h:200, nodes:[
      r({type:'rect',x:0,y:0,w:64,h:64,fill:'#af9360',radius:10}),
      t({type:'text',x:0,y:0,w:64,h:64,text:'★',size:34,weight:700,color:'#ffffff',align:'center',valign:'middle',lh:1}),
      t({type:'text',x:0,y:84,w:340,h:44,text:'기능 제목',size:32,weight:700,color:'#5f4d42',valign:'top',lh:1.2}),
      t({type:'text',x:0,y:132,w:340,h:60,text:'기능에 대한 간단한 설명을 적습니다.',size:24,weight:400,color:'#15100e',valign:'top',lh:1.4}),
    ]},
    { id:'badge', name:'배지 라벨', category:'도형', tags:['배지','라벨','태그','badge'], w:220, h:48, nodes:[
      r({type:'rect',x:0,y:0,w:220,h:48,fill:'#b39258',radius:6}),
      t({type:'text',x:0,y:0,w:220,h:48,text:'LABEL',size:26,weight:700,color:'#ffffff',align:'center',valign:'middle',lh:1}),
    ]},
    { id:'divider', name:'구분선', category:'도형', tags:['선','구분','divider','라인'], w:600, h:4, nodes:[
      r({type:'rect',x:0,y:0,w:600,h:3,fill:'#5f4d42'}),
    ]},
    { id:'list-3', name:'3단계 리스트', category:'리스트', tags:['리스트','단계','번호','프로세스','step'], w:840, h:300, nodes:[
      ...[['01','첫 번째 단계',0],['02','두 번째 단계',100],['03','세 번째 단계',200]].flatMap(([no,tt,y])=>([
        r({type:'rect',x:0,y:y,w:64,h:64,fill:'#5f4d42',radius:32}),
        t({type:'text',x:0,y:y,w:64,h:64,text:no,size:28,weight:700,color:'#ffffff',align:'center',valign:'middle',lh:1}),
        t({type:'text',x:84,y:y,w:756,h:64,text:tt+' — 설명을 입력하세요',size:30,weight:600,color:'#15100e',valign:'middle',lh:1.2}),
      ])),
    ]},
    { id:'section-title', name:'섹션 제목', category:'텍스트', tags:['제목','섹션','heading','타이틀'], w:900, h:140, nodes:[
      r({type:'rect',x:0,y:0,w:200,h:44,fill:'#b39258',radius:6}),
      t({type:'text',x:0,y:0,w:200,h:44,text:'SECTION',size:24,weight:700,color:'#ffffff',align:'center',valign:'middle',lh:1}),
      t({type:'text',x:0,y:60,w:900,h:80,text:'섹션 제목을 입력하세요',size:64,weight:700,color:'#5f4d42',valign:'top',lh:1.1}),
    ]},
  ];

  window.LIBRARY = {
    sizes: { '16:9':{w:1920,h:1080,inW:13.333,inH:7.5}, '4:3':{w:1024,h:768,inW:10,inH:7.5} },
    templateCategories: ['전체','사업계획서','IR Deck','제안서'],
    elementCategories: ['전체','통계','텍스트','강조','도형','리스트'],
    templates, elements,
  };
})();
