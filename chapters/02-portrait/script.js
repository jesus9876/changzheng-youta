(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------- 数据 ----------------
  var SOURCES = {
    title: '本页史料口径与来源',
    body: '<p><strong>年龄数据</strong>：王树增《长征》：「指挥员的平均年龄不足 25 岁，战斗员的平均年龄不足 20 岁，14 至 18 岁的战士至少占 40%。」页面保留原文的「不足」「至少」等限定词，属纪实性估算，<strong>非精确统计</strong>。</p>' +
      '<p><strong>女红军人数</strong>：长征队伍中的女红军，按部队统计规模为：中央红军 32 名、红二方面军 20 多名、红四方面军约 3000 人（不完全统计）、红二十五军 7 名。另有史料对红四方面军记为「2000 多名」，系统计范围与节点不同。页面保留「约」「多名」等限定词。</p>' +
      '<p><strong>图片</strong>：青年战士形象与女红军群像均为 <strong>AI 情景再现</strong>（非历史照片），已在图中标注；背景与合影底图为真实史料照片（已做旧压暗处理）。两类内容不互相冒充。</p>' +
      '<p><strong>「许多人没有留下姓名和照片」</strong>：据长征史料，绝大多数红军战士未能在历史记录中留下个人姓名与影像，此为群体性史实，非精确统计。</p>' +
      '<p class="ov-src">数据来源：中国军网、人民网、中国共产党新闻网；详见《史料核验与数据口径》。本作品为课程作业，图片仅用于内部参考与非商业展示；公开发布或参赛前请逐张取得授权。</p>'
  };

  // 画像热区文案
  var HOT_COPY = {
    young: '战斗员平均年龄不足 20 岁。',
    figure: '这支队伍里，有战斗员，也有干部、医护和宣传工作者。',
    gear: '地图上的两万五千里，落在每个人身上，是一段真实的青春。'
  };

  // 固定历史锚点
  var ANCHORS = [
    { lo: 14, hi: 18, el: null },
    { at: 20, el: null },
    { at: 25, el: null },
    { at: 28, el: null }
  ];

  // ---------------- 导航 / 进度 ----------------
  var pages = $$('.page');
  var dotNav = $('#dotNav');
  pages.forEach(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', '第 ' + (i + 1) + ' 页');
    b.addEventListener('click', function () { s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
    dotNav.appendChild(b);
  });
  function setDots(id) {
    $$('#dotNav button').forEach(function (b, i) { b.classList.toggle('on', pages[i].id === id); });
  }

  var deck = $('#deck');
  var bar = $('#bar');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = deck.scrollHeight - deck.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? deck.scrollTop / max : 0) + ')';
      var best = null, bestD = Infinity;
      pages.forEach(function (s) {
        var r = s.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - window.innerHeight / 2);
        if (d < bestD) { bestD = d; best = s; }
      });
      if (best) setDots(best.id);
      ticking = false;
    });
  }
  deck.addEventListener('scroll', onScroll, { passive: true });

  // 尘埃粒子
  pages.forEach(function (p) {
    var d = p.querySelector('.dust');
    if (!d) return;
    for (var i = 0; i < 20; i++) {
      var s = document.createElement('i');
      s.style.cssText =
        'left:' + (Math.random() * 100).toFixed(2) + '%;' +
        'top:' + (Math.random() * 100).toFixed(2) + '%;' +
        '--sz:' + (0.8 + Math.random() * 2.2).toFixed(2) + 'px;' +
        '--dx:' + (-24 + Math.random() * 48).toFixed(1) + 'px;' +
        '--dur:' + (11 + Math.random() * 16).toFixed(1) + 's;' +
        '--dl:' + (-Math.random() * 24).toFixed(1) + 's;' +
        '--op:' + (0.12 + Math.random() * 0.42).toFixed(2);
      d.appendChild(s);
    }
  });

  // ---------------- 来源弹层 ----------------
  var ov = $('#ov');
  function openOv() {
    $('#ovBody').innerHTML = SOURCES.body;
    ov.classList.add('on');
    ov.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeOv() {
    ov.classList.remove('on');
    ov.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  $('#srcEntry').addEventListener('click', openOv);
  $('#ovClose').addEventListener('click', closeOv);
  ov.addEventListener('click', function (e) {
    if (e.target === ov) closeOv();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ov.classList.contains('on')) closeOv();
  });

  // ---------------- 第一屏：画像热区（自动走位 + 手动点按） ----------------
  var hotzones = $$('#hotzones .hotzone');
  var portraitCopy = $('#portraitCopy');
  var hotKeys = ['young', 'figure', 'gear'];
  var hotIdx = 0;
  var autoTimer = null;
  var autoPlayed = false;

  function setHot(key, auto) {
    hotzones.forEach(function (h) {
      var on = h.dataset.hot === key;
      h.classList.toggle('is-active', on);
      h.classList.toggle('is-auto', on && auto);
      h.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    portraitCopy.classList.add('is-swap');
    setTimeout(function () {
      portraitCopy.innerHTML = '<b>' + HOT_COPY[key] + '</b>';
      portraitCopy.classList.remove('is-swap');
    }, 260);
  }

  function startAutoHot() {
    if (autoPlayed || reduce) return;
    autoPlayed = true;
    setHot('young', true);
    autoTimer = setInterval(function () {
      hotIdx = (hotIdx + 1) % hotKeys.length;
      setHot(hotKeys[hotIdx], true);
    }, 2400);
  }
  function stopAutoHot() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    hotzones.forEach(function (h) { h.classList.remove('is-auto'); });
  }

  hotzones.forEach(function (h) {
    h.addEventListener('click', function (e) {
      e.stopPropagation();
      stopAutoHot();
      setHot(h.dataset.hot, false);
    });
  });

  // ---------------- 第一屏：年龄行军尺 ----------------
  var ageRange = $('#ageRange');
  var ageThumb = $('#ageThumb');
  var ageNum = $('#ageNum');
  var ageRatio = $('#ageRatio');
  var ageRatioFill = $('#ageRatioFill');
  var ageRatioTxt = $('#ageRatioTxt');
  var ageFill = $('#agerulerFill');
  var afigs = $$('.afig');
  var anchorEls = $$('#anchors .anchor');

  anchorEls.forEach(function (a, i) { ANCHORS[i].el = a; });

  function updateAge() {
    var v = parseInt(ageRange.value, 10);
    var pct = (v - 14) / (30 - 14) * 100;
    ageThumb.style.left = pct + '%';
    ageFill.style.width = pct + '%';
    ageNum.textContent = v;
    ageRange.setAttribute('aria-valuetext', v + ' 岁');

    var inZone = v >= 14 && v <= 18;
    if (inZone) {
      ageRatio.hidden = false;
      ageRatioFill.classList.remove('is-filled');
      void ageRatioFill.offsetWidth;
      ageRatioFill.classList.add('is-filled');
      ageRatioTxt.textContent = '14—18 岁战士至少占 40%';
    } else {
      ageRatio.hidden = true;
      ageRatioFill.classList.remove('is-filled');
    }

    var litCount = inZone ? 4 : 0;
    afigs.forEach(function (f, i) {
      f.classList.toggle('lit', i < litCount);
      f.style.transitionDelay = f.classList.contains('lit') ? (i * 60) + 'ms' : '0ms';
    });

    anchorEls.forEach(function (a, i) {
      var an = ANCHORS[i];
      var near = false;
      if (an.lo !== undefined) {
        near = (v >= an.lo && v <= an.hi);
      } else {
        near = Math.abs(v - an.at) <= 1;
      }
      a.classList.toggle('is-near', near);
    });
  }

  ageRange.addEventListener('input', updateAge);
  updateAge();

  // ---------------- 第二屏：擦灰（文案随进度切换 + 模糊递减 + 下滑触发 CTA） ----------------
  var wipeStage = $('#wipeStage');
  var wipeCanvas = $('#wipeCanvas');
  var wipeBase = $('#wipeBase');
  var wipeCaption = $('#wipeCaption');
  var wipeHint = $('#wipeHint');
  var wipeReset = $('#wipeReset');
  var wipeCta = $('#wipeCta');
  var wipeGlow = $('.wipe-glow');
  var wipePct = $('#wipePct');
  var wipeRing = $('#wipeProgressRing');
  var wipeProgress = $('.wipe-progress');
  var nextBtn = $('#nextBtn');
  var handoff = $('#handoff');
  var ctx = wipeCanvas.getContext('2d');
  var drawing = false;
  var lastX = 0, lastY = 0;
  var RING_LEN = 113.1;   // 2*PI*18 ≈ 113.1

  // 擦灰进度分档文案（画框下方，擦一会儿才浮现，随进度缓步展开）
  // 每条文案带「眉题 + 正文」，做成卡片，更醒目
  var CAPTIONS = [
    { kick: '', body: '' },
    { kick: '她们也在队伍里', body: '长征队伍里，有几千名女红军，走了同样的两万五千里。' },
    { kick: '她们大多无名', body: '她们中的许多人，没有留下姓名和照片。' }
  ];
  var THRESHOLDS = [0.26, 0.55];   // 文案切换阈值（2档，间隔拉开）
  var THRESHOLD_DONE = 0.80;       // 擦满阈值（进度环走满）
  var THRESHOLD_RESET = 0.45;      // 出现「重新擦」按钮的阈值
  var THRESHOLD_CTA = 0.18;        // 擦「一会儿」即可弹 CTA 的低阈值
  var captionIdx = 0;              // 当前文案档
  var done = false;
  var ctaShown = false;
  var ctaReady = false;            // 是否已擦到可弹 CTA 的进度
  var scanRaf = null;              // 进度扫描节流
  var lastRatio = -1;              // 上一次进度，避免重复触发

  // 灰尘蒙层（只画灰，底图在 <img> 层，擦除只作用于本层）
  function setupCanvas() {
    var rect = wipeStage.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    wipeCanvas.width = rect.width * dpr;
    wipeCanvas.height = rect.height * dpr;
    wipeCanvas.style.width = rect.width + 'px';
    wipeCanvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var cw = rect.width, ch = rect.height;

    // 灰尘蒙层（覆盖全屏，待擦除）
    ctx.fillStyle = 'rgba(58,50,40,.94)';
    ctx.fillRect(0, 0, cw, ch);
    // 颗粒纹理
    ctx.globalAlpha = 0.14;
    for (var i = 0; i < 500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#c9a86a' : '#8a7a66';
      var x = Math.random() * cw, y = Math.random() * ch;
      var r = 0.5 + Math.random() * 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function eraseAt(x, y) {
    var rect = wipeStage.getBoundingClientRect();
    var cx = x - rect.left, cy = y - rect.top;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // 光晕跟随手指
    if (wipeGlow) {
      wipeGlow.style.setProperty('--gx', (cx / rect.width * 100).toFixed(1) + '%');
      wipeGlow.style.setProperty('--gy', (cy / rect.height * 100).toFixed(1) + '%');
      wipeGlow.classList.add('is-on');
    }
    checkProgress();
  }

  // 更新底图模糊度（随擦除进度递减：14px -> 0）
  function updateBlur(ratio) {
    var blur = Math.max(0, 14 * (1 - ratio / THRESHOLD_DONE));
    wipeBase.style.setProperty('--wipe-blur', blur.toFixed(1) + 'px');
  }

  // 更新进度环（右上角，随擦除进度填充）
  function updateRing(ratio) {
    if (!wipeRing) return;
    var clamped = Math.min(1, ratio / THRESHOLD_DONE);
    wipeRing.style.strokeDashoffset = (RING_LEN * (1 - clamped)).toFixed(1);
    wipePct.textContent = Math.round(clamped * 100);
  }

  function switchCaption(idx) {
    if (idx === captionIdx) return;
    captionIdx = idx;
    var data = CAPTIONS[idx];
    if (!data.body) {
      // 空文案：直接隐藏
      wipeCaption.classList.remove('is-show');
      wipeCaption.classList.add('is-swap');
      setTimeout(function () {
        wipeCaption.innerHTML = '';
        wipeCaption.classList.remove('is-swap');
      }, 400);
      return;
    }
    wipeCaption.classList.add('is-swap');
    setTimeout(function () {
      wipeCaption.innerHTML =
        '<span class="wc-kick">' + data.kick + '</span>' +
        '<span class="wc-body">' + data.body + '</span>';
      wipeCaption.classList.remove('is-swap');
      wipeCaption.classList.add('is-show');
    }, 400);
  }

  function checkProgress() {
    if (done) return;
    // 节流：用 rAF 合并多次擦除的扫描，避免抖动
    if (scanRaf) return;
    scanRaf = requestAnimationFrame(function () {
      scanRaf = null;
      var dpr = window.devicePixelRatio || 1;
      var sampleStep = 7;
      var cleared = 0, checked = 0;
      try {
        var data = ctx.getImageData(0, 0, wipeCanvas.width, wipeCanvas.height).data;
        for (var y = 0; y < wipeCanvas.height; y += sampleStep * dpr) {
          for (var x = 0; x < wipeCanvas.width; x += sampleStep * dpr) {
            var idx = (y * wipeCanvas.width + x) * 4 + 3;
            if (data[idx] < 128) cleared++;
            checked++;
          }
        }
        var ratio = checked > 0 ? cleared / checked : 0;

        // 模糊递减（平滑，不跳变）
        updateBlur(ratio);

        // 进度环更新
        updateRing(ratio);

        // 文案切换（按档位递增）
        var target = 0;
        for (var t = 0; t < THRESHOLDS.length; t++) {
          if (ratio > THRESHOLDS[t]) target = t + 1;
        }
        switchCaption(target);

        // 擦到一半：隐藏提示、显示「重新擦」按钮
        if (ratio > THRESHOLD_RESET) {
          wipeHint.classList.add('is-hidden');
          wipeReset.classList.add('is-show');
        }

        // 擦「一会儿」即标记 CTA 可弹（配合下滑触发，不必擦满）
        if (!ctaReady && ratio > THRESHOLD_CTA) {
          ctaReady = true;
          checkCta();
        }

        // 擦满
        if (ratio > THRESHOLD_DONE) {
          done = true;
          wipeStage.classList.add('is-wiped');
          wipeProgress.classList.add('is-done');
          wipeGlow.classList.remove('is-on');
          showCta();
        }
      } catch (e) { /* ignore */ }
    });
  }

  // 重新擦：重置蒙层、模糊、文案、CTA、按钮状态
  function resetWipe() {
    done = false;
    ctaShown = false;
    ctaReady = false;
    captionIdx = 0;
    wipeStage.classList.remove('is-wiped');
    wipeCta.setAttribute('aria-hidden', 'true');
    nextBtn.setAttribute('tabindex', '-1');
    wipeReset.classList.remove('is-show');
    wipeHint.classList.remove('is-hidden');
    wipeCaption.innerHTML = '';
    wipeCaption.classList.remove('is-show');
    wipeProgress.classList.remove('is-done');
    updateBlur(0);
    updateRing(0);
    setupCanvas();
  }
  wipeReset.addEventListener('click', resetWipe);

  // CTA：擦满即直接显示（兜底）
  function showCta() {
    if (ctaShown) return;
    ctaShown = true;
    wipeCta.setAttribute('aria-hidden', 'false');
    nextBtn.setAttribute('tabindex', '0');
  }

  // CTA 提前触发：擦「一会儿」+ 下滑到 CTA 区域才弹
  function checkCta() {
    if (ctaShown || !ctaReady) return;
    var rect = handoff.getBoundingClientRect();
    var vh = window.innerHeight;
    // 当 CTA 区域滚入视口（底部留一些空间）时显示
    if (rect.top < vh * 0.88) {
      showCta();
    }
  }

  // 监听第二屏屏内滚动，配合擦灰进度触发 CTA
  var p2Stage = $('.p2 .stage');
  if (p2Stage) {
    p2Stage.addEventListener('scroll', function () {
      if (ctaReady) checkCta();
    }, { passive: true });
  }

  function getPos(e) {
    if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function wipeStart(e) {
    drawing = true;
    var p = getPos(e);
    lastX = p.x; lastY = p.y;
    eraseAt(p.x, p.y);
    if (e.cancelable) e.preventDefault();
  }
  function wipeMove(e) {
    if (!drawing) return;
    var p = getPos(e);
    eraseAt(p.x, p.y);
    var dist = Math.hypot(p.x - lastX, p.y - lastY);
    if (dist > 18) {
      var steps = Math.floor(dist / 18);
      for (var i = 1; i <= steps; i++) {
        eraseAt(lastX + (p.x - lastX) * i / steps, lastY + (p.y - lastY) * i / steps);
      }
    }
    lastX = p.x; lastY = p.y;
    if (e.cancelable) e.preventDefault();
  }
  function wipeEnd() {
    drawing = false;
    if (wipeGlow) wipeGlow.classList.remove('is-on');
  }

  wipeCanvas.addEventListener('pointerdown', wipeStart);
  wipeCanvas.addEventListener('pointermove', wipeMove);
  window.addEventListener('pointerup', wipeEnd);
  window.addEventListener('pointercancel', wipeEnd);
  wipeCanvas.addEventListener('touchstart', wipeStart, { passive: false });
  wipeCanvas.addEventListener('touchmove', wipeMove, { passive: false });
  wipeCanvas.addEventListener('touchend', wipeEnd);

  // CTA：在总容器中通知父页面切到下一章；独立打开时直接跳转
  nextBtn.setAttribute('href', '#');
  nextBtn.addEventListener('click', function (e) {
    e.preventDefault();
    var framed = false;
    try { framed = window.parent && window.parent !== window; } catch (err) { framed = false; }
    if (framed) {
      try { window.parent.postMessage({ type: 'chapter-next' }, '*'); return; } catch (err) {}
    }
    window.location.href = '../03-six/index.html';
  });

  // ---------------- 进入动画 + 屏内触发 ----------------
  var io;
  if (typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && en.intersectionRatio > 0.5) {
          en.target.classList.add('in');
          if (en.target.id === 's1') startAutoHot();
        }
      });
    }, { threshold: [0, 0.5, 1], root: deck });
    pages.forEach(function (p) { io.observe(p); });
  } else {
    pages.forEach(function (p) { p.classList.add('in'); });
  }

  if (pages[0]) pages[0].classList.add('in');
  startAutoHot();

  // 初始化擦灰蒙层
  setupCanvas();

  // 窗口尺寸变化时重设 canvas（去抖，仅在未擦时）
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!done) setupCanvas();
    }, 200);
  });

  // 外壳要求：回到本篇第一页
  window.__onReset = function () {
    try { closeOv(); } catch (e) {}
    try { deck.scrollTo({ top: 0, behavior: 'instant' }); } catch (e) { deck.scrollTop = 0; }
    onScroll();
  };

  onScroll();
})();
