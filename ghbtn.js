/* MB Editor - GitHub button on the Projects tab.
   The GitHub repositories no longer sit at the bottom of the page: tap "GitHub" (right of "All projects")
   and they open on their own screen, with a spinner while they load. */
(function () {
  'use strict';
  if (window.__mbGhBtn) return;
  var $ = function (id) { return document.getElementById(id); };
  var sec = $('ghProjectsSection'), count = $('projectCount');
  if (!sec || !count || !count.parentNode) return;
  window.__mbGhBtn = 1;

  var st = document.createElement('style');
  st.textContent =
    '#mbGhOpen{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px;border:1px solid #303139;border-radius:10px;background:#20222a;color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer}' +
    '#mbGhBd{display:none;position:fixed;left:0;right:0;top:0;bottom:0;z-index:10003;background:#17181c;overflow-y:auto;-webkit-overflow-scrolling:touch}' +
    '#mbGhBd.open{display:block}' +
    '#mbGhBd .mbgh-bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 12px) 12px 10px;background:#17181c}' +
    '#mbGhBd .mbgh-b{height:40px;min-width:40px;padding:0 14px;display:grid;place-items:center;border:1px solid #303139;border-radius:12px;background:#20222a;color:#fff;font:800 13px system-ui,sans-serif;cursor:pointer}' +
    '#mbGhBd .mbgh-body{padding:0 12px 24px}' +
    '#mbGhBd .mbgh-spin{position:fixed;left:0;right:0;top:0;bottom:0;z-index:5;display:none;align-items:center;justify-content:center;background:#17181c}' +
    '#mbGhBd .mbgh-spin.on{display:flex}' +
    '#mbGhBd .mbgh-spin i{width:30px;height:30px;border:3px solid #2a2c34;border-top-color:var(--red,#e0883a);border-radius:50%;animation:mb-spin .8s linear infinite}' +
    '#mbGhBd #ghProjectsSection[hidden]{display:none!important}';
  document.head.appendChild(st);

  // 1) the new button, on the right side of "All projects" (next to the count)
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;gap:8px';
  var gb = document.createElement('button');
  gb.type = 'button'; gb.id = 'mbGhOpen';
  gb.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>GitHub';
  count.parentNode.insertBefore(wrap, count);
  wrap.appendChild(gb); wrap.appendChild(count);

  // 2) the GitHub screen. The repo list is moved out of the bottom of the Projects page into it.
  var bd = document.createElement('div');
  bd.id = 'mbGhBd';
  bd.innerHTML =
    '<div class="mbgh-bar"><div class="mbgh-b" id="mbGhBack" style="font-size:22px;font-weight:400" aria-label="Back">&#8249;</div>' +
    '<b style="font-size:16px;color:#fff">GitHub</b><span style="flex:1"></span>' +
    '<div class="mbgh-b" id="mbGhRefresh" aria-label="Refresh">&#8635;</div></div>' +
    '<div class="mbgh-body" id="mbGhBody"></div>' +
    '<div class="mbgh-spin" id="mbGhSpin"><i></i></div>';
  document.body.appendChild(bd);
  var body = $('mbGhBody'), spin = $('mbGhSpin');
  body.appendChild(sec);

  var msg = document.createElement('div');
  msg.style.cssText = 'display:none;padding:18px 4px;color:#8f919b;font:14px/1.5 system-ui,sans-serif';
  msg.innerHTML = 'Connect your GitHub account to see your repositories here.<div id="mbGhConnect" style="margin-top:14px;display:inline-block;padding:11px 18px;border:1px solid #303139;border-radius:12px;background:#20222a;color:#fff;font-weight:800;cursor:pointer">Connect GitHub</div>';
  body.insertBefore(msg, body.firstChild);
  $('mbGhConnect').onclick = function () {
    var ob = $('ghOauthBtn');
    if (ob) ob.click(); else if (window.showToast) window.showToast('Open the GitHub tab and tap Connect', 'error');
  };

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function load(force) {
    spin.classList.add('on');
    var t0 = Date.now();
    try {
      if (force) window.__ghLast = 0;
      if (typeof window.loadGithubReposForProjects === 'function') await window.loadGithubReposForProjects();
      var t = Date.now();
      while (window.__ghLoading && Date.now() - t < 15000) await sleep(120);
    } catch (e) {}
    var left = 400 - (Date.now() - t0);
    if (left > 0) await sleep(left);
    msg.style.display = sec.hidden ? 'block' : 'none';
    spin.classList.remove('on');
  }

  function open() { bd.classList.add('open'); load(false); }
  function close() { bd.classList.remove('open'); }

  gb.onclick = function (e) { e.stopPropagation(); open(); };
  $('mbGhBack').onclick = close;
  $('mbGhRefresh').onclick = function () { load(true); };

  // 3) tapping a repo imports it: keep the spinner on until it is done, then close this screen
  var imp = window.importGithubRepoAsProject;
  if (typeof imp === 'function' && !imp.__mbgh) {
    window.importGithubRepoAsProject = async function () {
      var on = bd.classList.contains('open');
      if (on) spin.classList.add('on');
      try { return await imp.apply(this, arguments); }
      finally { if (on) { spin.classList.remove('on'); close(); } }
    };
    window.importGithubRepoAsProject.__mbgh = 1;
  }
})();
