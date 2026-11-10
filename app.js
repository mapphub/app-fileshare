(function () {
  var list = document.getElementById('list');
  var err = document.getElementById('err');
  var DB = 'fileshare_v1';
  var KEY = 'files';
  var store = {};

  function toB64(buf) {
    var bin = '', bytes = new Uint8Array(buf), chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk)
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(bin);
  }
  function b64ToBlob(b64, mime) {
    var bin = atob(b64), len = bin.length, bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime || 'application/octet-stream' });
  }
  function persist() {
    try {
      if (window.MiniApps && MiniApps.db && MiniApps.db.local)
        return MiniApps.db.local.set(DB, KEY, store);
    } catch (e) {}
  }
  function render() {
    list.innerHTML = '';
    var names = Object.keys(store);
    if (!names.length) {
      list.innerHTML = '<li class="empty">Пока нет файлов</li>';
      return;
    }
    names.forEach(function (name) {
      var li = document.createElement('li');
      var span = document.createElement('span');
      span.textContent = name + (store[name].size ? ' (' + store[name].size + ' б)' : '');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'link';
      btn.textContent = 'Скачать';
      btn.onclick = function () {
        var f = store[name];
        if (!f || !f.base64) return;
        var url = URL.createObjectURL(b64ToBlob(f.base64, f.mime));
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      };
      li.appendChild(span);
      li.appendChild(btn);
      list.appendChild(li);
    });
  }
  async function load() {
    err.textContent = '';
    try {
      if (MiniApps.db && MiniApps.db.local) {
        await MiniApps.db.local.open(DB);
        var v = await MiniApps.db.local.get(DB, KEY);
        if (v && typeof v === 'object') store = v;
      }
    } catch (e) {
      err.textContent = String(e.message || e);
    }
    render();
  }
  async function uploadFile(file) {
    var b64 = toB64(await file.arrayBuffer());
    var entry = { name: file.name, base64: b64, size: file.size, mime: file.type || 'application/octet-stream', ts: Date.now() };
    store[file.name] = entry;
    await persist();
    try {
      if (MiniApps.net && MiniApps.net.send)
        await MiniApps.net.send({ type: 'file', file: entry }, 'file');
    } catch (e) {}
    render();
  }
  document.getElementById('file').onchange = async function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file) return;
    err.textContent = 'Загрузка…';
    try {
      await uploadFile(file);
      err.textContent = '';
    } catch (e) {
      err.textContent = e.message || e;
    }
  };
  document.getElementById('refresh').onclick = load;
  function onFile(p) {
    try {
      var f = p && (p.file || p);
      if (!f || !f.name || !f.base64) return;
      store[f.name] = f;
      persist();
      render();
    } catch (e) {}
  }
  function boot() {
    if (typeof MiniApps === 'undefined') {
      err.textContent = 'MiniApps недоступен';
      return;
    }
    try {
      if (MiniApps.net && MiniApps.net.on) MiniApps.net.on('file', onFile);
    } catch (e) {}
    load();
  }
  if (window.MiniApps) boot();
  else window.addEventListener('miniapps-ready', boot);
})();
