/* =====================================================================
   PPT 섹션 라이브러리 v2 — Figma 플러그인 (메인 스레드)
   · 역할: 디자이너가 만든 "섹션 블록"을 v2 빌더 모델로 등록 → 라이브러리/백엔드 공급
   · 출력: v2 노드(트리) + 색상 6역할 토큰 (accent/bg/surface/text/subtext/line)
   · 옛 'PPT Library Manager'(figma-plugin/)와 별개. 템플릿/요소(statics) 개념 폐기.
   섹션 = 선택 프레임 1개 → 단일 v2 노드. 여러 프레임 선택 시 각각 1섹션으로 등록.
   ===================================================================== */
figma.showUI(__html__, { width: 460, height: 680, themeColors: true });

// ---------- 색상/숫자 유틸 ----------
function rgbToHex(c){ const f=x=>('0'+Math.round((x||0)*255).toString(16)).slice(-2); return '#'+f(c.r)+f(c.g)+f(c.b); }
function num(v,d){ return (typeof v==='number')?v:d; }
function solidHex(fills){ if(!fills||fills===figma.mixed||!Array.isArray(fills))return null; for(const p of fills){ if(p.visible!==false&&p.type==='SOLID')return rgbToHex(p.color); } return null; }
// ---- 투명도(opacity) ----
function nodeOpacity(n){ return (typeof n.opacity==='number')?n.opacity:1; }
function paintAlpha(fills){ if(Array.isArray(fills)){ for(const p of fills){ if(p.visible!==false&&p.type==='SOLID')return (typeof p.opacity==='number')?p.opacity:1; } } return 1; }
function fillAlpha(n){ return paintAlpha(n.fills)*nodeOpacity(n); }
function textAlpha(n){ let a=1; if(Array.isArray(n.fills))a=paintAlpha(n.fills); else { try{ const segs=n.getStyledTextSegments(['fills']); for(const s of segs){ a=paintAlpha(s.fills); break; } }catch(e){} } return a*nodeOpacity(n); }
function strokeAlpha(n){ return paintAlpha(n.strokes)*nodeOpacity(n); }
function applyA(hex,a){ if(!hex||a>=0.999)return hex; const n=parseInt(hex.slice(1),16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+(+a.toFixed(3))+')'; }
function slug(s){ return (s||'section').trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g,'-').replace(/^-|-$/g,'')||'section'; }
function csv(s){ return (s||'').split(',').map(x=>x.trim()).filter(Boolean); }

// ---------- 색상 6역할 리졸버 (Figma Variables) ----------
const ROLE_KEYS=['accent','bg','surface','text','subtext','line'];
function roleKeyFromName(name){ if(!name)return null; const tok=String(name).split('/').pop().trim().toLowerCase(); return ROLE_KEYS.indexOf(tok)>=0?tok:null; }
let ROLE_MAP=null, ROLE_THEME=null;   // variableId→roleKey  /  roleKey→hex
async function resolveColorVal(val, depth){ if(!val||depth>3)return null; if(typeof val==='object'&&'r' in val)return rgbToHex(val);
  if(val.type==='VARIABLE_ALIAS'&&val.id){ try{ const v=await figma.variables.getVariableByIdAsync(val.id); if(v){ const col=await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId); const mid=col?col.defaultModeId:Object.keys(v.valuesByMode)[0]; return await resolveColorVal(v.valuesByMode[mid], depth+1); } }catch(e){} } return null; }
async function buildRoleMap(){ ROLE_MAP={}; ROLE_THEME={};
  try{ const cols=await figma.variables.getLocalVariableCollectionsAsync();
    for(const col of cols){ const mid=col.defaultModeId||(col.modes&&col.modes[0]&&col.modes[0].modeId);
      for(const vid of (col.variableIds||[])){ const v=await figma.variables.getVariableByIdAsync(vid); if(!v||v.resolvedType!=='COLOR')continue;
        const rk=roleKeyFromName(v.name); if(!rk)continue; ROLE_MAP[vid]=rk;
        if(!ROLE_THEME[rk]){ const hex=await resolveColorVal(v.valuesByMode[mid],0); if(hex)ROLE_THEME[rk]=hex; } } }
  }catch(e){}
  return ROLE_MAP;
}
function paintListRole(list){ if(!Array.isArray(list))return null; for(const p of list){ if(p.visible===false||p.type!=='SOLID')continue; const bv=p.boundVariables&&p.boundVariables.color; if(bv&&bv.id&&ROLE_MAP&&ROLE_MAP[bv.id])return ROLE_MAP[bv.id]; } return null; }
function fillRole(n){ try{ return n?paintListRole(n.fills):null; }catch(e){ return null; } }
function strokeRole(n){ try{ return n?paintListRole(n.strokes):null; }catch(e){ return null; } }

// ---------- 충실(faithful) 직렬화 — 절대좌표 보존(깨짐 방지) ----------
// 디자이너가 그린 그대로(위치·크기·비율) 'fig' 노드(절대배치 items)로. 텍스트는 편집가능, 복잡 도형은 PNG.
function isVectorType(n){ return ['VECTOR','BOOLEAN_OPERATION','STAR','POLYGON','ELLIPSE','LINE'].indexOf(n.type)>=0; }
function alignH(a){ return a==='CENTER'?'center':(a==='RIGHT'?'right':'left'); }
function alignV(a){ return a==='CENTER'?'middle':(a==='BOTTOM'?'bottom':'top'); }
function lhMult(n){ const lh=n.lineHeight, fs=num(n.fontSize,24); if(!lh||lh===figma.mixed||lh.unit==='AUTO')return 1.3; if(lh.unit==='PERCENT')return +(lh.value/100).toFixed(3); if(lh.unit==='PIXELS')return +(lh.value/fs).toFixed(3); return 1.3; }
function textColor(n){ const c=solidHex(n.fills); if(c)return c; try{ const segs=n.getStyledTextSegments(['fills']); for(const s of segs){ const cc=solidHex(s.fills); if(cc)return cc; } }catch(e){} return '#1c1c22'; }
function hasImageFill(fills){ return Array.isArray(fills)&&fills.some(p=>p.visible!==false&&p.type==='IMAGE'); }
function hasGradient(fills){ return Array.isArray(fills)&&fills.some(p=>p.visible!==false&&/GRADIENT/.test(p.type)); }
function hasTextSub(n){ if(n.type==='TEXT')return true; if(n.children){ for(const c of n.children){ if(c.visible===false)continue; if(hasTextSub(c))return true; } } return false; }
function cornerR(n){ return (typeof n.cornerRadius==='number')?Math.round(n.cornerRadius):0; }
// ---------- 포인트 색(accent) 지정 — 등록 시 고른 색을 쓰는 요소를 accent 역할로 ----------
let ACCENT_HEX=new Set();   // 등록 시 지정된 포인트색(소문자 hex)
function accentRole(hex){ return (hex && ACCENT_HEX.has(String(hex).toLowerCase())) ? 'accent' : null; }
function collectColors(node, map){ for(const ch of (node.children||[])){ if(ch.visible===false)continue;
  if(ch.type==='TEXT'){ const c=textColor(ch); if(c)map[c.toLowerCase()]=(map[c.toLowerCase()]||0)+1; }
  const f=solidHex(ch.fills); if(f)map[f.toLowerCase()]=(map[f.toLowerCase()]||0)+1;
  const s=Array.isArray(ch.strokes)&&ch.strokes.length?solidHex(ch.strokes):null; if(s)map[s.toLowerCase()]=(map[s.toLowerCase()]||0)+1;
  if(ch.children)collectColors(ch,map);
 } return map; }
function scanFrameColors(frame){ const map={}; const f=solidHex(frame.fills); if(f)map[f.toLowerCase()]=1; collectColors(frame,map); return Object.keys(map).map(h=>({hex:h,count:map[h]})).sort((a,b)=>b.count-a.count); }
// ---------- 오토레이아웃 → flow 트리 (Fill/Hug/Fixed 보존) ----------
function isAL(n){ return ('layoutMode' in n) && n.layoutMode && n.layoutMode!=='NONE'; }
function alignMain(a){ return a==='CENTER'?'center':a==='MAX'?'flex-end':a==='SPACE_BETWEEN'?'space-between':'flex-start'; }
function alignCross(a){ return a==='CENTER'?'center':a==='MAX'?'flex-end':a==='BASELINE'?'baseline':'flex-start'; }
async function fimg(n,fmt,grow,stretch,imgFill){ let img=null; try{ const sc=fmt==='PNG'?Math.min(4,Math.max(2,2400/Math.max(n.width,n.height))):Math.min(1,1400/Math.max(n.width,n.height)); const bytes=await n.exportAsync({format:fmt,constraint:{type:'SCALE',value:sc}}); img='data:image/'+(fmt==='PNG'?'png':'jpeg')+';base64,'+figma.base64Encode(bytes); }catch(e){} const e={t:'fimg',img,w:Math.round(n.width),h:Math.round(n.height),radius:cornerR(n)}; if(imgFill)e.imgFill=true; if(grow)e.grow=true; if(stretch)e.stretch=true; return e; }
async function nodeToFlow(n){ if(n.visible===false)return null;
  const grow=('layoutGrow' in n)&&n.layoutGrow===1, stretch=('layoutAlign' in n)&&n.layoutAlign==='STRETCH';
  if(n.type==='TEXT'){ const col=textColor(n); const e={t:'ftext',text:n.characters||'',size:Math.round(num(n.fontSize,16)),weight:num(n.fontWeight,400),color:col,align:alignH(n.textAlignHorizontal),lh:lhMult(n)};
    const ta=textAlpha(n); if(ta<0.999)e.op=ta; const r=fillRole(n)||accentRole(col); if(r)e.role=r; if(n.textAutoResize==='WIDTH_AND_HEIGHT')e.hug=true; else e.w=Math.round(n.width); if(grow)e.grow=true; if(stretch)e.stretch=true; return e; }
  if(isAL(n)){ const e={t:'flow',dir:n.layoutMode==='HORIZONTAL'?'row':'col',gap:Math.round(num(n.itemSpacing,0)),pad:[Math.round(num(n.paddingTop,0)),Math.round(num(n.paddingRight,0)),Math.round(num(n.paddingBottom,0)),Math.round(num(n.paddingLeft,0))],justify:alignMain(n.primaryAxisAlignItems),align:alignCross(n.counterAxisAlignItems)};
    const bg=solidHex(n.fills); if(bg){ e.bg=bg; const fa=fillAlpha(n); if(fa<0.999)e.op=fa; } const r=fillRole(n)||accentRole(bg); if(r)e.role=r; if(cornerR(n))e.radius=cornerR(n);
    const sk=Array.isArray(n.strokes)&&n.strokes.length?solidHex(n.strokes):null; if(sk&&num(n.strokeWeight,0)>0){ e.line={color:sk,w:num(n.strokeWeight,1)}; const sa=strokeAlpha(n); if(sa<0.999)e.line.op=sa; const lr=strokeRole(n)||accentRole(sk); if(lr)e.line.role=lr; }
    if(grow)e.grow=true; if(stretch)e.stretch=true;   // 고정크기 미사용 — grow/stretch/content로만(Fill 우선)
    e.children=[]; for(const ch of n.children){ const c=await nodeToFlow(ch); if(c)e.children.push(c); } return e; }
  if(hasImageFill(n.fills))return await fimg(n,'JPG',grow,stretch,true);
  if(isVectorType(n)||hasGradient(n.fills))return await fimg(n,'PNG',grow,stretch);
  const isC=('children' in n)&&n.children&&n.children.length;
  if(isC)return await fimg(n,'PNG',grow,stretch);   // 비오토레이아웃 컨테이너 → 래스터(오토레이아웃 권장)
  const bg=solidHex(n.fills); if(bg){ const e={t:'fbox',bg,radius:cornerR(n),w:Math.round(n.width),h:Math.round(n.height)}; const fa=fillAlpha(n); if(fa<0.999)e.op=fa; const r=fillRole(n)||accentRole(bg); if(r)e.role=r; if(grow)e.grow=true; if(stretch)e.stretch=true; return e; }
  return null;
}
// 선택 프레임 → 섹션 { node, theme, w, h }  (오토레이아웃=flow / 그 외=충실 fig)
async function serializeSection(frame){ await buildRoleMap();
  if(isAL(frame)){ const node=await nodeToFlow(frame); node.root=true; node.w=Math.round(frame.width); node.h=Math.round(frame.height);
    const theme=Object.assign({accent:null,bg:null,surface:null,text:null,subtext:null,line:null}, ROLE_THEME||{});
    if(!theme.accent && ACCENT_HEX.size) theme.accent=[...ACCENT_HEX][0];
    return { node, theme, w:Math.round(frame.width), h:Math.round(frame.height) };
  }
  // --- 비오토레이아웃: 충실(fig) 절대좌표 ---
  const bb=frame.absoluteBoundingBox, ox=bb.x, oy=bb.y;
  const w=Math.round(frame.width), h=Math.round(frame.height);
  const items=[];
  const rel=n=>{ const b=n.absoluteBoundingBox; return { x:Math.round(b.x-ox), y:Math.round(b.y-oy), w:Math.round(b.width), h:Math.round(b.height) }; };
  // 프레임 자체 배경(둥근 카드 등)
  { const bg=solidHex(frame.fills); const r=fillRole(frame)||accentRole(bg); if(bg||r){ const e={k:'r',x:0,y:0,w,h,fill:bg||'#ffffff',radius:cornerR(frame)}; const fa=fillAlpha(frame); if(fa<0.999)e.op=fa; if(r)e.role=r; const lr=strokeRole(frame); if(lr)e.line={role:lr,w:num(frame.strokeWeight,1)}; items.push(e); } }
  function pushText(n){ const p=rel(n); const col=textColor(n); const e={k:'t',x:p.x,y:p.y,w:p.w,h:p.h,text:n.characters||'',size:Math.round(num(n.fontSize,24)),weight:num(n.fontWeight,400),color:col,align:alignH(n.textAlignHorizontal),valign:alignV(n.textAlignVertical),lh:lhMult(n)}; const ta=textAlpha(n); if(ta<0.999)e.op=ta; const r=fillRole(n)||accentRole(col); if(r)e.role=r; items.push(e); }
  function pushRect(n){ const p=rel(n); const bg=solidHex(n.fills); const e={k:'r',x:p.x,y:p.y,w:p.w,h:p.h,fill:bg||'#e9e9ee',radius:cornerR(n)}; const fa=fillAlpha(n); if(fa<0.999)e.op=fa; const r=fillRole(n)||accentRole(bg); if(r)e.role=r; const sk=n.strokes; if(Array.isArray(sk)&&sk.length){ const sc=solidHex(sk); if((sc||strokeRole(n))&&num(n.strokeWeight,0)>0){ e.line={color:sc||'#ddd',w:num(n.strokeWeight,1)}; const sa=strokeAlpha(n); if(sa<0.999)e.line.op=sa; const lr=strokeRole(n)||accentRole(sc); if(lr)e.line.role=lr; } } items.push(e); }
  async function pushImg(n,fmt,imgFill){ const p=rel(n); let img=null; try{ const sc=fmt==='PNG'?Math.min(4,Math.max(2,2400/Math.max(n.width,n.height))):Math.min(1,1400/Math.max(n.width,n.height)); const bytes=await n.exportAsync({format:fmt,constraint:{type:'SCALE',value:sc}}); img='data:image/'+(fmt==='PNG'?'png':'jpeg')+';base64,'+figma.base64Encode(bytes); }catch(e){} const e={k:'r',x:p.x,y:p.y,w:p.w,h:p.h,fill:fmt==='PNG'?'transparent':(solidHex(n.fills)||'#e9e9ee'),radius:cornerR(n),img}; if(imgFill)e.imgFill=true; items.push(e); }
  async function walk(node){ for(const ch of (node.children||[])){ if(ch.visible===false||!ch.absoluteBoundingBox)continue;
    if(ch.type==='TEXT'){ pushText(ch); continue; }
    if(hasImageFill(ch.fills)){ await pushImg(ch,'JPG',true); continue; }                    // 사진 채움(교체 가능)
    if(isVectorType(ch)||hasGradient(ch.fills)){ await pushImg(ch,'PNG'); continue; }       // 벡터/그라데이션 → 고화질 PNG
    const isC=('children' in ch)&&ch.children&&ch.children.length;
    if(isC&&!hasTextSub(ch)){ await pushImg(ch,'PNG'); continue; }                          // 텍스트 없는 그룹(아이콘/로고) → 통째 PNG
    if(solidHex(ch.fills)||fillRole(ch)){ pushRect(ch); if(isC)await walk(ch); continue; }  // 배경 채움 + 안쪽 재귀
    if(isC)await walk(ch);
  } }
  await walk(frame);
  const theme=Object.assign({accent:null,bg:null,surface:null,text:null,subtext:null,line:null}, ROLE_THEME||{});
  if(!theme.accent && ACCENT_HEX.size) theme.accent=[...ACCENT_HEX][0];   // 변수 미사용 시 지정 포인트색을 accent로 기록
  return { node:{t:'fig',w,h,items}, theme, w, h };
}
// 섹션 미리보기 PNG
async function framePreview(frame){ try{ const sc=Math.min(1, 900/Math.max(frame.width, frame.height)); const bytes=await frame.exportAsync({ format:'PNG', constraint:{ type:'SCALE', value:sc } }); return 'data:image/png;base64,'+figma.base64Encode(bytes); }catch(e){ return null; } }

// ---------- 저장소 ----------
async function getSections(){ const s=await figma.clientStorage.getAsync('ppt_sections'); return s||[]; }
async function setSections(arr){ await figma.clientStorage.setAsync('ppt_sections', arr); }
function selFrames(){ return figma.currentPage.selection.filter(n=>'children' in n); }

async function sendState(){ const s=selFrames(); const sections=await getSections(); const url=await figma.clientStorage.getAsync('ppt_sync_url'); figma.ui.postMessage({ type:'state', selCount:s.length, selNames:s.map(n=>n.name), sections, savedUrl:url||'' }); }

figma.ui.onmessage = async (m)=>{
  try {
    if(m.type==='refresh'){ await sendState(); }
    else if(m.type==='scan-roles'){ await buildRoleMap(); figma.ui.postMessage({ type:'roles', theme:ROLE_THEME||{}, keys:ROLE_KEYS }); }
    else if(m.type==='scan-colors'){ const s=selFrames(); const colors=s.length?scanFrameColors(s[0]):[]; figma.ui.postMessage({ type:'colors', colors }); }
    else if(m.type==='register-section'){
      const frames=selFrames(); if(!frames.length){ figma.ui.postMessage({type:'err',msg:'섹션으로 등록할 프레임을 1개 이상 선택하세요.'}); return; }
      ACCENT_HEX=new Set((m.accent||[]).map(h=>String(h).toLowerCase()));   // 등록 시 지정한 포인트색
      const made=[]; const sections=await getSections();
      for(let i=0;i<frames.length;i++){ const f=frames[i]; const s=await serializeSection(f); const preview=await framePreview(f);
        const nm=(frames.length>1)?((m.name||f.name||'섹션')+' '+(i+1)):(m.name||f.name||'섹션');
        const item={ id:slug(nm)+'-'+m.stamp+'-'+i, v:2, kind:'section', name:nm, category:m.category||'기타', tags:csv(m.tags), node:s.node, theme:s.theme, w:s.w, h:s.h, preview:preview||null };
        sections.push(item); made.push(item); }
      await setSections(sections);
      const roleCount=Object.keys(made[0].theme).filter(k=>made[0].theme[k]).length;
      figma.notify('섹션 등록: '+made.length+'개 · 색역할 '+roleCount+'/6');
      await sendState(); figma.ui.postMessage({type:'registered', items:made});
    }
    else if(m.type==='delete'){ let sections=await getSections(); sections=sections.filter(x=>x.id!==m.id); await setSections(sections); await sendState(); }
    else if(m.type==='clear-all'){ await setSections([]); await sendState(); }
    else if(m.type==='save-url'){ await figma.clientStorage.setAsync('ppt_sync_url', m.url||''); }
    else if(m.type==='notify'){ figma.notify(m.msg); }
    else if(m.type==='close'){ figma.closePlugin(); }
  } catch(e){ figma.ui.postMessage({type:'err',msg:String((e&&e.message)||e)}); }
};

figma.on('selectionchange', sendState);
sendState();
