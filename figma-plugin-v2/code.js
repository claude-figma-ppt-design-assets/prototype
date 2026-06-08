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
// 선택 프레임 → 섹션 { node:{t:'fig',w,h,items}, theme, w, h }
async function serializeSection(frame){ await buildRoleMap();
  const bb=frame.absoluteBoundingBox, ox=bb.x, oy=bb.y;
  const w=Math.round(frame.width), h=Math.round(frame.height);
  const items=[];
  const rel=n=>{ const b=n.absoluteBoundingBox; return { x:Math.round(b.x-ox), y:Math.round(b.y-oy), w:Math.round(b.width), h:Math.round(b.height) }; };
  // 프레임 자체 배경(둥근 카드 등)
  { const r=fillRole(frame), bg=solidHex(frame.fills); if(bg||r){ const e={k:'r',x:0,y:0,w,h,fill:bg||'#ffffff',radius:cornerR(frame)}; if(r)e.role=r; const lr=strokeRole(frame); if(lr)e.line={role:lr,w:num(frame.strokeWeight,1)}; items.push(e); } }
  function pushText(n){ const p=rel(n); const e={k:'t',x:p.x,y:p.y,w:p.w,h:p.h,text:n.characters||'',size:Math.round(num(n.fontSize,24)),weight:num(n.fontWeight,400),color:textColor(n),align:alignH(n.textAlignHorizontal),valign:alignV(n.textAlignVertical),lh:lhMult(n)}; const r=fillRole(n); if(r)e.role=r; items.push(e); }
  function pushRect(n){ const p=rel(n); const e={k:'r',x:p.x,y:p.y,w:p.w,h:p.h,fill:solidHex(n.fills)||'#e9e9ee',radius:cornerR(n)}; const r=fillRole(n); if(r)e.role=r; const sk=n.strokes; if(Array.isArray(sk)&&sk.length){ const sc=solidHex(sk); if((sc||strokeRole(n))&&num(n.strokeWeight,0)>0){ e.line={color:sc||'#ddd',w:num(n.strokeWeight,1)}; const lr=strokeRole(n); if(lr)e.line.role=lr; } } items.push(e); }
  async function pushImg(n,fmt){ const p=rel(n); let img=null; try{ const sc=fmt==='PNG'?Math.min(4,Math.max(2,2400/Math.max(n.width,n.height))):Math.min(1,1400/Math.max(n.width,n.height)); const bytes=await n.exportAsync({format:fmt,constraint:{type:'SCALE',value:sc}}); img='data:image/'+(fmt==='PNG'?'png':'jpeg')+';base64,'+figma.base64Encode(bytes); }catch(e){} items.push({k:'r',x:p.x,y:p.y,w:p.w,h:p.h,fill:fmt==='PNG'?'transparent':(solidHex(n.fills)||'#e9e9ee'),radius:cornerR(n),img}); }
  async function walk(node){ for(const ch of (node.children||[])){ if(ch.visible===false||!ch.absoluteBoundingBox)continue;
    if(ch.type==='TEXT'){ pushText(ch); continue; }
    if(hasImageFill(ch.fills)){ await pushImg(ch,'JPG'); continue; }                       // 사진 채움
    if(isVectorType(ch)||hasGradient(ch.fills)){ await pushImg(ch,'PNG'); continue; }       // 벡터/그라데이션 → 고화질 PNG
    const isC=('children' in ch)&&ch.children&&ch.children.length;
    if(isC&&!hasTextSub(ch)){ await pushImg(ch,'PNG'); continue; }                          // 텍스트 없는 그룹(아이콘/로고) → 통째 PNG
    if(solidHex(ch.fills)||fillRole(ch)){ pushRect(ch); if(isC)await walk(ch); continue; }  // 배경 채움 + 안쪽 재귀
    if(isC)await walk(ch);
  } }
  await walk(frame);
  const theme=Object.assign({accent:null,bg:null,surface:null,text:null,subtext:null,line:null}, ROLE_THEME||{});
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
    else if(m.type==='register-section'){
      const frames=selFrames(); if(!frames.length){ figma.ui.postMessage({type:'err',msg:'섹션으로 등록할 프레임을 1개 이상 선택하세요.'}); return; }
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
