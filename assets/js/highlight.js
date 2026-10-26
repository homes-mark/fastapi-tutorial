/* ============================================================
   轻量 Python 语法高亮器（无外部依赖，完全离线）
   用于 <pre><code class="language-python"> 块
   ============================================================ */
(function () {
  'use strict';

  var KEYWORDS = new Set([
    'def','class','return','if','elif','else','for','while','in','not','and','or',
    'import','from','as','try','except','finally','raise','with','pass','break',
    'continue','lambda','global','nonlocal','yield','assert','del','is','None',
    'True','False','async','await','match','case'
  ]);
  var BUILTINS = new Set([
    'print','len','range','str','int','float','bool','list','dict','set','tuple',
    'type','isinstance','super','self','open','enumerate','zip','map','filter',
    'sorted','reversed','sum','min','max','abs','round','getattr','setattr','hasattr'
  ]);

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightPython(src) {
    // 先转义，避免 HTML 注入
    var s = esc(src);
    var out = '';
    var i = 0, n = s.length;
    var commentRe = /^#.*$/;
    var strRe = /^(?:f|r|u|b|fr|rf|br|rb)?("""|'''|"|')/;
    var numRe = /^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/;
    var identRe = /^[A-Za-z_][A-Za-z0-9_]*/;
    var decoRe = /^@[A-Za-z_][A-Za-z0-9_.]*/;

    while (i < n) {
      var ch = s[i];
      // 注释
      if (ch === '#') {
        var lineEnd = s.indexOf('\n', i);
        if (lineEnd === -1) lineEnd = n;
        out += '<span class="hljs-comment">' + s.slice(i, lineEnd) + '</span>';
        i = lineEnd;
        continue;
      }
      // 字符串（支持三引号与 f-string 前缀）
      var m = s.slice(i).match(strRe);
      if (m) {
        var q = m[1];
        var start = i;
        i += m[0].length;
        if (q === '"""' || q === "'''") {
          var close = s.indexOf(q, i);
          if (close === -1) { i = n; out += '<span class="hljs-string">' + s.slice(start) + '</span>'; continue; }
          i = close + 3;
        } else {
          while (i < n && s[i] !== q && s[i] !== '\n') i++;
          if (i < n && s[i] === q) i++;
        }
        out += '<span class="hljs-string">' + s.slice(start, i) + '</span>';
        continue;
      }
      // 装饰器
      if (ch === '@') {
        var dm = s.slice(i).match(decoRe);
        if (dm) { out += '<span class="hljs-decorator">' + dm[0] + '</span>'; i += dm[0].length; continue; }
      }
      // 数字
      if (/[0-9]/.test(ch)) {
        var nm = s.slice(i).match(numRe);
        out += '<span class="hljs-number">' + nm[0] + '</span>';
        i += nm[0].length;
        continue;
      }
      // 标识符
      if (/[A-Za-z_]/.test(ch)) {
        var im = s.slice(i).match(identRe);
        var word = im[0];
        var cls = 'hljs-params';
        if (KEYWORDS.has(word)) cls = 'hljs-keyword';
        else if (BUILTINS.has(word)) cls = 'hljs-built_in';
        else {
          // 检测函数调用 / 类名
          var after = s.slice(i + word.length);
          if (/^\s*\(/.test(after)) cls = 'hljs-title function_';
          else if (/^[A-Z]/.test(word)) cls = 'hljs-title class_';
        }
        out += '<span class="' + cls + '">' + word + '</span>';
        i += word.length;
        continue;
      }
      out += ch;
      i++;
    }
    return out;
  }

  function applyAll() {
    var blocks = document.querySelectorAll('pre code');
    blocks.forEach(function (code) {
      var cls = code.className || '';
      if (cls.indexOf('language-python') !== -1 || cls.indexOf('python') !== -1) {
        code.innerHTML = highlightPython(code.textContent);
      } else if (cls.indexOf('language-bash') !== -1 || cls.indexOf('bash') !== -1) {
        code.innerHTML = esc(code.textContent)
          .replace(/^(\$|\s*#)(.*)$/gm, '<span class="hljs-comment">$1$2</span>')
          .replace(/(\b(?:pip|python|uvicorn|uv|docker|curl|git|npm|pytest|alembic|fastapi)\b)/g,
            '<span class="hljs-built_in">$1</span>');
      } else if (cls.indexOf('language-json') !== -1 || cls.indexOf('json') !== -1) {
        code.innerHTML = esc(code.textContent)
          .replace(/("(?:[^"\\]|\\.)*")(\s*:)?/g, function (_, s, c) {
            return c ? '<span class="hljs-attr">' + s + '</span>' + c : '<span class="hljs-string">' + s + '</span>';
          })
          .replace(/\b(true|false|null)\b/g, '<span class="hljs-keyword">$1</span>');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    applyAll();
  }
})();
