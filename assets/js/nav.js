/* ============================================================
   导航辅助：目录滚动高亮、代码复制按钮、TOC 跳转平滑滚动
   ============================================================ */
(function () {
  'use strict';

  function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pre = btn.closest('.code-block') || btn.parentElement;
        var code = pre ? pre.querySelector('code') : null;
        if (!code) return;
        var text = code.textContent;
        function done() {
          var old = btn.textContent;
          btn.textContent = '已复制 ✓';
          setTimeout(function () { btn.textContent = old; }, 1500);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text); done(); });
        } else { fallback(text); done(); }
      });
    });
    function fallback(text) {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  function initActiveToc() {
    // 给当前页面目录项加 active 高亮（由 body[data-current-page] 驱动）
    var current = document.body.getAttribute('data-current-page');
    if (!current) return;
    document.querySelectorAll('.toc-item').forEach(function (item) {
      if (item.getAttribute('data-page') === current) item.classList.add('active');
    });
  }

  function initMobileNav() {
    var sidebar = document.querySelector('.sidebar');
    var firstGroup = sidebar ? sidebar.querySelector('.toc-group') : null;
    if (!sidebar || !firstGroup || sidebar.querySelector('.nav-toggle')) return;

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-toggle';
    button.textContent = '展开章节';
    button.setAttribute('aria-expanded', 'false');
    sidebar.insertBefore(button, firstGroup);

    function setOpen(open) {
      sidebar.classList.toggle('nav-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? '收起章节' : '展开章节';
    }

    button.addEventListener('click', function () {
      setOpen(!sidebar.classList.contains('nav-open'));
    });

    sidebar.querySelectorAll('.toc-item').forEach(function (item) {
      item.addEventListener('click', function () {
        if (window.matchMedia('(max-width: 900px)').matches) setOpen(false);
      });
    });

    var media = window.matchMedia('(max-width: 900px)');
    function handleMediaChange(event) {
      if (!event.matches) setOpen(false);
    }
    if (media.addEventListener) media.addEventListener('change', handleMediaChange);
  }

  function init() {
    initMobileNav();
    initCopyButtons();
    initActiveToc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
