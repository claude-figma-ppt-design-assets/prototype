/* =====================================================================
   PPT Library Manager — Figma 플러그인 (메인 스레드)
   · 프레임 선택 → 템플릿(여러 페이지) / 요소(단일) 로 등록
   · 등록된 템플릿·요소 라이브러리 조회/삭제/내보내기
   저장: figma.clientStorage (사용자 로컬). 내보내기로 app/library.js·백엔드 연동.
   ===================================================================== */
figma.showUI(__html__, { width: 500, height: 700, themeColors: true });

// ---------- 직렬화 유틸 ----------
function rgbToHex(c){ const f=x=>('0'+Math.round((x||0)*255).toString(16)).slice(-2); return '#'+f(c.r)+f(c.g)+f(c.b); }
function num(v,d){ return (typeof v==='number')?v:d; }
function solidHex(fills){ if(!fills||fills===figma.mixed||!Array.isArray(fills))return null; for(const p of fills){ if(p.visible!==false&&p.type==='SOLID')return rgbToHex(p.color); } return null; }
function hasImage(fills){ return Array.isArray(fills)&&fills.some(p=>p.visible!==false&&p.type==='IMAGE'); }
function alignH(a){ return a==='CENTER'?'center':(a==='RIGHT'?'right':'left'); }
function alignV(a){ return a==='CENTER'?'middle':(a==='BOTTOM'?'bottom':'top'); }
function lhMult(node){ const lh=node.lineHeight, fs=num(node.fontSize,24); if(!lh||lh===figma.mixed||lh.unit==='AUTO')return 1.2; if(lh.unit==='PERCENT')return +(lh.value/100).toFixed(3); if(lh.unit==='PIXELS')return +(lh.value/fs).toFixed(3); return 1.2; }
function slug(s){ return (s||'item').trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g,'-').replace(/^-|-$/g,'')||'item'; }
function csv(s){ return (s||'').split(',').map(x=>x.trim()).filter(Boolean); }

// 프레임 → { size, w, h, bg, statics:[ text|rect ... ] }  (좌표는 프레임 기준 0-base)
async function serialize(frame){
  const bb=frame.absoluteBoundingBox, ox=bb.x, oy=bb.y;
  const w=Math.round(frame.width), h=Math.round(frame.height);
  const ratio=w/h;
  const size = Math.abs(ratio-16/9)<0.03?'16:9' : Math.abs(ratio-4/3)<0.03?'4:3' : 'custom';
  const bg = solidHex(frame.fills)||'#ffffff';
  const statics=[]; let idc=0, imgWarn=0;
  const rel=n=>{ const b=n.absoluteBoundingBox; return { x:Math.round(b.x-ox), y:Math.round(b.y-oy), w:Math.round(b.width), h:Math.round(b.height) }; };
  function pushText(n){ const p=rel(n); statics.push({ id:'t'+(idc++), type:'text', x:p.x,y:p.y,w:p.w,h:p.h, text:n.characters, size:Math.round(num(n.fontSize,24)), weight:num(n.fontWeight,400), color:solidHex(n.fills)||'#000000', align:alignH(n.textAlignHorizontal), valign:alignV(n.textAlignVertical), lh:lhMult(n) }); }
  function pushRect(n){ const p=rel(n); const e={ id:'r'+(idc++), type:'rect', x:p.x,y:p.y,w:p.w,h:p.h, fill:solidHex(n.fills)||'#e5e0d5', radius:(typeof n.cornerRadius==='number')?Math.round(n.cornerRadius):0 }; const sk=n.strokes; if(Array.isArray(sk)&&sk.length){ const sc=solidHex(sk); if(sc&&num(n.strokeWeight,0)>0)e.line={color:sc,w:num(n.strokeWeight,1)}; } statics.push(e); }
  async function pushImage(n){ const p=rel(n); let img=null;
    try{ const sc=Math.min(1, 1100/Math.max(n.width, n.height)); const bytes=await n.exportAsync({ format:'JPG', constraint:{ type:'SCALE', value:sc } }); img='data:image/jpeg;base64,'+figma.base64Encode(bytes); }
    catch(e){ imgWarn++; }
    statics.push({ id:'r'+(idc++), type:'rect', x:p.x,y:p.y,w:p.w,h:p.h, fill:solidHex(n.fills)||'#e5e0d5', radius:(typeof n.cornerRadius==='number')?Math.round(n.cornerRadius):0, img });
  }
  async function walk(node){ for(const ch of (node.children||[])){ if(ch.visible===false)continue; if(!ch.absoluteBoundingBox){ if(ch.children)await walk(ch); continue; }
    if(ch.type==='TEXT')pushText(ch);
    else if(ch.type==='LINE'){ const p=rel(ch); statics.push({id:'r'+(idc++),type:'rect',x:p.x,y:p.y,w:Math.max(p.w,1),h:Math.max(p.h,num(ch.strokeWeight,2)),fill:solidHex(ch.strokes)||'#000000',radius:0}); }
    else if(hasImage(ch.fills)){ await pushImage(ch); }
    else if(solidHex(ch.fills)){ pushRect(ch); if(ch.children&&ch.children.length)await walk(ch); }
    else if(ch.children&&ch.children.length)await walk(ch);
  } }
  await walk(frame);
  return { size, w, h, bg, statics, groups:[], _imgWarn:imgWarn };
}
function paletteOf(pages){ const set=[]; const add=c=>{ if(c&&set.indexOf(c)<0&&set.length<6)set.push(c); }; for(const p of pages){ add(p.bg); for(const s of p.statics){ add(s.type==='rect'?s.fill:s.color); } } return set; }

// ---------- 저장소 ----------
async function getLib(){ const t=await figma.clientStorage.getAsync('ppt_templates'); const e=await figma.clientStorage.getAsync('ppt_elements'); return { templates:t||[], elements:e||[] }; }
async function setLib(lib){ await figma.clientStorage.setAsync('ppt_templates', lib.templates); await figma.clientStorage.setAsync('ppt_elements', lib.elements); }
function selFrames(){ return figma.currentPage.selection.filter(n=>'children' in n); }

async function sendState(){ const s=selFrames(); const lib=await getLib(); const url=await figma.clientStorage.getAsync('ppt_sync_url'); figma.ui.postMessage({ type:'state', selCount:s.length, selNames:s.map(n=>n.name), lib, savedUrl:url||'' }); }

figma.ui.onmessage = async (m)=>{
  try {
    if(m.type==='refresh'){ await sendState(); }
    else if(m.type==='register-template'){
      const frames=selFrames(); if(!frames.length){ figma.ui.postMessage({type:'err',msg:'프레임을 1개 이상 선택하세요. (각 프레임 = 1페이지)'}); return; }
      const pages=await Promise.all(frames.map(serialize)); const imgWarn=pages.reduce((a,p)=>a+(p._imgWarn||0),0);
      const tpl={ id:slug(m.name)+'-'+m.stamp, name:m.name||'템플릿', docType:m.docType||'기타', size:pages[0].size, tags:csv(m.tags), desc:m.desc||'', palette:paletteOf(pages), pages:pages.map(p=>({size:p.size,w:p.w,h:p.h,bg:p.bg,kind:p.kind||'',statics:p.statics,groups:[]})) };
      const lib=await getLib(); lib.templates.push(tpl); await setLib(lib);
      figma.notify('템플릿 등록: '+tpl.name+' ('+pages.length+'p)'+(imgWarn?' · 이미지 '+imgWarn+'개 placeholder':''));
      await sendState(); figma.ui.postMessage({type:'registered', kind:'template', item:tpl});
    }
    else if(m.type==='register-element'){
      const frames=selFrames(); if(frames.length!==1){ figma.ui.postMessage({type:'err',msg:'요소는 프레임 1개만 선택하세요.'}); return; }
      const p=await serialize(frames[0]);
      const el={ id:slug(m.name)+'-'+m.stamp, name:m.name||'요소', category:m.category||'기타', tags:csv(m.tags), w:p.w, h:p.h, base:p.w, nodes:p.statics };
      const lib=await getLib(); lib.elements.push(el); await setLib(lib);
      figma.notify('요소 등록: '+el.name+(p._imgWarn?' · 이미지 '+p._imgWarn+'개 placeholder':''));
      await sendState(); figma.ui.postMessage({type:'registered', kind:'element', item:el});
    }
    else if(m.type==='delete'){ const lib=await getLib(); if(m.kind==='template')lib.templates=lib.templates.filter(x=>x.id!==m.id); else lib.elements=lib.elements.filter(x=>x.id!==m.id); await setLib(lib); await sendState(); }
    else if(m.type==='clear-all'){ await setLib({templates:[],elements:[]}); await sendState(); }
    else if(m.type==='save-url'){ await figma.clientStorage.setAsync('ppt_sync_url', m.url||''); }
    else if(m.type==='notify'){ figma.notify(m.msg); }
    else if(m.type==='close'){ figma.closePlugin(); }
  } catch(e){ figma.ui.postMessage({type:'err',msg:String((e&&e.message)||e)}); }
};

figma.on('selectionchange', sendState);
sendState();
