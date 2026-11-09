export default async function upload(ctx) {
  const body = ctx.params || {};
  const name = String(body.name || 'file.bin').replace(/[\\/]/g, '_');
  const fs = ctx.host?.fs || ctx.fs;
  if (body.saved) return { ok: true, name, size: body.size || 0 };
  const b64 = body.base64 || body.data || body.content || '';
  if (!b64) return { error: 'base64 required' };
  try {
    try { await fs.mkdir?.('files'); } catch {}
    const wr = (await fs.write?.('files/' + name, b64, true)) || fs.write('files/' + name, b64, true);
    if (wr?.error) return { error: wr.error };
    return { ok: true, name };
  } catch (e) {
    return { error: String(e?.message || e) };
  }
}
