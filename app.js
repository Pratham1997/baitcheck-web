(function () {
  const cfg = window.LEDGERZERO_CONFIG || window.BAITCHECK_CONFIG || { resources: [] };
  const episodes = window.BAITCHECK_EPISODES || [];

  const brandEl = document.getElementById('brand-name');
  if (brandEl && cfg.brandName) brandEl.textContent = cfg.brandName.toUpperCase();

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =========================================================================
  // 1. Interactive $100 Bill Stack Calculator (Official US BEP Note Specs)
  // =========================================================================
  const BILL_THICKNESS_M = 0.00010922; // 0.0043 in = 0.10922 mm
  const BILL_WEIGHT_G = 1.0; // 1 gram per Federal Reserve note

  function parseUsdAmount(raw) {
    const clean = String(raw || '')
      .trim()
      .replace(/[$,_\s]/g, '')
      .toUpperCase();
    if (!clean) return null;
    const match = clean.match(/^(\d+(?:\.\d+)?)(K|M|B|T)?$/);
    if (!match) return null;
    const num = parseFloat(match[1]);
    const mult =
      match[2] === 'K'
        ? 1e3
        : match[2] === 'M'
          ? 1e6
          : match[2] === 'B'
            ? 1e9
            : match[2] === 'T'
              ? 1e12
              : 1;
    const val = num * mult;
    return Number.isFinite(val) && val > 0 ? val : null;
  }

  function formatUsdShort(val) {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(val % 1e12 === 0 ? 0 : 2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(val % 1e9 === 0 ? 0 : 2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(val % 1e6 === 0 ? 0 : 2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(val % 1e3 === 0 ? 0 : 1)}K`;
    return `$${Math.round(val).toLocaleString('en-US')}`;
  }

  function calculateMoneyStack(usd) {
    const bills = usd / 100;
    const heightM = bills * BILL_THICKNESS_M;
    const weightKg = (bills * BILL_WEIGHT_G) / 1000;

    let heightDisplay;
    let heightSub;
    if (heightM < 1) {
      heightDisplay = `${(heightM * 100).toFixed(1)} cm`;
      heightSub = `${(heightM * 1000).toFixed(1)} millimeters`;
    } else if (heightM < 1000) {
      heightDisplay = `${heightM.toFixed(heightM < 10 ? 2 : 1)} m`;
      heightSub = `${(heightM * 3.28084).toFixed(1)} feet tall`;
    } else {
      const km = heightM / 1000;
      heightDisplay = `${km >= 100 ? Math.round(km).toLocaleString('en-US') : km.toFixed(2)} km`;
      heightSub = `${Math.round(heightM).toLocaleString('en-US')} meters (${(km * 0.621371).toFixed(km >= 100 ? 0 : 1)} miles)`;
    }

    let landmark;
    let landmarkSub;
    let tier;
    if (heightM < 1.8) {
      landmark = `${(heightM / 1.0922).toFixed(2)}× Waist-High`;
      landmarkSub = 'Fits right inside a single bank vault corner';
      tier = 'GROUND LEVEL';
    } else if (heightM < 330) {
      landmark = `${(heightM / 3.3).toFixed(0)}-Story Building`;
      landmarkSub = `${((heightM / 330) * 100).toFixed(0)}% the height of the Eiffel Tower`;
      tier = 'SKYSCRAPER SCALE';
    } else if (heightM < 828) {
      landmark = `${(heightM / 330).toFixed(2)}× Eiffel Tower`;
      landmarkSub = `Higher than Paris's Eiffel Tower (330m)`;
      tier = 'PAST EIFFEL TOWER';
    } else if (heightM < 8849) {
      landmark = `${(heightM / 828).toFixed(2)}× Burj Khalifa`;
      landmarkSub = `Towers past the world's tallest skyscraper (828m)`;
      tier = 'PAST BURJ KHALIFA';
    } else if (heightM < 100000) {
      landmark = `${(heightM / 8849).toFixed(2)}× Mt. Everest`;
      landmarkSub = `Pierces past Mount Everest (8.8km) & commercial jets (11km)`;
      tier = 'STRATOSPHERE BREACH';
    } else if (heightM < 384400000) {
      const issX = heightM / 408000;
      if (heightM < 408000) {
        landmark = `${((heightM / 100000)).toFixed(1)}× Edge of Space`;
        landmarkSub = `Past the Kármán Line (100 km) into outer space`;
        tier = 'OUTER SPACE';
      } else {
        landmark = `${issX >= 10 ? Math.round(issX).toLocaleString('en-US') : issX.toFixed(1)}× Space Station`;
        landmarkSub = `Reaches ${((heightM / 384400000) * 100).toFixed(heightM > 3844000 ? 1 : 3)}% of the way to the Moon!`;
        tier = 'DEEP SPACE ORBIT';
      }
    } else {
      landmark = `${(heightM / 384400000).toFixed(2)}× to the Moon`;
      landmarkSub = `Reaches past the Moon (384,400 km) in solid $100 bills!`;
      tier = 'LUNAR SCALE';
    }

    let weightDisplay;
    if (weightKg < 1000) {
      weightDisplay = `${weightKg < 10 ? weightKg.toFixed(2) : Math.round(weightKg).toLocaleString('en-US')} kg`;
    } else {
      const tons = weightKg / 1000;
      weightDisplay = `${tons >= 100 ? Math.round(tons).toLocaleString('en-US') : tons.toFixed(1)} metric tons`;
    }

    // Log scale bar fill between 0.05m (log10=-1.3) and Moon 3.84e8m (log10=8.58)
    const logVal = Math.log10(Math.max(0.05, heightM));
    const pct = Math.max(4, Math.min(100, ((logVal - -1.3) / (8.58 - -1.3)) * 100));

    return {
      usd,
      usdShort: formatUsdShort(usd),
      bills: Math.round(bills),
      heightM,
      heightDisplay,
      heightSub,
      landmark,
      landmarkSub,
      weightDisplay,
      tier,
      pct,
    };
  }

  window.LEDGERZERO_CALC_STACK = calculateMoneyStack;

  const calcForm = document.getElementById('calc-form');
  const calcInput = document.getElementById('calc-input');
  let lastCalc = null;

  function renderStackCalc(raw) {
    const usd = parseUsdAmount(raw);
    if (!usd) return;
    const res = calculateMoneyStack(usd);
    lastCalc = res;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('calc-height', res.heightDisplay);
    set('calc-height-sub', res.heightSub);
    set('calc-landmark', res.landmark);
    set('calc-landmark-sub', res.landmarkSub);
    set('calc-weight', res.weightDisplay);
    set('calc-weight-sub', `${res.bills.toLocaleString('en-US')} crisp $100 bills`);
    set('calc-tier-pill', res.tier);
    const bar = document.getElementById('calc-bar-fill');
    if (bar) bar.style.width = `${res.pct.toFixed(1)}%`;
  }

  if (calcForm && calcInput) {
    calcForm.addEventListener('submit', (e) => {
      e.preventDefault();
      renderStackCalc(calcInput.value);
    });
    document.querySelectorAll('.calc-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        const amt = btn.getAttribute('data-amount') || '1000000000';
        calcInput.value = amt;
        renderStackCalc(amt);
      });
    });

    const params = new URLSearchParams(window.location.search);
    const qAmt = params.get('amount');
    if (qAmt && parseUsdAmount(qAmt)) {
      calcInput.value = qAmt;
      renderStackCalc(qAmt);
    } else {
      renderStackCalc(calcInput.value);
    }
  }

  const shareCalcBtn = document.getElementById('share-calc-btn');
  const shareCalcMsg = document.getElementById('share-calc-msg');
  if (shareCalcBtn) {
    shareCalcBtn.addEventListener('click', async () => {
      if (!lastCalc) return;
      const shareUrl = `${window.location.origin}${window.location.pathname}?amount=${encodeURIComponent(lastCalc.usd)}#calculator`;
      const text = `${lastCalc.usdShort} stacked in $100 bills is ${lastCalc.heightDisplay} tall (${lastCalc.landmark})! Test your own number on LedgerZero:`;
      if (navigator.share) {
        try {
          await navigator.share({ title: 'LedgerZero Money Stack Calculator', text, url: shareUrl });
          return;
        } catch {}
      }
      try {
        await navigator.clipboard.writeText(`${text} ${shareUrl}`);
        if (shareCalcMsg) shareCalcMsg.textContent = 'Copied share link with your exact stack calculation!';
      } catch {
        if (shareCalcMsg) shareCalcMsg.textContent = `${text} ${shareUrl}`;
      }
    });
  }

  // =========================================================================
  // 2. Playable 5-Second "$850M Typo Challenge" Mini-Game
  // =========================================================================
  const GAME_ROUNDS = [
    {
      badge: 'ROUND 1 / 3 • FEB 2016 BANGLADESH BANK',
      route: 'NY FED → DEUTSCHE BANK → SRI LANKA',
      amount: '$20,000,000',
      text: 'SHALIKA FANDATION • COLOMBO',
      meta: 'Note: 4 prior wires ($81M) cleared 12 minutes ago. Confirmation printer is offline.',
      shouldFreeze: true,
      explain:
        'REAL HEIST CATCH! Hackers misspelled "FOUNDATION" as "FANDATION". One Deutsche Bank analyst caught that single "A" and froze $850M+ in pending transfers.',
    },
    {
      badge: 'ROUND 2 / 3 • REAL 2013–2015 TECH INVOICE HEIST',
      route: 'GOOGLE / FACEBOOK AP → QUANTA COMPUTER INC',
      amount: '$23,000,000',
      text: 'BENEFICIARY BANK: LITHUANIA (LT89) • SUPPLIER HQ: TAIWAN',
      meta: 'Invoice matches real hardware supplier name, but bank country silently switched to Lithuania.',
      shouldFreeze: true,
      explain:
        'REAL $121M SCAM! Evaldas Rimasauskas registered a fake "Quanta Computer" in Latvia/Lithuania and sent lookalike invoices to Google and Facebook—collecting $121M before getting caught.',
    },
    {
      badge: 'ROUND 3 / 3 • ROUTINE TREASURY SETTLEMENT',
      route: 'TREASURY DESK → FEDERAL RESERVE BANK OF NY',
      amount: '$15,000,000',
      text: 'SHALIKA FOUNDATION • VERIFIED BIC: DEUTDEFF',
      meta: 'Dual-signed SWIFT key, exact verified beneficiary spelling, and matching callback log.',
      shouldFreeze: false,
      explain:
        'CLEAN WIRE! Exact spelling ("FOUNDATION"), verified BIC routing, and valid dual-signature confirmation. Good analysts avoid false alarms too!',
    },
  ];

  let roundIdx = 0;
  let score = 0;
  let roundLocked = false;
  let timerId = null;
  let timeLeftMs = 5000;

  const gBadge = document.getElementById('game-round-label');
  const gTimer = document.getElementById('game-timer');
  const gRoute = document.getElementById('game-wire-route');
  const gAmt = document.getElementById('game-wire-amount');
  const gText = document.getElementById('game-wire-text');
  const gMeta = document.getElementById('game-wire-meta');
  const gFb = document.getElementById('game-feedback');
  const gNext = document.getElementById('game-next-btn');
  const gRestart = document.getElementById('game-restart-btn');
  const gShare = document.getElementById('game-share-btn');
  const gShareMsg = document.getElementById('game-share-msg');
  const gFreezeBtn = document.getElementById('game-btn-freeze');
  const gApproveBtn = document.getElementById('game-btn-approve');

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function loadRound(idx) {
    stopTimer();
    roundIdx = idx;
    roundLocked = false;
    timeLeftMs = 5000;
    const r = GAME_ROUNDS[idx];
    if (!r || !gBadge) return;

    gBadge.textContent = r.badge;
    gRoute.textContent = r.route;
    gAmt.textContent = r.amount;
    gText.textContent = r.text;
    gMeta.textContent = r.meta;
    gTimer.textContent = '5.0s';
    gTimer.style.color = '#facc15';
    gFb.classList.remove('visible');
    gFb.innerHTML = '';
    gNext.style.display = 'none';
    gRestart.style.display = 'none';
    gShare.style.display = 'none';
    if (gShareMsg) gShareMsg.textContent = '';

    // Start countdown once user interacts or scrolls to game; run softly on rounds 2+
    if (idx > 0) startCountdown();
  }

  function startCountdown() {
    stopTimer();
    timerId = setInterval(() => {
      timeLeftMs = Math.max(0, timeLeftMs - 100);
      if (gTimer) {
        gTimer.textContent = `${(timeLeftMs / 1000).toFixed(1)}s`;
        if (timeLeftMs <= 1800) gTimer.style.color = '#ff3b5c';
      }
      if (timeLeftMs <= 0) {
        resolveRound(null);
      }
    }, 100);
  }

  function resolveRound(choseFreeze) {
    if (roundLocked) return;
    roundLocked = true;
    stopTimer();
    const r = GAME_ROUNDS[roundIdx];
    const timedOut = choseFreeze === null;
    const correct = !timedOut && choseFreeze === r.shouldFreeze;
    if (correct) score++;

    const isLast = roundIdx === GAME_ROUNDS.length - 1;
    gFb.classList.add('visible');
    gFb.innerHTML = `
      <div style="font-weight:900;font-size:16px;color:${correct ? '#6ee7b7' : '#ff7c92'};margin-bottom:8px;">
        ${
          timedOut
            ? '⏱️ TIME UP — Wire slipped through!'
            : correct
              ? '✅ SHARP EYE! Correct call.'
              : '❌ MISSED IT! That call cost the bank.'
        }
      </div>
      <div style="color:#e2e8f0;font-size:14px;line-height:1.5;">${escapeHtml(r.explain)}</div>
      ${
        isLast
          ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(148,163,184,0.2);font-weight:900;color:#facc15;">
              FINAL COMPLIANCE SCORE: ${score} / ${GAME_ROUNDS.length} ${score === 3 ? '— YOU SAVED $850M+!' : score === 2 ? '— SOLID ANALYST!' : '— HACKERS DRAINED THE VAULT!'}
            </div>`
          : ''
      }
    `;

    if (!isLast) {
      gNext.style.display = 'inline-flex';
    } else {
      gRestart.style.display = 'inline-flex';
      gShare.style.display = 'inline-flex';
    }
  }

  if (gFreezeBtn && gApproveBtn) {
    gFreezeBtn.addEventListener('click', () => resolveRound(true));
    gApproveBtn.addEventListener('click', () => resolveRound(false));
    gNext.addEventListener('click', () => loadRound(roundIdx + 1));
    gRestart.addEventListener('click', () => {
      score = 0;
      loadRound(0);
      startCountdown();
    });
    gShare.addEventListener('click', async () => {
      const url = `${window.location.origin}${window.location.pathname}#typo-game`;
      const text = `I scored ${score}/${GAME_ROUNDS.length} on the LedgerZero 5-Second $850M Bank Heist Typo Challenge! Think you'd spot the typo in time?`;
      if (navigator.share) {
        try {
          await navigator.share({ title: 'LedgerZero $850M Typo Challenge', text, url });
          return;
        } catch {}
      }
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        if (gShareMsg) gShareMsg.textContent = 'Score copied! Paste it into your group chat.';
      } catch {
        if (gShareMsg) gShareMsg.textContent = `${text} ${url}`;
      }
    });
    loadRound(0);
  }

  // =========================================================================
  // 3. Bonus Client-Side Phishing URL Inspector (Preserved 100%)
  // =========================================================================
  const SHORTENERS = new Set([
    'bit.ly', 'tinyurl.com', 't.co', 'rb.gy', 'cutt.ly', 'is.gd', 'ow.ly', 'shorturl.at', 'tiny.cc', 'rebrand.ly',
  ]);
  const FREE_HOSTING_DOMAINS = new Set([
    'netlify.app', 'vercel.app', 'blogspot.com', 'pages.dev', 'web.app', 'firebaseapp.com', 'github.io', 'weebly.com', 'wixsite.com',
  ]);
  const RISKY_TLDS = new Set([
    'xyz', 'top', 'click', 'loan', 'gq', 'tk', 'ml', 'cf', 'work', 'buzz', 'vip', 'shop', 'icu', 'info', 'cfd', 'sbs',
  ]);
  const BRAND_OFFICIAL_DOMAINS = {
    usps: ['usps.com'],
    fedex: ['fedex.com'],
    dhl: ['dhl.com'],
    ups: ['ups.com'],
    paypal: ['paypal.com'],
    apple: ['apple.com', 'icloud.com'],
    icloud: ['icloud.com', 'apple.com'],
    google: ['google.com', 'gmail.com', 'youtube.com'],
    amazon: ['amazon.com', 'amazon.in', 'amazon.co.uk', 'amazon.ca', 'amazon.de', 'amazon.com.au', 'amzn.to'],
    microsoft: ['microsoft.com', 'live.com', 'outlook.com', 'office.com'],
    netflix: ['netflix.com'],
    chase: ['chase.com'],
    bankofamerica: ['bankofamerica.com'],
    wellsfargo: ['wellsfargo.com'],
    coinbase: ['coinbase.com'],
    ezpass: ['ezpassny.com', 'e-zpassny.com', 'ezpassnj.com', 'ezpasspa.com', 'ezpassva.com'],
    irs: ['irs.gov'],
    sbi: ['sbi.co.in', 'onlinesbi.sbi'],
    hdfc: ['hdfcbank.com'],
    icici: ['icicibank.com'],
    paytm: ['paytm.com'],
  };
  const BAIT_DOMAIN_WORDS = [
    'official', 'delivery', 'redelivery', 'parcel', 'tracking', 'track', 'verify', 'secure',
    'support', 'billing', 'refund', 'toll', 'unpaid', 'alert', 'signin', 'login', 'account',
    'update', 'claim', 'hold', 'fee', 'confirm', 'pay', 'invoice', 'helpdesk',
  ];
  const TWO_PART_TLDS = new Set([
    'co.uk', 'org.uk', 'gov.uk', 'co.in', 'gov.in', 'nic.in', 'ac.in', 'com.au', 'co.jp', 'com.sg',
  ]);

  function getRootDomain(host) {
    const parts = host.toLowerCase().split('.').filter(Boolean);
    if (parts.length <= 2) return host.toLowerCase();
    const last2 = parts.slice(-2).join('.');
    if (TWO_PART_TLDS.has(last2) && parts.length >= 3) return parts.slice(-3).join('.');
    return last2;
  }

  function getRootLabel(rootDomain) {
    const parts = rootDomain.split('.');
    if (parts.length >= 3 && TWO_PART_TLDS.has(parts.slice(-2).join('.'))) return parts.slice(0, -2).join('.');
    return parts.slice(0, -1).join('.');
  }

  function matchesBrandInLabel(label, brand) {
    if (!label.includes(brand)) return false;
    if (brand.length <= 3) {
      const boundaryRe = new RegExp(`(^|[-_0-9])${brand}($|[-_0-9])`);
      if (boundaryRe.test(label)) return true;
      return BAIT_DOMAIN_WORDS.some((w) => label.includes(`${brand}${w}`) || label.includes(`${w}${brand}`));
    }
    return true;
  }

  function analyzeUrl(raw) {
    const trimmed = raw.trim().replace(/\[\.\]/g, '.').replace(/^hxxps?:\/\//i, (m) => m.replace(/^hxxp/i, 'http'));
    if (!trimmed) return null;
    const hasExplicitScheme = /^https?:\/\//i.test(trimmed);
    const normalized = hasExplicitScheme ? trimmed : `https://${trimmed}`;
    let parsed;
    try {
      parsed = new URL(normalized);
    } catch {
      return { error: 'That does not look like a valid URL. Include a domain like example.com.' };
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return { error: 'Please enter a full domain name (for example: uspsofficialdelivery[.]com).' };
    }

    const host = parsed.hostname.toLowerCase();
    const rootDomain = getRootDomain(host);
    const rootLabel = getRootLabel(rootDomain);
    const subdomain = host === rootDomain ? '(none)' : host.slice(0, -(rootDomain.length + 1));
    const tld = host.split('.').pop() || '';
    const flags = [];
    let score = 0;

    if (hasExplicitScheme && parsed.protocol !== 'https:') {
      score += 25;
      flags.push('Unencrypted HTTP link — legitimate payment and login pages use HTTPS.');
    }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      score += 50;
      flags.push('Raw IP address instead of a registered domain — strong phishing indicator.');
    }
    if (host.includes('xn--')) {
      score += 50;
      flags.push('Punycode / internationalized lookalike characters detected.');
    }
    if (SHORTENERS.has(rootDomain)) {
      score += 35;
      flags.push(`URL shortener (${rootDomain}) hides the true destination.`);
    }
    if (FREE_HOSTING_DOMAINS.has(rootDomain) && subdomain !== '(none)') {
      score += 25;
      flags.push(`Free hosting subdomain on "${rootDomain}" — banks and big tech never host login alerts here.`);
    }
    if (RISKY_TLDS.has(tld)) {
      score += 25;
      flags.push(`High-abuse top-level domain (.${tld}) frequently used in throwaway campaigns.`);
    }
    if (raw.includes('@')) {
      score += 45;
      flags.push('Contains "@" symbol used to mask the real host.');
    }
    if ((rootLabel.match(/-/g) || []).length >= 2) {
      score += 25;
      flags.push(`Multi-hyphen root domain ("${rootDomain}") — heavily used in phishing clones.`);
    }

    let brandImpersonated = null;
    for (const [brand, officialList] of Object.entries(BRAND_OFFICIAL_DOMAINS)) {
      if (officialList.includes(rootDomain)) continue;
      if (subdomain !== '(none)' && matchesBrandInLabel(subdomain, brand)) {
        score += 55;
        brandImpersonated = brand;
        flags.push(`Subdomain spoofing: mentions "${brand.toUpperCase()}" on the left, but the true owner is "${rootDomain}" (official: ${officialList[0]}).`);
        break;
      }
      if (matchesBrandInLabel(rootLabel, brand)) {
        score += 55;
        brandImpersonated = brand;
        flags.push(`Brand lookalike root domain: "${rootDomain}" embeds "${brand.toUpperCase()}" inside an unofficial domain (official: ${officialList[0]}).`);
        break;
      }
    }

    const isAnyOfficial = Object.values(BRAND_OFFICIAL_DOMAINS).some((list) => list.includes(rootDomain));
    if (!isAnyOfficial) {
      const hitDomainBait = BAIT_DOMAIN_WORDS.filter((w) => rootLabel.includes(w));
      if (hitDomainBait.length >= 2) {
        score += 30;
        flags.push(`High-pressure bait keywords glued into the domain name (${hitDomainBait.slice(0, 4).join(', ')}).`);
      } else if (hitDomainBait.length === 1 && (brandImpersonated || rootLabel.includes('-'))) {
        score += 20;
        flags.push(`Suspicious keyword ("${hitDomainBait[0]}") combined with a lookalike or hyphenated domain.`);
      }
    }

    score = Math.min(100, score);
    const level = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';
    if (flags.length === 0) {
      flags.push(`No obvious structural red flags found. Still verify "${rootDomain}" directly before entering credentials.`);
    }
    return { host, rootDomain, subdomain, protocol: hasExplicitScheme ? parsed.protocol : '(not specified)', score, level, flags };
  }

  window.BAITCHECK_ANALYZE_URL = analyzeUrl;

  const urlForm = document.getElementById('url-form');
  const urlInput = document.getElementById('url-input');
  const urlResult = document.getElementById('url-result');

  function renderUrlReport(raw) {
    const res = analyzeUrl(raw);
    if (!res || !urlResult) return;
    urlResult.classList.add('visible');
    if (res.error) {
      urlResult.innerHTML = `<div style="color:#ff7c92;font-weight:700;">${escapeHtml(res.error)}</div>`;
      return;
    }
    const badgeClass = res.level === 'high' ? 'verdict-high' : res.level === 'medium' ? 'verdict-medium' : 'verdict-low';
    const badgeLabel =
      res.level === 'high'
        ? `HIGH RISK (${res.score}/100) — LIKELY SPOOF`
        : res.level === 'medium'
          ? `SUSPICIOUS (${res.score}/100)`
          : `NO STRUCTURAL RED FLAGS (${res.score}/100)`;

    urlResult.innerHTML = `
      <div class="verdict-row">
        <span class="verdict-badge ${badgeClass}">${badgeLabel}</span>
        <span style="color:#94a3b8;font-size:13px;">True owner: <strong style="color:#f8fafc;">${escapeHtml(res.rootDomain)}</strong></span>
      </div>
      <div class="domain-grid">
        <div class="domain-box"><small>True Root Domain</small><code>${escapeHtml(res.rootDomain)}</code></div>
        <div class="domain-box"><small>Left Subdomain</small><code>${escapeHtml(res.subdomain)}</code></div>
        <div class="domain-box"><small>Full Host</small><code>${escapeHtml(res.host)}</code></div>
      </div>
      <ul class="flags-list">${res.flags.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
    `;
  }

  if (urlForm && urlInput) {
    urlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      renderUrlReport(urlInput.value);
    });
    document.querySelectorAll('[data-sample]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const sample = chip.getAttribute('data-sample') || '';
        urlInput.value = sample;
        renderUrlReport(sample);
      });
    });
    const urlParam = new URLSearchParams(window.location.search).get('url');
    if (urlParam) {
      urlInput.value = urlParam;
      renderUrlReport(urlParam);
    }
  }

  // =========================================================================
  // 4. Case Files Archive & Resources Cards + Newsletter State
  // =========================================================================
  const caseGrid = document.getElementById('case-files-grid');
  if (caseGrid) {
    if (episodes.length === 0) {
      caseGrid.innerHTML = '<div class="panel" style="color:#94a3b8;">New LedgerZero dossiers publishing soon.</div>';
    } else {
      caseGrid.innerHTML = episodes
        .map(
          (ep) => `
        <article class="case-card">
          <div class="case-meta">
            <span>${escapeHtml(ep.caseNumber)}</span>
            <span style="color:#6ee7b7;">${escapeHtml(ep.category)}</span>
          </div>
          <h3>${escapeHtml(ep.title)}</h3>
          <p style="color:#94a3b8;font-size:14px;">${escapeHtml(ep.summary)}</p>
          <a href="${escapeHtml(ep.caseUrl)}" class="btn btn-secondary" style="margin-top:auto;font-size:13px;padding:10px 14px;">
            Read Full Dossier →
          </a>
        </article>
      `,
        )
        .join('');
    }
  }

  const resGrid = document.getElementById('affiliate-cards');
  const disclosureBanner = document.getElementById('disclosure-banner');
  if (disclosureBanner && cfg.affiliatesEnabled) {
    disclosureBanner.style.display = 'block';
    disclosureBanner.innerHTML =
      '<strong>Disclosure:</strong> Some links below may be partner links that earn LedgerZero a commission at no extra cost to you.';
  }
  if (resGrid && Array.isArray(cfg.resources)) {
    resGrid.innerHTML = cfg.resources
      .map(
        (r) => `
      <article class="tool-card accent-${escapeHtml(r.accent || 'emerald')}">
        <div>
          <span class="tool-badge">${escapeHtml(r.badge)}</span>
          <h3>${escapeHtml(r.name)}</h3>
          <p>${escapeHtml(r.summary)}</p>
        </div>
        <div>
          <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="width:100%;">
            ${escapeHtml(r.ctaLabel)} ↗
          </a>
          <div class="partner-note">${escapeHtml(r.note || '')}</div>
        </div>
      </article>
    `,
      )
      .join('');
  }

  // Newsletter auto-mode (live POST vs Instant Lab Mode)
  const liveWrap = document.getElementById('newsletter-live-wrap');
  const instantWrap = document.getElementById('newsletter-instant-wrap');
  const secondaryActions = document.getElementById('hero-secondary-actions');
  if (liveWrap && instantWrap) {
    if (cfg.newsletterEndpoint) {
      liveWrap.style.display = 'block';
      instantWrap.style.display = 'none';
      const form = document.getElementById('newsletter-form');
      const msg = document.getElementById('newsletter-msg');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('newsletter-email')?.value?.trim();
          if (!email) return;
          try {
            const res = await fetch(cfg.newsletterEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({ email }),
            });
            if (msg) msg.textContent = res.ok ? 'Subscribed! Check your inbox.' : 'Could not subscribe right now—try again later.';
          } catch {
            if (msg) msg.textContent = 'Network error—please try again later.';
          }
        });
      }
    } else {
      liveWrap.style.display = 'none';
      instantWrap.style.display = 'block';
      if (secondaryActions) secondaryActions.style.display = 'none';
    }
  }

  const shareHubBtn = document.getElementById('share-hub-btn');
  const shareHubMsg = document.getElementById('share-hub-msg');
  if (shareHubBtn) {
    shareHubBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'LedgerZero — Billion-Dollar Heists & Money Scale',
        text: 'Try the live $100 Bill Stack Calculator & 5-Second $850M Bank Heist Typo Challenge on LedgerZero:',
        url: window.location.href,
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch {}
      }
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        if (shareHubMsg) shareHubMsg.textContent = 'Hub link copied!';
      } catch {}
    });
  }
})();
