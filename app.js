(async function(){
  try{ MiniApps.shell&&MiniApps.shell('setChrome',{topBar:false,bottomBar:false}); }catch(e){}
  async function refresh(){ const r=await MiniApps.fs('list',{path:'share/'}); const entries=(r&&r.entries)||[]; document.getElementById('list').innerHTML=entries.map(e=>'<li>'+e+'</li>').join('')||'<li class="muted">пусто</li>'; }
  document.getElementById('up').onclick=async()=>{ const f=document.getElementById('file').files[0]; if(!f)return; const text=await f.text(); await MiniApps.fs('write',{path:'share/'+f.name,content:text}); refresh(); };
  refresh();
})();
