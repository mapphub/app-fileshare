(function (g) {
  if (g.MiniApps && g.MiniApps.__mapp) return;
  var serverBase = '';
  try { serverBase = localStorage.getItem('mapp_server_base') || ''; } catch (e) {}
  function post(ns, action, params) {
    return new Promise(function (resolve, reject) {
      if (g.MiniApps && typeof g.MiniApps.call === 'function' && g.MiniApps.__native) {
        g.MiniApps.call(ns, action, params || {}).then(resolve, reject); return;
      }
      if (g.parent && g.parent !== g) {
        var id = 'm' + Date.now() + Math.random().toString(36).slice(2);
        function onMsg(ev) {
          var d = ev.data;
          if (!d || d.__mapp !== id) return;
          g.removeEventListener('message', onMsg);
          if (d.error) reject(new Error(d.error)); else resolve(d.result);
        }
        g.addEventListener('message', onMsg);
        try { g.parent.postMessage({ __mapp: true, id: id, ns: ns, action: action, params: params || {} }, '*'); }
        catch (e) { g.removeEventListener('message', onMsg); reject(e); }
        setTimeout(function () { g.removeEventListener('message', onMsg); reject(new Error('MiniApps timeout')); }, 20000);
        return;
      }
      if (ns === 'fs') {
        try {
          var key = 'mapp_fs_' + (params && params.path ? params.path : '');
          if (action === 'read') { resolve({ content: localStorage.getItem(key) || '' }); return; }
          if (action === 'write') { localStorage.setItem(key, (params && params.content) || ''); resolve({ ok: true }); return; }
          if (action === 'list') {
            var prefix = 'mapp_fs_' + ((params && params.path) || ''); var out = [];
            for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(prefix) === 0) out.push(k.slice(8)); }
            resolve({ entries: out }); return;
          }
          if (action === 'remove') { localStorage.removeItem(key); resolve({ ok: true }); return; }
        } catch (e) { reject(e); return; }
      }
      if (ns === 'shell' || ns === 'share') { resolve({ ok: true, web: true }); return; }
      reject(new Error('MiniApps unavailable: ' + ns + '.' + action));
    });
  }
  g.MiniApps = { __mapp: true, call: post, fs: function (a,p){return post('fs',a,p);}, shell: function (a,p){return post('shell',a,p);}, share: function (a,p){return post('share',a,p);}, net: function (a,p){return post('net',a,p);}, setServerBase: function (url){ serverBase=String(url||'').replace(/\/$/,''); try{localStorage.setItem('mapp_server_base',serverBase);}catch(e){} }, getServerBase: function(){return serverBase;}, ws:{ open: function(opts){ opts=opts||{}; var path=opts.path||'/'; return new Promise(function(resolve,reject){ var url; if(serverBase) url=serverBase.replace(/^http/,'ws')+path; else if(location.protocol==='https:'||location.protocol==='http:'){ var proto=location.protocol==='https:'?'wss:':'ws:'; url=proto+'//'+location.host+path; } else { reject(new Error('No WS endpoint')); return; } try{ var ws=new WebSocket(url); ws.addEventListener('open',function(){resolve(ws);}); ws.addEventListener('error',function(){reject(new Error('WS error'));}); }catch(e){reject(e);} }); } } };
})(typeof window !== 'undefined' ? window : globalThis);
