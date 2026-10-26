/* ============================================================
   学习进度持久化（localStorage）+ 顶部进度条 + 目录高亮
   完全离线，数据仅保存在本地浏览器
   ============================================================ */
(function () {
  'use strict';
  var STORAGE_KEY = 'fastapi_tutorial_progress';

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) {}
  }

  function getPageId() {
    // 用当前页面文件名（不含扩展名）作为 ID
    var path = location.pathname.split('/');
    var name = path[path.length - 1].replace(/\.html?$/, '');
    return name || 'index';
  }

  function markDone() {
    var p = loadProgress();
    p[getPageId()] = true;
    saveProgress(p);
    updateUI();
  }

  function updateUI() {
    var p = loadProgress();
    var pageId = getPageId();

    // 顶部进度条 = 已完成页面数 / 总页面数（基于 data-total-pages）
    var total = parseInt(document.body.getAttribute('data-total-pages') || '1', 10);
    var doneCount = 0;
    var ids = (document.body.getAttribute('data-page-ids') || '').split(',');
    ids.forEach(function (id) { if (p[id]) doneCount++; });
    var pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    var bar = document.querySelector('.top-progress .bar');
    if (bar) bar.style.width = pct + '%';

    // 完成按钮状态
    var btn = document.querySelector('.complete-btn');
    if (btn) {
      if (p[pageId]) {
        btn.classList.add('done');
        btn.textContent = '✓ 本章已完成';
      } else {
        btn.classList.remove('done');
        btn.textContent = '标记本章为已完成';
      }
    }

    // 目录项勾选状态
    document.querySelectorAll('.toc-item').forEach(function (item) {
      var href = item.getAttribute('data-page') || '';
      if (href && p[href]) item.classList.add('done');
    });

    // 首页章节卡片
    document.querySelectorAll('.chapter-card').forEach(function (card) {
      var id = card.getAttribute('data-page');
      if (id && p[id]) card.classList.add('done');
    });

    // 首页总进度
    var totalLabel = document.querySelector('#global-progress-label');
    if (totalLabel) totalLabel.textContent = doneCount + ' / ' + total + ' 章';
    var totalFill = document.querySelector('#global-progress-fill');
    if (totalFill) totalFill.style.width = pct + '%';
  }

  function init() {
    var btn = document.querySelector('.complete-btn');
    if (btn) btn.addEventListener('click', markDone);

    // 目录项点击不再额外处理（由 HTML 锚点跳转）
    updateUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
