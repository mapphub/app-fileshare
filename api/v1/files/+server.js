function ok(x) { return x; }
function fail(m) { return { error: String(m || 'error') }; }

function pickBody(ctx) {
  var body = ctx.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  return body || {};
}

function listFiles(ctx) {
  try {
    var listed = ctx.fs.list('files');
    var files = [];
    if (Array.isArray(listed)) files = listed;
    else if (listed && Array.isArray(listed.files)) files = listed.files;
    else if (listed && Array.isArray(listed.entries)) files = listed.entries;
    return files
      .filter(function (f) {
        var n = f && (f.name || f);
        return n && !String(n).endsWith('.name') && !(f && f.dir);
      })
      .map(function (f) {
        return { name: f.name || f, size: f.size || 0 };
      });
  } catch (e) {
    return [];
  }
}

export function GET(ctx) {
  var q = ctx.query || {};
  var name = q.name || '';
  if (name) {
    try {
      var data = ctx.fs.read('files/' + name);
      if (data && data.binary && data.base64) {
        return { name: name, base64: data.base64, binary: true };
      }
      if (data && data.text != null) {
        return { name: name, content: data.text };
      }
      if (typeof data === 'string') return { name: name, content: data };
      return { name: name, content: data };
    } catch (e) {
      return fail(e.message || e);
    }
  }
  return { files: listFiles(ctx) };
}

export function POST(ctx) {
  var body = pickBody(ctx);
  var name = String(body.name || 'file.bin').replace(/[\\\/]/g, '_');

  if (body.saved) {
    if (ctx.net && ctx.net.broadcast) {
      try { ctx.net.broadcast('file', { name: name, size: body.size || 0 }); } catch (e) {}
    }
    return ok({ ok: true, name: name, size: body.size || 0 });
  }

  var b64 = body.base64 || body.data || body.content || '';
  if (!b64) return fail('base64 required');
  try {
    ctx.fs.mkdir('files');
  } catch (e) {}
  try {
    var wr = ctx.fs.write('files/' + name, b64, true);
    if (wr && wr.error) return fail(wr.error);
    if (wr && wr.ok === false) return fail(wr.error || 'write failed');
    if (ctx.net && ctx.net.broadcast) {
      try { ctx.net.broadcast('file', { name: name }); } catch (e3) {}
    }
    return ok({ ok: true, name: name });
  } catch (e) {
    return fail(e.message || e);
  }
}
