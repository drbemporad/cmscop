// Pocket CoP v1.0 — application logic

function igNodeHtml(n,q){
  function hilit(t){
    if(!q||!t)return t||'';
    var r=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return t.replace(new RegExp('('+r+')','gi'),'<mark>$1</mark>');
  }
  var t=hilit(n.text||'');
  if(n.type==='std')   return '<div class="std-head">'+t+'</div>';
  if(n.type==='para')  return '<div class="ig-para">'+t+'</div>';
  if(n.type==='probe') return '<div class="ig-probe">'+t+'</div>';
  if(n.type==='q')     return '<div class="ig-q"><span>'+t+'</span></div>';
  if(n.type==='sp')    return '<div class="ig-sp">'+t+'</div>';
  if(n.type==='sp_p')  return '<div class="ig-sp-p"><span>'+t+'</span></div>';
  var ind=n.indent?' ind'+n.indent:'';
  return '<div class="ig-p'+ind+'">'+t+'</div>';
}

function igBodyHtml(nodes, q, matchedSubsections){
  // matchedSubsections: Set of lowercase subsection ids like '(f)' derived from CoP search
  // When present, show IG std sections whose header contains that subsection label.
  // When absent, use normal IG text-match collapsing.
  var noFilter = !q && !matchedSubsections;
  if(noFilter){
    return '<div class="reg-body">'+nodes.map(function(n){return igNodeHtml(n,'');}).join('')+'</div>';
  }
  var ql = q ? q.toLowerCase() : '';
  function nm(n){ return ql ? (n.text||'').toLowerCase().includes(ql) : false; }

  // Split into std-sections
  var sections=[], cur=null;
  nodes.forEach(function(n){
    if(n.type==='std'){ cur={hdr:n, children:[], isFirst:sections.length===0}; sections.push(cur); }
    else if(cur){ cur.children.push(n); }
  });

  var h='<div class="reg-body">';
  sections.forEach(function(sec){
    h += igNodeHtml(sec.hdr, q);

    // First std = condition-level block: always show in full
    if(sec.isFirst){ sec.children.forEach(function(n){h+=igNodeHtml(n,q);}); return; }

    // Determine whether this std section is relevant
    var stdTxt = (sec.hdr.text||'').toLowerCase();
    var secMatch;
    if(matchedSubsections){
      // CoP-driven: show IG std sections whose header contains one of the matched CoP labels
      // e.g. CoP label '(f)' matches IG header '§ 482.13(f) — Seclusion…'
      secMatch = false;
      matchedSubsections.forEach(function(lbl){
        if(stdTxt.includes(lbl)) secMatch = true;
      });
    } else {
      secMatch = nm(sec.hdr) || sec.children.some(nm);
    }

    // Group children by para subsection
    var groups=[], cg=null;
    sec.children.forEach(function(n){
      if(n.type==='para'){ cg={hdr:n,items:[]}; groups.push(cg); }
      else if(cg){ cg.items.push(n); }
      else {
        if(!groups.length) groups.push({hdr:null,items:[]});
        groups[0].items.push(n);
      }
    });

    if(!secMatch){
      // Collapse: show para headers dimmed, no content
      groups.forEach(function(grp){
        if(grp.hdr) h+='<div class="ig-para ig-para-collapsed">'+(grp.hdr.text||'')+'</div>';
      });
      if(!groups.length) h+='<div class="ig-collapsed">&#8230; no match</div>';
      return;
    }

    // Section matches: show all paras (CoP-driven) or filter paras by IG query
    if(!groups.length){ sec.children.forEach(function(n){h+=igNodeHtml(n,q);}); return; }
    groups.forEach(function(grp){
      if(grp.hdr===null){ grp.items.forEach(function(n){h+=igNodeHtml(n,q);}); return; }
      var grpMatch = matchedSubsections ? true : (nm(grp.hdr)||grp.items.some(nm));
      if(grpMatch){
        h+=igNodeHtml(grp.hdr,q);
        grp.items.forEach(function(n){h+=igNodeHtml(n,q);});
      } else {
        h+='<div class="ig-para ig-para-collapsed">'+(grp.hdr.text||'')+'</div>';
      }
    });
  });
  h+='</div>';
  return h;
}


function rebuildAll(){buildCards();}

const main=document.getElementById('main'),noResults=document.getElementById('noResults'),resultsMeta=document.getElementById('resultsMeta'),searchInput=document.getElementById('search'),filterRow=document.getElementById('filterRow');
var activeFilter='all',activeQuery='',activeScope='cop';

function hl(t){if(!activeQuery)return t;const e=activeQuery.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return t.replace(new RegExp(`(${e})`,'gi'),'<mark>$1</mark>')}

function renderNode(n){
  if(n.type==='std'){
    return `<div class="std-head">${hl(n.label)} <em>${hl(n.title)}</em></div>`;
  } else if(n.type==='text'){
    const ind=n.indent>0?` para-indent-${n.indent}`:'';
    return `<div class="para${ind}">${hl(n.text)}</div>`;
  } else if(n.type==='p'){
    const ind=n.indent>0?` para-indent-${n.indent}`:'';
    return `<div class="para${ind}"><span class="para-label">${hl(n.label)}</span>${hl(n.text)}</div>`;
  }
  return '';
}

function nodeText(n){
  return ((n.label||'')+' '+(n.title||'')+' '+(n.text||'')).toLowerCase();
}

function renderBody(nodes, matchedLabels){
  // matchedLabels: Set of lowercase std labels to show (from IG search cross-link)
  // When absent, use normal text-match logic
  if(!activeQuery && !matchedLabels){
    return '<div class="reg-body">'+nodes.map(renderNode).join('')+'</div>';
  }
  var sections=[], current=null;
  nodes.forEach(function(n){
    if(n.type==='std'){ current={header:n,children:[]}; sections.push(current); }
    else if(current){ current.children.push(n); }
    else {
      if(!sections.length||sections[0].header!==null) sections.unshift({header:null,children:[]});
      sections[0].children.push(n);
    }
  });
  var q=activeQuery.toLowerCase();
  var h='<div class="reg-body">';
  sections.forEach(function(sec){
    if(sec.header===null){ sec.children.forEach(function(n){h+=renderNode(n);}); return; }
    var matches;
    if(matchedLabels){
      matches = matchedLabels.has((sec.header.label||'').toLowerCase());
    } else {
      matches = nodeText(sec.header).includes(q) || sec.children.some(function(n){return nodeText(n).includes(q);});
    }
    if(matches){
      h+=renderNode(sec.header);
      sec.children.forEach(function(n){h+=renderNode(n);});
    } else {
      h+='<div class="std-head std-collapsed">'+(sec.header.label||'')+' <em>'+(sec.header.title||'')+'</em></div>';
    }
  });
  h+='</div>';
  return h;
}

function buildCards(){
  [...main.querySelectorAll('.cop-card,.section-divider')].forEach(function(el){el.remove();});
  var q = activeQuery;
  var ql = q.toLowerCase();
  var scope = activeScope;
  var lastSubpart='', count=0;

  allCops.forEach(function(cop){
    var tagOk = activeFilter==='all' || cop.tags.includes(activeFilter);

    // Find matching IG entry for this cop section
    var m482 = cop.citation.replace(/ /g,' ').match(/482[\.][0-9]+/);
    var secNum = m482 ? m482[0] : null;
    var igEntry = secNum ? igData.find(function(e){
      var m=e.citation.match(/482[\.][0-9]+/); return m&&m[0]===secNum;
    }) : null;

    // Determine card-level match based on active scope
    var qOk;
    if(!ql){ qOk=true; }
    else if(scope==='cop'){
      var copTxt = (cop.citation+' '+cop.title+' '+(cop.intro||'')+' '
        +cop.body.map(function(n){return (n.label||'')+' '+(n.title||'')+' '+(n.text||'');}).join(' ')).toLowerCase();
      qOk = copTxt.includes(ql);
    } else {
      // scope === 'ig'
      var igTxt = igEntry ? igEntry.body.map(function(n){return n.text||'';}).join(' ').toLowerCase() : '';
      qOk = igTxt.includes(ql);
    }
    if(!tagOk||!qOk) return;
    count++;

    // Build cross-link sets: which subsection labels matched in the searched view
    // These drive collapsing in the opposite view.
    var copMatchedLabels = null;   // Set<string> of cop std labels like '(f)' — feeds igBodyHtml
    var igMatchedSubsecs = null;   // Set<string> of ig std subsec tokens like '(f)' — feeds renderBody

    if(ql && igEntry){
      if(scope==='cop'){
        // Find which CoP std sections contain the query; extract their labels
        var labelSet = new Set();
        var cs=[], cx=null;
        cop.body.forEach(function(n){
          if(n.type==='std'){ cx={lbl:(n.label||'').toLowerCase(), nodes:[]}; cs.push(cx); }
          else if(cx){ cx.nodes.push(n); }
        });
        cs.forEach(function(sec){
          var secTxt = sec.lbl+' '+sec.nodes.map(function(n){
            return (n.label||'')+' '+(n.title||'')+' '+(n.text||'');
          }).join(' ');
          if(secTxt.toLowerCase().includes(ql)) labelSet.add(sec.lbl);
        });
        if(labelSet.size) copMatchedLabels = labelSet;

      } else {
        // scope==='ig': find which IG std sections contain the query
        // Extract the subsection token from IG std text, e.g. '§ 482.13(f)' -> '(f)'
        var subsecSet = new Set();
        var is=[], ix=null;
        igEntry.body.forEach(function(n){
          if(n.type==='std'){ ix={txt:(n.text||'').toLowerCase(), nodes:[]}; is.push(ix); }
          else if(ix){ ix.nodes.push(n); }
        });
        is.forEach(function(sec){
          var secTxt = sec.txt+' '+sec.nodes.map(function(n){return n.text||'';}).join(' ');
          if(secTxt.toLowerCase().includes(ql)){
            // Extract subsection label like (a), (b)(1), (f) from the std header text
            var m = sec.txt.match(/\(([a-z][^)]*)\)/);
            if(m) subsecSet.add('('+m[1]+')');
          }
        });
        if(subsecSet.size) igMatchedSubsecs = subsecSet;
      }
    }

    // Render section divider
    if(cop.subpart!==lastSubpart){
      var d=document.createElement('div');
      d.className='section-divider'; d.textContent=cop.subpart; main.appendChild(d);
      lastSubpart=cop.subpart;
    }

    // Default displayed view = the scope being searched (so results are immediately visible)
    var defaultView = igEntry ? scope : 'cop';
    var copDisplay  = defaultView==='cop' ? '' : 'none';
    var igDisplay   = defaultView==='ig'  ? '' : 'none';

    var card = document.createElement('div');
    card.className = 'cop-card'+(ql?' open':'');

    var badges = cop.tags.map(function(t){
      var cls=t==='psych'?'badge-psych':t==='provider-agreement'?'badge-provider':'badge-general';
      var lbl=t==='psych'?'PSYCH-SPECIFIC':t==='provider-agreement'?'PROVIDER AGMT':'GENERAL CoP';
      return '<span class="badge '+cls+'">'+lbl+'</span>';
    }).join('');

    var introHTML = cop.intro ? '<div class="reg-intro">'+hl(cop.intro)+'</div>' : '';

    var toggleHTML = igEntry
      ? ('<div class="card-toggle" onclick="event.stopPropagation()">'
          +'<button class="card-toggle-btn'+(defaultView==='cop'?' active':'')+'" data-view="cop">CoP Text</button>'
          +'<button class="card-toggle-btn'+(defaultView==='ig'?' active':'')+'" data-view="ig">Interp. Guidelines</button>'
          +'</div>')
      : '';

    var copHTML = '<div class="card-view card-view-cop" style="display:'+copDisplay+';">'
      + introHTML + renderBody(cop.body, igMatchedSubsecs)
      + '<div class="cfr-source">42 CFR '+cop.citation.replace(' ','')+'— '
      + '<a href="https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-482"'
      +' target="_blank" rel="noopener">eCFR</a></div></div>';

    var igHTML = igEntry
      ? ('<div class="card-view card-view-ig" style="display:'+igDisplay+';">'
          + igBodyHtml(igEntry.body, scope==='ig' ? q : '', copMatchedLabels)
          + '<div class="cfr-source"><a href="'+igEntry.link+'"'
          +' target="_blank" rel="noopener">Source: '+igEntry.source+' ↗</a></div></div>')
      : '';

    card.innerHTML =
      '<div class="cop-header">'
        +'<div class="cop-header-top">'
          +'<span class="cop-citation">'+hl(cop.citation)+'</span>'
          +'<div class="cop-title-wrap">'
            +'<div class="cop-title">'+hl(cop.title)+'</div>'
          +'</div>'
          +'<svg class="cop-chevron" width="16" height="16" viewBox="0 0 24 24"'
          +' fill="none" stroke="currentColor" stroke-width="2"'
          +' stroke-linecap="round" stroke-linejoin="round">'
          +'<polyline points="6 9 12 15 18 9"></polyline></svg>'
        +'</div>'
        +(badges||toggleHTML
          ? '<div class="cop-header-bottom">'
              +'<div class="cop-badges">'+badges+'</div>'
              +toggleHTML
            +'</div>'
          : '')
      +'</div>'
      +'<div class="cop-body">'+copHTML+igHTML+'</div>';

    card.querySelector('.cop-header').addEventListener('click',function(e){
      if(e.target.closest('.card-toggle'))return;
      card.classList.toggle('open');
    });

    if(igEntry){
      card.querySelectorAll('.card-toggle-btn').forEach(function(btn){
        btn.addEventListener('click',function(e){
          e.stopPropagation();
          card.querySelectorAll('.card-toggle-btn').forEach(function(b){b.classList.remove('active');});
          btn.classList.add('active');
          var view=btn.dataset.view;
          card.querySelector('.card-view-cop').style.display=view==='cop'?'':'none';
          card.querySelector('.card-view-ig').style.display=view==='ig'?'':'none';
          if(!card.classList.contains('open'))card.classList.add('open');
        });
      });
    }

    main.appendChild(card);
  });

  noResults.classList.toggle('show',count===0);
  resultsMeta.textContent = ql
    ? count+' section'+(count!==1?'s':'')+' matching “'+activeQuery+'” in '+(scope==='cop'?'CoP text':'Interp. Guidelines')
    : 'Showing '+count+' of '+allCops.length+' conditions';
}


searchInput.addEventListener('input',function(e){activeQuery=e.target.value.trim();rebuildAll();});
document.getElementById('scopeToggle').querySelectorAll('.scope-btn').forEach(function(btn){
  btn.addEventListener('click',function(){
    document.getElementById('scopeToggle').querySelectorAll('.scope-btn').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active'); activeScope=btn.dataset.scope; rebuildAll();
  });
});
filterRow.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    filterRow.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');activeFilter=btn.dataset.filter;rebuildAll();
  });
});
rebuildAll();

// ── Service Worker Registration & Update Detection ────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(function(reg) {
    reg.update();
    reg.addEventListener('updatefound', function() {
      var newSW = reg.installing;
      newSW.addEventListener('statechange', function() {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner();
        }
      });
    });
  });
  var refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (!refreshing) { refreshing = true; window.location.reload(); }
  });
}

function showUpdateBanner() {
  var b = document.getElementById('update-banner');
  if (b) b.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('update-reload');
  if (btn) btn.addEventListener('click', function() {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  });
});
