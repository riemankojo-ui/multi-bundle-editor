/* MB Editor - editor-only app. Opens on the editor, no bottom tabs. */
(function () {
  'use strict';
  var MAP = { home: 'editor', bundle: 'editor', backups: 'editor', github: 'editor', updates: 'editor', settings: 'editor', services: 'editor' };
  try {
    var n = JSON.parse(localStorage.getItem('mb_nav') || 'null');
    if (!n || !n.tab || MAP[n.tab]) localStorage.setItem('mb_nav', JSON.stringify({ tab: 'editor', pid: (n && n.pid) || null }));
  } catch (e) {}
  function full() {
    var sh = document.getElementById('editorShell'), b = document.getElementById('editorFullBtn');
    if (sh && b && !sh.classList.contains('fullscreen')) b.click();
  }
  function wrap() {
    var s = window.showTab;
    if (typeof s !== 'function' || s.__eo) return;
    var w = function (name) { var t = MAP[name] || name, r = s(t); if (t === 'editor') setTimeout(full, 0); return r; };
    w.__eo = 1; window.showTab = w;
  }
  function bg(el) {
    while (el && el !== document.documentElement) {
      var c = getComputedStyle(el).backgroundColor, m = c.match(/[\d.]+/g);
      if (m && (m.length < 4 || parseFloat(m[3]) > 0.9)) return '#' + [0, 1, 2].map(function (i) { return ('0' + Math.round(+m[i]).toString(16)).slice(-2); }).join('');
      el = el.parentElement;
    }
    return '#0d0e12';
  }
  // Switch project: opens the same Projects list as the full app (cards with Preview / Edit / Sync).
  // Tap Edit on a card and you come straight back to the editor with that project.
  function addSwitch() {
    var row = document.querySelector('.et-file-row');
    if (!row || document.getElementById('editorProjectsBtn')) return;
    var b = document.createElement('button');
    b.id = 'editorProjectsBtn'; b.className = 'editor-btn small';
    b.title = 'Projects'; b.setAttribute('aria-label', 'Projects');
    b.style.cssText = 'height:42px;min-width:42px;flex-shrink:0;border-radius:10px';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>';
    b.onclick = function (e) { e.stopPropagation(); if (typeof window.showTab === 'function') window.showTab('projects'); };
    row.insertBefore(b, row.firstChild);
  }
  var lastBars = '';
  function bars() {
    try {
      var P = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FolderAccess;
      if (!P || !P.setBars) return;
      var w = window.innerWidth, h = window.innerHeight;
      var t = bg(document.elementFromPoint(w / 2, 3)), b = bg(document.elementFromPoint(w / 2, h - 3));
      if (t + b !== lastBars) { lastBars = t + b; P.setBars({ top: t, bottom: b }); }
    } catch (e) {}
  }
  setInterval(bars, 700);
  window.addEventListener('load', function () { setTimeout(bars, 300); });
  document.addEventListener('DOMContentLoaded', function () { wrap(); addSwitch(); });
  window.addEventListener('load', function () { wrap(); addSwitch(); full(); });
})();
