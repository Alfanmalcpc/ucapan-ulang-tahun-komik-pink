(() => {
  const canvas = document.getElementById("fxCanvas");
  const ctx = canvas.getContext("2d");
  const burstCanvas = document.getElementById("burstCanvas");
  const bCtx = burstCanvas.getContext("2d");

  const cakeButton = document.getElementById("cakeButton");
  const cakeSvg = document.getElementById("cakeSvg");
  const cakeHint = document.getElementById("cakeHint");
  const wishStatus = document.getElementById("wishStatus");
  const popCountEl = document.getElementById("popCount");
  const burstBtn = document.getElementById("burstBtn");
  const blowBtn = document.getElementById("blowBtn");
  const customizeBtn = document.getElementById("customizeBtn");

  const recipientTag = document.getElementById("recipientTag");
  const heroTitle = document.getElementById("heroTitle");
  const wishText = document.getElementById("wishText");
  const senderName = document.getElementById("senderName");

  const customModal = document.getElementById("customModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const customForm = document.getElementById("customForm");
  const inputTo = document.getElementById("inputTo");
  const inputFrom = document.getElementById("inputFrom");
  const inputMsg = document.getElementById("inputMsg");
  const copyLinkBtn = document.getElementById("copyLinkBtn");
  const copyFeedback = document.getElementById("copyFeedback");

  const PINK_PALETTE = ["#FF3B7F", "#FF5C97", "#FF85B3", "#FFB3CF", "#FFD166", "#FF6B8B"];
  const INK = "#2B0918";

  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  let popCount = 0;
  let candlesBlown = false;

  const balloons = [];
  const hearts = [];
  const bursts = [];
  const shockwaves = [];

  const TAP_WORDS = ["LOVE!", "YAY!", "SWEET!", "HAPPY!", "POW!", "BLING!"];
  let tapWordIdx = 0;

  const DEFAULT_DATA = {
    to: "Kamu yang Spesial",
    from: "Sahabatmu",
    msg: "Hari ini dunia ikut merayakan senyummu. Semoga panjang umur, sehat selalu, rezeki lancar, dan semua hal baik yang kamu semogakan segera berdatangan satu per satu.",
  };

  function resizeCanvas() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    [canvas, burstCanvas].forEach((c) => {
      c.width = Math.floor(vw * dpr);
      c.height = Math.floor(vh * dpr);
      c.style.width = vw + "px";
      c.style.height = vh + "px";
    });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function applyQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const to = (params.get("to") || "").trim();
    const from = (params.get("from") || "").trim();
    const msg = (params.get("msg") || "").trim();

    const finalTo = to || DEFAULT_DATA.to;
    const finalFrom = from || DEFAULT_DATA.from;
    const finalMsg = msg || DEFAULT_DATA.msg;

    recipientTag.textContent = "UNTUK " + finalTo.toUpperCase();
    heroTitle.textContent = to ? "SELAMAT ULANG TAHUN, " + to.toUpperCase() + "!" : "SELAMAT ULANG TAHUN!";
    senderName.textContent = finalFrom.toUpperCase();
    wishText.textContent = finalMsg;

    inputTo.value = to;
    inputFrom.value = from;
    inputMsg.value = msg;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnBalloon(xOverride, yOverride) {
    const isMobile = vw < 600;
    const r = rand(isMobile ? 18 : 24, isMobile ? 26 : 38);
    let xPos;
    if (xOverride !== undefined) {
      xPos = xOverride;
    } else if (isMobile) {
      // On phone, guide balloons to visible side gutters & hero stage edges
      const side = Math.random();
      if (side < 0.45) {
        xPos = rand(r + 6, vw * 0.22);
      } else if (side < 0.9) {
        xPos = rand(vw * 0.78, vw - r - 6);
      } else {
        xPos = rand(vw * 0.3, vw * 0.7);
      }
    } else {
      xPos = rand(r + 14, Math.max(r + 20, vw - r - 14));
    }

    balloons.push({
      x: xPos,
      y: yOverride !== undefined ? yOverride : vh + r + rand(15, 90),
      rx: r,
      ry: r * 1.18,
      vy: rand(1.15, 2.25),
      swayAmp: rand(0.3, 0.8),
      swayFreq: rand(0.015, 0.028),
      phase: rand(0, Math.PI * 2),
      color: PINK_PALETTE[Math.floor(Math.random() * PINK_PALETTE.length)],
      hasHeartMark: Math.random() > 0.4,
    });
  }

  function spawnHeart(x, y, burstMode) {
    hearts.push({
      x: x !== undefined ? x : rand(16, vw - 16),
      y: y !== undefined ? y : vh + rand(10, 60),
      vx: burstMode ? rand(-2.8, 2.8) : rand(-0.45, 0.45),
      vy: burstMode ? rand(-4.6, -1.6) : rand(-1.9, -0.9),
      size: burstMode ? rand(10, 20) : rand(11, 18),
      rot: rand(-0.35, 0.35),
      vrot: rand(-0.025, 0.025),
      alpha: 1,
      decay: burstMode ? rand(0.012, 0.02) : rand(0.0022, 0.0042),
      color: Math.random() > 0.25 ? "#FF3B7F" : "#FF85B3",
    });
  }

  function spawnShockwave(x, y, color) {
    shockwaves.push({
      x,
      y,
      r: 8,
      maxR: 54,
      alpha: 0.95,
      color: color || "#FF3B7F",
    });
  }

  function spawnComicBurst(x, y, color, intensity) {
    const count = intensity || 14;
    spawnShockwave(x, y, color);
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + rand(-0.2, 0.2);
      const spd = rand(2.6, 6.8);
      const kind = i % 3 === 0 ? "star" : i % 3 === 1 ? "ribbon" : "dot";
      bursts.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - rand(0.4, 1.5),
        size: rand(5.5, 11),
        rot: rand(0, Math.PI * 2),
        vrot: rand(-0.18, 0.18),
        alpha: 1,
        color: PINK_PALETTE[i % PINK_PALETTE.length],
        shape: kind,
      });
    }
    const heartTotal = Math.max(4, Math.floor(count / 3));
    for (let j = 0; j < heartTotal; j++) {
      spawnHeart(x, y, true);
    }
  }

  function drawComicStar(targetCtx, cx, cy, outerR, rot, color, alpha) {
    targetCtx.save();
    targetCtx.globalAlpha = alpha;
    targetCtx.translate(cx, cy);
    targetCtx.rotate(rot);
    targetCtx.beginPath();
    const spikes = 4;
    const innerR = outerR * 0.42;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (Math.PI * i) / spikes;
      if (i === 0) targetCtx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else targetCtx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    targetCtx.closePath();
    targetCtx.fillStyle = color;
    targetCtx.fill();
    targetCtx.lineWidth = 1.8;
    targetCtx.strokeStyle = INK;
    targetCtx.stroke();
    targetCtx.restore();
  }

  function showCallout(x, y, text) {
    const el = document.createElement("div");
    el.className = "comic-pop-callout";
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 660);
  }

  function drawComicHeart(targetCtx, cx, cy, size, rot, color, alpha) {
    targetCtx.save();
    targetCtx.globalAlpha = alpha;
    targetCtx.translate(cx, cy);
    targetCtx.rotate(rot);
    const s = size / 16;
    targetCtx.scale(s, s);

    targetCtx.beginPath();
    targetCtx.moveTo(0, 12);
    targetCtx.bezierCurveTo(-16, 2, -16, -12, -7, -12);
    targetCtx.bezierCurveTo(-2, -12, 0, -8, 0, -6);
    targetCtx.bezierCurveTo(0, -8, 2, -12, 7, -12);
    targetCtx.bezierCurveTo(16, -12, 16, 2, 0, 12);
    targetCtx.closePath();

    targetCtx.fillStyle = color;
    targetCtx.fill();
    targetCtx.lineWidth = 2.4;
    targetCtx.strokeStyle = INK;
    targetCtx.lineJoin = "round";
    targetCtx.stroke();

    // Specular ink shine
    targetCtx.beginPath();
    targetCtx.arc(-6.5, -5.5, 2.2, Math.PI, Math.PI * 1.65);
    targetCtx.strokeStyle = "#FFF5F8";
    targetCtx.lineWidth = 2;
    targetCtx.lineCap = "round";
    targetCtx.stroke();

    targetCtx.restore();
  }

  function drawComicBalloon(b) {
    ctx.save();
    ctx.translate(b.x, b.y);

    // Wavy comic string
    ctx.beginPath();
    ctx.moveTo(0, b.ry + 4);
    ctx.quadraticCurveTo(Math.sin(b.phase) * 9, b.ry + 22, -Math.cos(b.phase) * 6, b.ry + 44);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.stroke();

    // Balloon knot
    ctx.beginPath();
    ctx.moveTo(0, b.ry - 1);
    ctx.lineTo(-5, b.ry + 6);
    ctx.lineTo(5, b.ry + 6);
    ctx.closePath();
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = INK;
    ctx.stroke();

    // Balloon body
    ctx.beginPath();
    ctx.ellipse(0, 0, b.rx, b.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();

    // Comic glossy highlight arc
    ctx.beginPath();
    ctx.ellipse(-b.rx * 0.34, -b.ry * 0.32, b.rx * 0.16, b.ry * 0.28, -0.45, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 245, 248, 0.85)";
    ctx.fill();

    // Optional mini heart print on balloon
    if (b.hasHeartMark) {
      drawComicHeart(ctx, 0, 4, b.rx * 0.36, 0, "#FFF5F8", 0.92);
    }

    ctx.restore();
  }

  function stepAnimation() {
    ctx.clearRect(0, 0, vw, vh);
    bCtx.clearRect(0, 0, vw, vh);

    // Maintain ambient balloons & hearts gently for smooth mobile battery
    const maxBalloons = vw < 600 ? 10 : 16;
    if (balloons.length < maxBalloons && Math.random() < 0.05) {
      spawnBalloon();
    }
    if (hearts.length < 12 && Math.random() < 0.045) {
      spawnHeart();
    }

    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      b.phase += b.swayFreq;
      b.y -= b.vy;
      b.x += Math.sin(b.phase) * b.swayAmp;
      drawComicBalloon(b);
      if (b.y < -b.ry - 60) {
        balloons.splice(i, 1);
      }
    }

    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      h.x += h.vx;
      h.y += h.vy;
      h.rot += h.vrot;
      h.alpha -= h.decay;
      if (h.alpha <= 0 || h.y < -40) {
        hearts.splice(i, 1);
        continue;
      }
      const targetCanvasCtx = h.decay > 0.01 ? bCtx : ctx;
      drawComicHeart(targetCanvasCtx, h.x, h.y, h.size, h.rot, h.color, h.alpha);
    }

    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.r += (sw.maxR - sw.r) * 0.22;
      sw.alpha -= 0.05;
      if (sw.alpha <= 0) {
        shockwaves.splice(i, 1);
        continue;
      }
      bCtx.save();
      bCtx.globalAlpha = sw.alpha;
      bCtx.beginPath();
      bCtx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      bCtx.strokeStyle = INK;
      bCtx.lineWidth = 4;
      bCtx.stroke();

      bCtx.beginPath();
      bCtx.arc(sw.x, sw.y, Math.max(2, sw.r - 5), 0, Math.PI * 2);
      bCtx.strokeStyle = sw.color;
      bCtx.lineWidth = 2.5;
      bCtx.stroke();
      bCtx.restore();
    }

    for (let i = bursts.length - 1; i >= 0; i--) {
      const p = bursts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.14;
      p.rot += p.vrot || 0;
      p.alpha -= 0.024;
      if (p.alpha <= 0) {
        bursts.splice(i, 1);
        continue;
      }
      if (p.shape === "star") {
        drawComicStar(bCtx, p.x, p.y, p.size * 0.85, p.rot, p.color, p.alpha);
      } else if (p.shape === "ribbon") {
        bCtx.save();
        bCtx.globalAlpha = p.alpha;
        bCtx.translate(p.x, p.y);
        bCtx.rotate(p.rot);
        bCtx.fillStyle = p.color;
        bCtx.strokeStyle = INK;
        bCtx.lineWidth = 1.8;
        bCtx.fillRect(-p.size * 0.65, -p.size * 0.25, p.size * 1.3, p.size * 0.5);
        bCtx.strokeRect(-p.size * 0.65, -p.size * 0.25, p.size * 1.3, p.size * 0.5);
        bCtx.restore();
      } else {
        bCtx.save();
        bCtx.globalAlpha = p.alpha;
        bCtx.fillStyle = p.color;
        bCtx.strokeStyle = INK;
        bCtx.lineWidth = 2;
        bCtx.beginPath();
        bCtx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        bCtx.fill();
        bCtx.stroke();
        bCtx.restore();
      }
    }

    requestAnimationFrame(stepAnimation);
  }

  function launchCelebrationWave(countBalloons, countHearts) {
    for (let i = 0; i < countBalloons; i++) {
      spawnBalloon(rand(28, vw - 28), vh + rand(10, 180));
    }
    for (let j = 0; j < countHearts; j++) {
      spawnHeart(rand(vw * 0.15, vw * 0.85), rand(vh * 0.45, vh * 0.85), true);
    }
  }

  function triggerAnimClass(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms || 500);
  }

  function toggleBlowCandles() {
    candlesBlown = !candlesBlown;
    triggerAnimClass(cakeButton, "cake-bounce", 480);
    const rect = cakeButton.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.35;

    if (candlesBlown) {
      cakeSvg.classList.add("cake-blown");
      cakeHint.textContent = "YEAY! KETUK LAGI UNTUK NYALAKAN LILIN";
      wishStatus.textContent = "HARAPAN TERKIRIM!";
      blowBtn.textContent = "NYALAKAN LILIN LAGI";
      spawnComicBurst(cx, cy, "#FFD166", 20);
      showCallout(cx, cy - 18, "WUSH! WISH GRANTED!");
      launchCelebrationWave(7, 16);
    } else {
      cakeSvg.classList.remove("cake-blown");
      cakeHint.textContent = "KETUK KUE UNTUK TIUP LILIN";
      wishStatus.textContent = "LILIN MENYALA";
      blowBtn.textContent = "TIUP LILIN SEKARANG";
      spawnComicBurst(cx, cy, "#FF5C97", 12);
      showCallout(cx, cy - 18, "LILIN MENYALA!");
    }
  }

  function handlePointerTap(clientX, clientY, target) {
    // Check if user tapped an airborne balloon first
    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      const dx = (clientX - b.x) / (b.rx * 1.25);
      const dy = (clientY - b.y) / (b.ry * 1.25);
      if (dx * dx + dy * dy <= 1) {
        balloons.splice(i, 1);
        popCount += 1;
        popCountEl.textContent = String(popCount);
        spawnComicBurst(b.x, b.y, b.color, 18);
        const words = ["POP!", "DUAR!", "LOVE!", "YAY!"];
        showCallout(b.x, b.y, words[popCount % words.length]);
        return;
      }
    }

    if (target && target.closest && target.closest(".comic-modal")) return;

    // Rich comic click animation anywhere on screen
    spawnComicBurst(clientX, clientY, "#FF3B7F", 10);
    const isInteractive = target && target.closest && target.closest("button, .speech-bubble, .mini-card, .ink-balloon, .ink-heart, .burst-badge, .issue-stamp");
    if (!isInteractive) {
      const word = TAP_WORDS[tapWordIdx % TAP_WORDS.length];
      tapWordIdx += 1;
      showCallout(clientX, clientY - 12, word);
    }
  }

  document.addEventListener("pointerdown", (ev) => {
    handlePointerTap(ev.clientX, ev.clientY, ev.target);
  });

  // Interactive element-specific comic animations
  document.querySelectorAll(".ink-balloon").forEach((el) => {
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      triggerAnimClass(el, "balloon-pop", 460);
      popCount += 1;
      popCountEl.textContent = String(popCount);
      const r = el.getBoundingClientRect();
      spawnComicBurst(r.left + r.width / 2, r.top + r.height / 3, "#FF4D8D", 16);
      showCallout(r.left + r.width / 2, r.top, "POP! +1");
    });
  });

  document.querySelectorAll(".ink-heart").forEach((el) => {
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      triggerAnimClass(el, "balloon-pop", 460);
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      spawnComicBurst(cx, cy, "#FF3B7F", 14);
      for (let i = 0; i < 8; i++) spawnHeart(cx, cy, true);
      showCallout(cx, cy - 10, "LOVE!");
    });
  });

  const speechBubble = document.querySelector(".speech-bubble");
  if (speechBubble) {
    speechBubble.addEventListener("click", (ev) => {
      ev.stopPropagation();
      triggerAnimClass(speechBubble, "bubble-pop", 430);
      const r = speechBubble.getBoundingClientRect();
      spawnComicBurst(r.left + r.width / 2, r.top + 20, "#FF85B3", 14);
      for (let i = 0; i < 8; i++) {
        spawnHeart(rand(r.left + 20, r.right - 20), r.top + 16, true);
      }
      showCallout(r.left + r.width / 2, r.top, "AMIN!");
    });
  }

  document.querySelectorAll(".mini-card").forEach((card, idx) => {
    card.addEventListener("click", (ev) => {
      ev.stopPropagation();
      triggerAnimClass(card, "card-pop", 430);
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      spawnComicBurst(cx, cy, "#FFD166", 14);
      if (idx === 0) {
        for (let i = 0; i < 5; i++) spawnBalloon(rand(30, vw - 30), vh + i * 25);
        showCallout(cx, r.top, "BALON MELUNCUR!");
      } else {
        for (let i = 0; i < 12; i++) spawnHeart(cx + rand(-30, 30), cy, true);
        showCallout(cx, r.top, "HUJAN LOVE!");
      }
    });
  });

  const burstBadge = document.querySelector(".burst-badge");
  if (burstBadge) {
    burstBadge.addEventListener("click", (ev) => {
      ev.stopPropagation();
      triggerAnimClass(burstBadge, "spin-pop", 560);
      const r = burstBadge.getBoundingClientRect();
      spawnComicBurst(r.left + r.width / 2, r.top + r.height / 2, "#FFD166", 18);
      launchCelebrationWave(4, 10);
      showCallout(r.left + r.width / 2, r.bottom + 8, "HAPPY BIRTHDAY!");
    });
  }

  const issueStamp = document.querySelector(".issue-stamp");
  if (issueStamp) {
    issueStamp.addEventListener("click", (ev) => {
      ev.stopPropagation();
      triggerAnimClass(issueStamp, "stamp-slam", 360);
      const r = issueStamp.getBoundingClientRect();
      spawnComicBurst(r.left + r.width / 2, r.top + r.height / 2, "#FF5C97", 12);
      showCallout(r.left + r.width / 2, r.bottom + 12, "SPESIAL!");
    });
  }

  cakeButton.addEventListener("click", (ev) => {
    ev.stopPropagation();
    toggleBlowCandles();
  });

  blowBtn.addEventListener("click", () => {
    toggleBlowCandles();
  });

  burstBtn.addEventListener("click", () => {
    launchCelebrationWave(8, 20);
    const rect = burstBtn.getBoundingClientRect();
    showCallout(rect.left + rect.width / 2, rect.top, "BALON & LOVE TERBANG!");
  });

  customizeBtn.addEventListener("click", () => {
    copyFeedback.textContent = "";
    customModal.hidden = false;
  });

  closeModalBtn.addEventListener("click", () => {
    customModal.hidden = true;
  });

  customModal.addEventListener("click", (ev) => {
    if (ev.target === customModal) {
      customModal.hidden = true;
    }
  });

  function buildShareUrl() {
    const url = new URL(window.location.href.split("?")[0]);
    const to = inputTo.value.trim();
    const from = inputFrom.value.trim();
    const msg = inputMsg.value.trim();
    if (to) url.searchParams.set("to", to);
    if (from) url.searchParams.set("from", from);
    if (msg) url.searchParams.set("msg", msg);
    return url.toString();
  }

  customForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const nextUrl = buildShareUrl();
    window.history.replaceState({}, "", nextUrl);
    applyQueryParams();
    customModal.hidden = true;
    launchCelebrationWave(5, 12);
  });

  copyLinkBtn.addEventListener("click", async () => {
    const shareUrl = buildShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      copyFeedback.textContent = "Link kado komik berhasil disalin!";
    } catch {
      copyFeedback.textContent = shareUrl;
    }
  });

  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  applyQueryParams();
  launchCelebrationWave(6, 10);
  requestAnimationFrame(stepAnimation);
})();
