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

  // Vercel KV / Upstash 마켓플레이스 어느 쪽 env 이름이든 지원
  const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!URL || !TOK) { res.status(500).json({ error: 'KV/Redis not configured. Vercel 프로젝트에 Upstash(Redis)를 연결하세요.' }); return; }

  const read = async () => {
    const r = await fetch(`${URL}/get/${KEY}`, { headers: { Authorization: `Bearer ${TOK}` } });
    const j = await r.json().catch(() => ({}));
    try { return j && j.result ? JSON.parse(j.result) : { templates: [], elements: [] }; }
    catch (_) { return { templates: [], elements: [] }; }
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
      if (body.templates || body.elements) {
        lib.templates = mergeById(lib.templates, body.templates);
        lib.elements  = mergeById(lib.elements,  body.elements);
      } else if (body.kind && body.item) {
        if (body.kind === 'template') lib.templates = mergeById(lib.templates, [body.item]);
        else lib.elements = mergeById(lib.elements, [body.item]);
      }
      await write(lib);
      res.status(200).json({ ok: true, counts: { templates: lib.templates.length, elements: lib.elements.length } });
      return;
    }

    if (req.method === 'DELETE') {
      const { kind, id } = req.query || {};
      const lib = await read();
      if (kind === 'template') lib.templates = (lib.templates || []).filter(x => x.id !== id);
      else if (kind === 'element') lib.elements = (lib.elements || []).filter(x => x.id !== id);
      else { lib.templates = []; lib.elements = []; }
      await write(lib);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body) { try { resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body); } catch (_) { resolve({}); } return; }
    let d = ''; req.on('data', c => d += c); req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (_) { resolve({}); } });
  });
}
