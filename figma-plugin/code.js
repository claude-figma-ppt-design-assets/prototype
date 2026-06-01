/* =====================================================================
   PPT Asset Exporter — Figma 플러그인 (메인 스레드)
   선택한 프레임 → 에디터 에셋 model JSON 으로 직렬화하여 UI로 전달.
   model 스키마: { size, w, h, bg, statics:[ text|rect ... ], groups:[] }
   ===================================================================== */
figma.showUI(__html__, { width: 480, height: 660, themeColors: true });

function rgbToHex(c){ const f = x => ('0' + Math.round((x || 0) * 255).toString(16)).slice(-2); return '#' + f(c.r) + f(c.g) + f(c.b); }
function num(v, d){ return (typeof v === 'number') ? v : d; }
function solidHex(fills){
  if (!fills || fills === figma.mixed || !Array.isArray(fills)) return null;
  for (const p of fills){ if (p.visible !== false && p.type === 'SOLID') return rgbToHex(p.color); }
  return null;
}
function hasImage(fills){ return Array.isArray(fills) && fills.some(p => p.visible !== false && p.type === 'IMAGE'); }
function alignH(a){ return a === 'CENTER' ? 'center' : (a === 'RIGHT' ? 'right' : 'left'); }
function alignV(a){ return a === 'CENTER' ? 'middle' : (a === 'BOTTOM' ? 'bottom' : 'top'); }
function lhMult(node){
  const lh = node.lineHeight, fs = num(node.fontSize, 24);
  if (!lh || lh === figma.mixed || lh.unit === 'AUTO') return 1.2;
  if (lh.unit === 'PERCENT') return +(lh.value / 100).toFixed(3);
  if (lh.unit === 'PIXELS') return +(lh.value / fs).toFixed(3);
  return 1.2;
}

function serialize(frame){
  const bb = frame.absoluteBoundingBox;
  const ox = bb.x, oy = bb.y;
  const w = Math.round(frame.width), h = Math.round(frame.height);
  const ratio = w / h;
  const size = Math.abs(ratio - 16/9) < 0.03 ? '16:9'
             : Math.abs(ratio - 4/3)  < 0.03 ? '4:3'
             : 'custom';
  const bg = solidHex(frame.fills) || '#ffffff';
  const statics = [];
  let idc = 0, imgWarn = 0;

  const rel = (node) => { const b = node.absoluteBoundingBox; return {
    x: Math.round(b.x - ox), y: Math.round(b.y - oy),
    w: Math.round(b.width), h: Math.round(b.height) }; };

  function pushText(node){
    const p = rel(node);
    statics.push({
      id: 't' + (idc++), type: 'text', x: p.x, y: p.y, w: p.w, h: p.h,
      text: node.characters,
      size: Math.round(num(node.fontSize, 24)),
      weight: num(node.fontWeight, 400),
      color: solidHex(node.fills) || '#000000',
      align: alignH(node.textAlignHorizontal),
      valign: alignV(node.textAlignVertical),
      lh: lhMult(node)
    });
  }
  function pushRect(node){
    const p = rel(node);
    const e = {
      id: 'r' + (idc++), type: 'rect', x: p.x, y: p.y, w: p.w, h: p.h,
      fill: solidHex(node.fills) || '#e5e0d5',
      radius: (typeof node.cornerRadius === 'number') ? Math.round(node.cornerRadius) : 0
    };
    const sk = node.strokes;
    if (Array.isArray(sk) && sk.length){ const sc = solidHex(sk); if (sc && num(node.strokeWeight, 0) > 0) e.line = { color: sc, w: num(node.strokeWeight, 1) }; }
    statics.push(e);
  }

  function walk(node){
    for (const ch of (node.children || [])){
      if (ch.visible === false) continue;
      if (!ch.absoluteBoundingBox){ if (ch.children) walk(ch); continue; }
      if (ch.type === 'TEXT'){ pushText(ch); }
      else if (ch.type === 'LINE'){
        const p = rel(ch); const sc = solidHex(ch.strokes) || '#000000';
        statics.push({ id: 'r' + (idc++), type: 'rect', x: p.x, y: p.y, w: Math.max(p.w, 1), h: Math.max(p.h, num(ch.strokeWeight, 2)), fill: sc, radius: 0 });
      }
      else if (hasImage(ch.fills)){ imgWarn++; pushRect(ch); }      // 이미지 → 플레이스홀더 박스(별도 에셋 URL 필요)
      else if (solidHex(ch.fills)){ pushRect(ch); if (ch.children && ch.children.length) walk(ch); }
      else if (ch.children && ch.children.length){ walk(ch); }
    }
  }
  walk(frame);
  return { size, w, h, bg, statics, groups: [], _imgWarn: imgWarn, _count: statics.length };
}

function run(){
  const sel = figma.currentPage.selection;
  if (sel.length !== 1 || !('children' in sel[0])){
    figma.ui.postMessage({ type: 'error', msg: '프레임(또는 컴포넌트) 하나를 선택한 뒤 다시 실행하세요.' });
    return;
  }
  const frame = sel[0];
  try {
    const model = serialize(frame);
    figma.ui.postMessage({ type: 'model', name: frame.name, model });
  } catch (e){
    figma.ui.postMessage({ type: 'error', msg: String((e && e.message) || e) });
  }
}

figma.ui.onmessage = (m) => {
  if (m.type === 'reexport') run();
  else if (m.type === 'close') figma.closePlugin();
  else if (m.type === 'notify') figma.notify(m.msg);
};

run();
