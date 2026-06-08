/* =====================================================================
   /api/library — 공용 라이브러리(템플릿·요소) 저장소
   · GET    → { templates:[], elements:[] }  전체 조회 (앱이 시작 시 호출)
   · POST   → 본문 {templates,elements} 또는 {kind,item} 을 id 기준 병합 저장
              (Figma 플러그인이 등록분을 push)
   · DELETE → ?kind=template|element&id=...  단건 삭제 (id 없으면 전체 비움)
   저장: Vercel KV(Upstash Redis) REST — env: KV_REST_API_URL / KV_REST_API_TOKEN
   ===================================================================== */
const KEY = 'ppt_library';

module.exports = async (req, res) => {
  // CORS (Figma 플러그인 iframe 에서 cross-origin 호출)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  // Upstash/KV 자격증명 자동 탐지 (커스텀 prefix가 붙어도 동작)
  const { url: URL, tok: TOK } = findCreds(process.env);
  if (!URL || !TOK) { res.status(500).json({ error: 'KV/Redis not configured. Vercel 프로젝트에 Upstash for Redis 를 연결하세요.' }); return; }

  const read = async () => {
    const r = await fetch(`${URL}/get/${KEY}`, { headers: { Authorization: `Bearer ${TOK}` } });
    const j = await r.json().catch(() => ({}));
    let lib;
    try { lib = j && j.result ? JSON.parse(j.result) : {}; } catch (_) { lib = {}; }
    if (!lib || typeof lib !== 'object') lib = {};
    lib.templates = lib.templates || []; lib.elements = lib.elements || []; lib.sections = lib.sections || [];
    return lib;
  };
  const write = async (lib) => {
    await fetch(`${URL}/set/${KEY}`, { method: 'POST', headers: { Authorization: `Bearer ${TOK}` }, body: JSON.stringify(lib) });
  };
  const mergeById = (base, incoming) => {
    const map = new Map((base || []).map(x => [x.id, x]));
    for (const it of (incoming || [])) { if (it && it.id) map.set(it.id, it); }
    return [...map.values()];
  };

  try {
    if (req.method === 'GET') { res.status(200).json(await read()); return; }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const lib = await read();
      if (body.templates || body.elements || body.sections) {
        lib.templates = mergeById(lib.templates, body.templates);
        lib.elements  = mergeById(lib.elements,  body.elements);
        lib.sections  = mergeById(lib.sections,  body.sections);
      } else if (body.kind && body.item) {
        if (body.kind === 'template') lib.templates = mergeById(lib.templates, [body.item]);
        else if (body.kind === 'section') lib.sections = mergeById(lib.sections, [body.item]);
        else lib.elements = mergeById(lib.elements, [body.item]);
      }
      await write(lib);
      res.status(200).json({ ok: true, counts: { templates: lib.templates.length, elements: lib.elements.length, sections: lib.sections.length } });
      return;
    }

    if (req.method === 'DELETE') {
      const { kind, id } = req.query || {};
      const lib = await read();
      if (kind === 'template') lib.templates = id ? (lib.templates || []).filter(x => x.id !== id) : [];
      else if (kind === 'element') lib.elements = id ? (lib.elements || []).filter(x => x.id !== id) : [];
      else if (kind === 'section') lib.sections = id ? (lib.sections || []).filter(x => x.id !== id) : [];
      else { lib.templates = []; lib.elements = []; lib.sections = []; }
      await write(lib);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};

// 환경변수에서 Upstash Redis REST 자격증명 자동 탐지 (어떤 prefix든)
function findCreds(env) {
  // 1) 잘 알려진 이름 우선
  const url1 = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || env.REDIS_REST_API_URL;
  const tok1 = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || env.REDIS_REST_API_TOKEN;
  if (url1 && tok1) return { url: url1, tok: tok1 };
  // 2) 값이 upstash.io 인 REST URL 변수를 찾고, 같은 prefix 의 TOKEN 매칭
  const urlKey = Object.keys(env).find(k => typeof env[k] === 'string' && /upstash\.io/i.test(env[k]) && /URL$/i.test(k) && /REST/i.test(k));
  if (urlKey) {
    const prefix = urlKey.replace(/URL$/i, '');
    const tokKey = Object.keys(env).find(k => k.startsWith(prefix) && /TOKEN$/i.test(k) && !/READ_ONLY/i.test(k));
    if (tokKey) return { url: env[urlKey], tok: env[tokKey] };
  }
  // 3) 이름 패턴만으로 매칭 (REST_API_URL ↔ REST_API_TOKEN)
  const k2 = Object.keys(env).find(k => /REST_API_URL$/i.test(k));
  if (k2) {
    const tk = k2.replace(/URL$/i, 'TOKEN');
    if (env[k2] && env[tk]) return { url: env[k2], tok: env[tk] };
  }
  return { url: null, tok: null };
}

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body) { try { resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body); } catch (_) { resolve({}); } return; }
    let d = ''; req.on('data', c => d += c); req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (_) { resolve({}); } });
  });
}
