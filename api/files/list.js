export default async function list(ctx) {
  const fs = ctx.host?.fs || ctx.fs;
  if (!fs) return { files: [] };
  try {
    const listed = (await fs.list?.('files')) || fs.list('files');
    let files = [];
    if (Array.isArray(listed)) files = listed;
    else if (listed?.files) files = listed.files;
    else if (listed?.entries) files = listed.entries;
    return {
      files: files
        .filter((f) => {
          const n = f && (f.name || f);
          return n && !String(n).endsWith('.name') && !(f && f.dir);
        })
        .map((f) => ({ name: f.name || f, size: f.size || 0 }))
    };
  } catch {
    return { files: [] };
  }
}
