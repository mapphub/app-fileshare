export default async function get(ctx) {
  const name = ctx.params?.name || '';
  if (!name) return { error: 'name required' };
  const fs = ctx.host?.fs || ctx.fs;
  try {
    const data = (await fs.read?.('files/' + name)) || fs.read('files/' + name);
    if (data?.binary && data.base64) return { name, base64: data.base64, binary: true };
    if (data?.text != null) return { name, content: data.text };
    if (typeof data === 'string') return { name, content: data };
    return { name, content: data };
  } catch (e) {
    return { error: String(e?.message || e) };
  }
}
