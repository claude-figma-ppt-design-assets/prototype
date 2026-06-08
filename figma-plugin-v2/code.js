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

// ---------- v2 노드 직렬화 ----------
function nameTag(n){ const m=/@([a-zA-Z]+)/.exec((n&&n.name)||''); return m?m[1].toLowerCase():null; }
function gatherTexts(node,out){ for(const ch of (node.children||[])){ if(ch.visible===false)continue; if(ch.type==='TEXT')out.push(ch); else if(ch.children)gatherTexts(ch,out); } return out; }
function isVectorType(n){ return ['VECTOR','BOOLEAN_OPERATION','STAR','POLYGON','ELLIPSE','LINE'].indexOf(n.type)>=0; }
async function rasterBlock(n){ let img=null; try{ const sc=Math.min(4,Math.max(2,2000/Math.max(n.width,n.height))); const bytes=await n.exportAsync({format:'PNG',constraint:{type:'SCALE',value:sc}}); img='data:image/png;base64,'+figma.base64Encode(bytes); }catch(e){} return {t:'block',bt:'image',data:{img}}; }
function wrapCard(n,block){ const card={t:'card',child:block}; const r=fillRole(n); if(r)card.role=r; const lr=strokeRole(n); if(lr)card.lineRole=lr; return card; }
// 단일 Figma 노드 → v2 노드
async function nodeToV2(n){ if(n.visible===false)return null;
  if(n.type==='TEXT'){ const tag=nameTag(n); const bt=(tag==='title')?'title':'text'; const b={t:'block',bt,data:{text:n.characters||''}}; const r=fillRole(n); if(r)b.role=r; return b; }
  const isContainer=('children' in n)&&n.children&&n.children.length;
  if(!isContainer){ if(solidHex(n.fills)&&!isVectorType(n))return null; return await rasterBlock(n); }
  const tag=nameTag(n), texts=gatherTexts(n,[]);
  if(tag==='kpi'){ const b={t:'block',bt:'kpi',data:{num:texts[0]?(texts[0].characters||''):'',label:texts[1]?(texts[1].characters||''):''}}; const r=fillRole(texts[0]); if(r)b.role=r; const lr=fillRole(texts[1]); if(lr)b.labelRole=lr; return wrapCard(n,b); }
  if(tag==='list'){ let items=[]; if(texts.length===1)items=(texts[0].characters||'').split('\n').filter(Boolean); else items=texts.map(t=>t.characters||''); const b={t:'block',bt:'list',data:{items}}; const r=fillRole(texts[0]); if(r)b.role=r; return wrapCard(n,b); }
  if(!texts.length)return await rasterBlock(n);   // 텍스트 없는 그룹(아이콘/로고) → 이미지
  // 일반 컨테이너 → frame
  const dir=('layoutMode' in n && n.layoutMode==='HORIZONTAL')?'row':'col';
  const gap=('itemSpacing' in n && typeof n.itemSpacing==='number')?Math.round(n.itemSpacing):16;
  const kids=[], weights=[]; let anyGrow=false;
  for(const ch of n.children){ if(ch.visible===false)continue; const v=await nodeToV2(ch); if(!v)continue; kids.push(v); const g=('layoutGrow' in ch)?(ch.layoutGrow||0):0; weights.push(g>0?g:1); if(g>0)anyGrow=true; }
  const f={t:'frame',dir,gap,children:kids};
  if('paddingTop' in n){ const p=[n.paddingTop,n.paddingRight,n.paddingBottom,n.paddingLeft].map(x=>Math.round(x||0)); if(p.some(x=>x))f.pad=p; }
  if(anyGrow)f.weights=weights;
  const r=fillRole(n); if(r){ f.role=r; f.bg=true; } else if(solidHex(n.fills)){ f.bg=true; }
  const lr=strokeRole(n); if(lr)f.lineRole=lr;
  return f;
}
// 선택 프레임 → 섹션 { node, theme, w, h }
async function serializeSection(frame){ await buildRoleMap();
  const node=await nodeToV2(frame);
  const theme=Object.assign({accent:null,bg:null,surface:null,text:null,subtext:null,line:null}, ROLE_THEME||{});
  return { node, theme, w:Math.round(frame.width), h:Math.round(frame.height) };
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
