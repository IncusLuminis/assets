/* staging-svg-panels.js — SVG slice panels for HUD staging / Blogger snippets */
'use strict';

(function (global) {
  var panels = {};
  var builtinLoaded = false;

  var BASE_PANEL_CSS =
    '.nc-svg-hud-panel{width:100%;max-width:900px;margin:0 auto;font-family:"Share Tech Mono",monospace;color:#b8e8f4;}\n' +
    '.nc-svg-hud-panel{text-align:center;}\n' +
    '.nc-svg-hud-panel .nc-svg-panel__inner{position:relative;display:inline-block;line-height:0;}\n' +
    '.nc-svg-hud-panel .nc-svg-panel__frame{position:relative;line-height:0;}\n' +
    '.nc-svg-hud-panel .nc-svg-panel__frame svg{height:min(72vh, 640px);width:auto;display:block;}\n' +
    '.nc-svg-hud-panel .nc-svg-panel__shapes{position:absolute;inset:0;pointer-events:none;}\n' +
    '.nc-svg-hud-panel .nc-svg-panel__shapes>[class^="nc-hud-shape-"]{position:absolute;inset:0;box-sizing:border-box;border:1px solid rgba(90,240,255,.35);}\n' +
    '.nc-svg-hud-panel .nc-svg-panel__slot{position:absolute;left:10%;right:8%;top:14%;bottom:10%;overflow:auto;z-index:2;line-height:normal;text-align:left;}\n' +
    '.nc-svg-hud-panel .nc-svg-panel__slot h2{margin:0 0 12px;font-size:clamp(18px,2.4vw,28px);letter-spacing:.12em;text-transform:uppercase;color:rgba(143,246,255,1);}\n' +
    '.nc-svg-hud-panel .nc-svg-panel__slot p{margin:0 0 10px;font-size:12px;line-height:1.65;color:rgba(190,250,255,.78);}\n' +
    '.nc-svg-hud-panel .nc-svg-panel__slot a{display:inline-block;margin-top:8px;padding:8px 12px;font-size:10px;text-decoration:none;color:rgba(103,246,224,.92);border:1px solid rgba(60,229,255,.82);background:rgba(20,5,0,.85);}\n' +
    '.nc-svg-hud-panel .nc-hud-float-image{float:right;max-width:42%;height:auto;margin:0 0 12px 16px;border:1px solid rgba(80,220,255,.22);object-fit:contain;}\n' +
    '.nc-svg-hud-panel .nc-hud-media{position:relative;width:100%;margin:0 0 14px;background:rgba(0,8,18,.9);overflow:hidden;}\n' +
    '.nc-svg-hud-panel .nc-hud-media iframe{display:block;width:100%;height:100%;border:none;}\n' +
    '\n' +
    '/* Scoped mini/expand toggle styles (do NOT affect HUD01/HUD02) */\n' +
    '.nc-svg-hud-panel.nc-mini-widget{overflow:hidden;transition:max-height 700ms cubic-bezier(.2,.9,.2,1);}\n' +
    '.nc-svg-hud-panel .nc-svg-panel__inner.nc-mini-panel{transform-origin:top center;transition:transform 700ms cubic-bezier(.2,.9,.2,1);}\n' +
    '.nc-svg-hud-panel .nc-ol-toggle-btn{position:absolute;z-index:36;font-family:"Share Tech Mono",monospace;font-size:38px;line-height:1;color:rgba(80,220,255,.98);background:transparent;border:1px solid transparent;padding:12px 22px;cursor:pointer;clip-path:polygon(5px 0%,calc(100% - 5px) 0%,100% 5px,100% 100%,calc(100% - 5px) 100%,5px 100%,0% calc(100% - 5px),0% 5px);transition:border-color .18s ease,box-shadow .18s ease,color .18s ease,background .18s ease;pointer-events:all;}\n' +
    '.nc-svg-hud-panel .nc-ol-toggle-btn:hover{color:rgba(150,245,255,.98);border-color:rgba(80,220,255,.75);}\n' +
    '.nc-svg-hud-panel .nc-ol-toggle-btn::after{content:attr(data-tooltip);position:absolute;top:calc(100% + 7px);right:0;display:none;white-space:nowrap;font-family:"Share Tech Mono",monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(80,220,255,.88);background:rgba(0,6,16,.96);border:1px solid rgba(80,220,255,.32);padding:4px 10px;pointer-events:none;z-index:50;box-shadow:0 0 10px rgba(80,220,255,.18);}\n' +
    '.nc-svg-hud-panel .nc-ol-toggle-btn:hover::after{display:block;}\n';

  function warn(msg) {
    if (typeof console !== 'undefined') console.warn('[StagingSvgPanels]', msg);
  }

  function panelList() {
    return Object.keys(panels).map(function (id) {
      return panels[id];
    });
  }

  function getPanel(id) {
    return panels[id] || null;
  }

  function registerPanel(def) {
    if (!def || !def.id) {
      warn('registerPanel: missing id');
      return null;
    }
    def.prefix = def.prefix || ('nc-hud-' + def.id.replace(/^hud/, ''));
    def.label = def.label || def.id.toUpperCase();
    panels[def.id] = def;
    return def;
  }

  function jsonToSvg(json) {
    if (!json || !json.canvas) return '';
    var w = json.canvas.width || 992;
    var h = json.canvas.height || 1586;
    var lines = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'
    ];

    (json.shapes || []).forEach(function (shape) {
      if (shape.visible === false || !shape.points || !shape.points.length) return;
      var pts = shape.points.map(function (p) {
        return (p[0] * w).toFixed(2) + ',' + (p[1] * h).toFixed(2);
      }).join(' ');
      var cls = 'nc-hud-shape-' + shape.id;
      var stroke = shape.stroke || '#5af0ff';
      var sw = shape.strokeWidth != null ? shape.strokeWidth : 2;
      var fill = shape.fill && shape.fill !== 'none' ? shape.fill : 'none';
      if (shape.type === 'polygon' && shape.closed !== false) {
        lines.push('  <polygon class="' + cls + '" points="' + pts + '" stroke="' + stroke + '" stroke-width="' + sw + '" fill="' + fill + '"/>');
      } else {
        lines.push('  <polyline class="' + cls + '" points="' + pts + '" stroke="' + stroke + '" stroke-width="' + sw + '" fill="none"/>');
      }
    });

    lines.push('</svg>');
    return lines.join('\n');
  }

  function shapeOverlayHtml(cssText) {
    if (!cssText) return '';
    var re = /\.nc-hud-shape-([a-zA-Z0-9_]+)\s*\{[^}]*clip-path:\s*polygon\(([^)]*)\)/g;
    var ids = [];
    var m;
    while ((m = re.exec(cssText))) {
      if (m[2] && m[2].trim()) ids.push(m[1]);
    }
    if (!ids.length) return '';
    return ids.map(function (id) {
      return '        <div class="nc-hud-shape-' + id + '"></div>';
    }).join('\n');
  }

  function scopeCss(css, scope) {
    if (!css || !css.trim()) return '';
    return css.trim().split(/\n/).map(function (line) {
      var t = line.trim();
      if (!t || t.charAt(0) === '@' || t.indexOf('/*') === 0) return line;
      if (t.indexOf(scope) === 0) return line;
      return scope + ' ' + line;
    }).join('\n');
  }

  function fetchText(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return r.text();
    });
  }

  function loadFromBaseUrl(id, label, baseUrl) {
    var svgUrl = baseUrl + '.svg';
    var cssUrl = baseUrl + '.css';
    var jsUrl = baseUrl + '.js';
    var jsonUrl = baseUrl + '.json';

    return Promise.all([
      fetchText(svgUrl).catch(function () { return null; }),
      fetchText(cssUrl).catch(function () { return null; }),
      fetchText(jsUrl).catch(function () { return null; }),
      fetchText(jsonUrl).catch(function () { return null; })
    ]).then(function (parts) {
      var svg = parts[0];
      var css = parts[1] || '';
      var js = parts[2] || '';
      var jsonRaw = parts[3];
      var json = null;
      var canvas = { width: 992, height: 1586 };

      if (jsonRaw) {
        try {
          json = JSON.parse(jsonRaw);
          if (json.canvas) canvas = json.canvas;
        } catch (e) {
          warn('invalid JSON at ' + jsonUrl);
        }
      }
      if (!svg && json) svg = jsonToSvg(json);

      registerPanel({
        id: id,
        label: label,
        prefix: 'nc-hud-10',
        basename: baseUrl.split('/').pop(),
        canvas: canvas,
        svg: svg || '',
        css: css,
        js: js,
        source: 'builtin'
      });
      return panels[id];
    });
  }

  registerPanel({
    id: 'hud10',
    label: 'HUD-10',
    prefix: 'nc-hud-10',
    basename: 'Details',
    canvas: { width: 992, height: 1586 },
    svg: '',
    css: '',
    js: '',
    source: 'builtin'
  });

  function loadBuiltinPanels() {
    if (builtinLoaded) return Promise.resolve(panelList());
    builtinLoaded = true;
    return loadFromBaseUrl('hud10', 'HUD-10', 'panels/hud-10/assets/Details').catch(function (e) {
      warn('builtin hud10: ' + e.message);
      return null;
    }).then(function () {
      return panelList();
    });
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve({ name: file.name, text: reader.result }); };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function importFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return Promise.resolve(null);

    var byBase = {};
    files.forEach(function (file) {
      var m = file.name.match(/^(.+)\.(svg|css|js|json)$/i);
      if (!m) return;
      var base = m[1];
      var ext = m[2].toLowerCase();
      if (!byBase[base]) byBase[base] = {};
      byBase[base][ext] = file;
    });

    var bases = Object.keys(byBase);
    if (!bases.length) {
      warn('no .svg/.css/.js/.json files selected');
      return Promise.resolve(null);
    }

    var baseName = bases[0];
    if (bases.length > 1) warn('multiple basenames; using ' + baseName);

    var group = byBase[baseName];
    var reads = [];
    ['svg', 'css', 'js', 'json'].forEach(function (ext) {
      if (group[ext]) reads.push(readFile(group[ext]).then(function (r) { return { ext: ext, text: r.text }; }));
    });

    return Promise.all(reads).then(function (parts) {
      var svg = null;
      var css = '';
      var js = '';
      var json = null;
      parts.forEach(function (p) {
        if (p.ext === 'svg') svg = p.text;
        if (p.ext === 'css') css = p.text;
        if (p.ext === 'js') js = p.text;
        if (p.ext === 'json') {
          try { json = JSON.parse(p.text); } catch (e) { warn('JSON parse failed'); }
        }
      });
      if (!svg && json) svg = jsonToSvg(json);
      if (!svg) {
        warn('SVG missing for ' + baseName);
        return null;
      }

      var id = 'import-' + baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      var n = 1;
      while (panels[id]) { id = 'import-' + baseName.toLowerCase() + '-' + (n++); }

      var canvas = (json && json.canvas) ? json.canvas : { width: 992, height: 1586 };
      var num = id.replace(/^import-/, '').replace(/-/g, '');
      var prefix = 'nc-hud-' + (num.length <= 2 ? num : num.slice(0, 8));

      registerPanel({
        id: id,
        label: baseName + ' (' + id + ')',
        prefix: prefix,
        basename: baseName,
        canvas: canvas,
        svg: svg,
        css: css,
        js: js,
        source: 'import'
      });
      return panels[id];
    });
  }

  function slotActionLine(label, btnStyle, opts) {
    if (!opts.button) return '';
    return '        <a href="#"' + btnStyle + '>' + label + '</a>';
  }

  function slotContentGeneric(contentType, opts) {
    opts = opts || {};
    var titleStyle = opts.title ? ' style="color:rgba(143,246,255,1);font-size:clamp(18px,2.4vw,28px);letter-spacing:.12em;"' : '';
    var textStyle = opts.text ? ' style="color:rgba(190,250,255,.78);font-size:12px;line-height:1.65;"' : '';
    var btnStyle = opts.button
      ? ' style="color:rgba(103,246,224,.92);background:rgba(20,5,0,.85);border:1px solid rgba(60,229,255,.82);padding:8px 12px;font-size:10px;text-decoration:none;display:inline-block;margin-top:8px;"'
      : '';
    var imageStyle = opts.image
      ? ' style="float:right;max-width:42%;height:auto;margin:0 0 12px 16px;border:1px solid rgba(80,220,255,.22);"'
      : '';

    switch (contentType) {
      case 'image':
        return [
          '        <h2' + titleStyle + '>ДОСЬЕ ОБЪЕКТА</h2>',
          '        <img class="nc-hud-float-image" src="https://via.placeholder.com/400x500/0a1a2a/4af?text=IMAGE" alt="Изображение"' + imageStyle + '>',
          '        <p' + textStyle + '>Описание объекта. Замените src на URL изображения (Blogger CDN).</p>',
          slotActionLine('ПОДРОБНЕЕ', btnStyle, opts)
        ].filter(Boolean).join('\n');
      case 'youtube':
        return [
          '        <h2' + titleStyle + '>ПЕРЕДАЧА С БОРТА</h2>',
          '        <div class="nc-hud-media" style="aspect-ratio:16/9;">',
          '          <iframe src="https://www.youtube.com/embed/VIDEO_ID?rel=0&modestbranding=1" allowfullscreen style="width:100%;height:100%;border:0;"></iframe>',
          '        </div>',
          '        <p' + textStyle + '>Замените VIDEO_ID и текст.</p>',
          slotActionLine('ОТКРЫТЬ АРХИВ', btnStyle, opts)
        ].filter(Boolean).join('\n');
      case 'heygen':
        return [
          '        <h2' + titleStyle + '>АГЕНТ СВЯЗИ</h2>',
          '        <div class="nc-hud-media" style="aspect-ratio:9/16;max-width:280px;">',
          '          <iframe src="https://share.heygen.com/embed/HEYGEN_VIDEO_ID" allowfullscreen style="width:100%;height:100%;border:0;"></iframe>',
          '        </div>',
          '        <p' + textStyle + '>Замените HEYGEN_VIDEO_ID.</p>',
          slotActionLine('ДОСТУП', btnStyle, opts)
        ].filter(Boolean).join('\n');
      default:
        return [
          '        <h2' + titleStyle + '>ЗАГОЛОВОК ПАНЕЛИ</h2>',
          '        <p' + textStyle + '>Текст содержимого панели. Замените на нужный контент.</p>',
          '        <p' + textStyle + '>Второй абзац — для теста переноса и высоты слота.</p>',
          slotActionLine('ДЕЙСТВИЕ', btnStyle, opts)
        ].filter(Boolean).join('\n');
    }
  }

  function styleAttrFromInlineToggles(collapse, opts) {
    opts = opts || {};
    var mode = collapse === 'maxi' ? 'maxi' : collapse;
    var rules = [];

    if (opts.toggle) {
      if (mode === 'maxi') {
        rules.push('--nc-toggle-maxi-top:   -8px;');
        rules.push('--nc-toggle-maxi-left:  -5px;');
      } else if (mode === 'mini') {
        rules.push('--nc-toggle-mini-top:   -8px;');
        rules.push('--nc-toggle-mini-left:  -5px;');
        rules.push('--nc-toggle-mini-scale: 1;');
      } else {
        rules.push('--nc-toggle-micro-top:       2px;');
        rules.push('--nc-toggle-micro-left:      2px;');
        rules.push('--nc-toggle-micro-scale:     0.35;');
      }
    }

    if (opts.title) {
      rules.push('--nc-title-' + mode + '-top:   0px;');
      rules.push('--nc-title-' + mode + '-left:  0px;');
    }

    if (opts.button && mode === 'mini') {
      rules.push('--nc-btn-mini-top:   152px;');
      rules.push('--nc-btn-mini-left:  0px;');
    }

    if (!rules.length) return '';

    // Keep formatting close to the existing staging.html output.
    return ' style="' + rules.map(function (rule, index) {
      return (index ? '\n              ' : '') + rule;
    }).join('') + '"';
  }

  function generateSnippet(panelId, contentType, collapse, styleOpts) {
    var panel = getPanel(panelId);
    if (!panel || !panel.svg) return '';

    var prefix = panel.prefix;
    var colAttr = collapse === 'maxi' ? '' : '\n     data-collapse="' + collapse + '"';
    var rootStyle = styleAttrFromInlineToggles(collapse, styleOpts);
    var scopedCss = scopeCss(panel.css || '', '.' + prefix + '-panel');
    var shapes = shapeOverlayHtml(panel.css);
    var initFn = panel.id === 'hud10' ? 'NcHud10' : null;
    var initCfg = collapse === 'maxi' ? '{mini:false}' : '{}';
    var scriptBlock = '';

    if (panel.js && panel.js.trim()) {
      scriptBlock =
        '<script>\n' + panel.js.trim() + '\n' +
        '(function(){var w=document.querySelectorAll(".' + prefix + ':not([data-hud-init])");' +
        'w=w[w.length-1];if(!w)return;w.setAttribute("data-hud-init","1");' +
        (initFn ? 'if(window.' + initFn + ')' + initFn + '.init(w,' + initCfg + ');' : '') +
        '})();\n<\/script>';
    } else if (initFn) {
      scriptBlock =
        '<script>(function(){var w=document.querySelectorAll(".' + prefix + ':not([data-hud-init])");' +
        'w=w[w.length-1];if(!w)return;w.setAttribute("data-hud-init","1");' +
        'if(window.' + initFn + ')' + initFn + '.init(w,' + initCfg + ');})();<\/script>';
    }

    var styleBlock = '<style>\n' + BASE_PANEL_CSS + scopedCss + '\n</style>';

    var lines = [
      '<div class="nc-hud-row">',
      '',
      styleBlock,
      '',
      '  <div class="' + prefix + ' nc-svg-hud-panel" data-panel="' + panel.id + '"' + colAttr + rootStyle + '>',
      '    <div class="' + prefix + '-panel nc-svg-panel__inner">',
      '      <div class="nc-svg-panel__frame">',
      panel.svg.split('\n').map(function (l) { return '        ' + l.trim(); }).join('\n'),
      shapes ? '      <div class="nc-svg-panel__shapes" aria-hidden="true">\n' + shapes + '\n      </div>' : '',
      '      </div>',
      '      <div class="nc-svg-panel__slot">',
      slotContentGeneric(contentType, styleOpts),
      '      </div>',
      '    </div>',
      '  </div>',
      '  ' + scriptBlock,
      '',
      '</div>'
    ];

    return lines.filter(function (l) { return l !== ''; }).join('\n');
  }

  function isSvgPanelId(id) {
    var p = getPanel(id);
    return !!(p && p.svg);
  }

  global.StagingSvgPanels = {
    registerPanel: registerPanel,
    getPanel: getPanel,
    panelList: panelList,
    loadBuiltinPanels: loadBuiltinPanels,
    importFiles: importFiles,
    jsonToSvg: jsonToSvg,
    generateSnippet: generateSnippet,
    isSvgPanelId: isSvgPanelId
  };
})(typeof window !== 'undefined' ? window : this);
