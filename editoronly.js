/* MB Editor - editor-only app. Opens on the editor, no bottom tabs. */
(function () {
  'use strict';
  var MAP = { home: 'editor', bundle: 'editor', backups: 'editor', github: 'editor', updates: 'editor', settings: 'editor', services: 'editor' };
  try {
    var n = JSON.parse(localStorage.getItem('mb_nav') || 'null');
    if (!n || !n.tab || MAP[n.tab]) localStorage.setItem('mb_nav', JSON.stringify({ tab: 'editor', pid: (n && n.pid) || null }));
  } catch (e) {}
  function wrap() {
    var s = window.showTab;
    if (typeof s !== 'function' || s.__eo) return;
    var w = function (name) { return s(MAP[name] || name); };
    w.__eo = 1; window.showTab = w;
  }
  document.addEventListener('DOMContentLoaded', wrap);
  window.addEventListener('load', wrap);
})();
