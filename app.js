(function () {
  const cfg = window.BAITCHECK_CONFIG || { resources: [] };
  const episodes = window.BAITCHECK_EPISODES || [];

  const brandEl = document.getElementById('brand-name');
  if (brandEl && cfg.brandName) brandEl.textContent = cfg.brandName.toUpperCase();

  // 1. Client-side Phishing URL Inspector (with Official-Domain Allowlist + Bait-Word Detection)
  const SHORTENERS = new Set([
    'bit.ly', 'tinyurl.com', 't.co', 'rb.gy', 'cutt.ly', 'is.gd', 'ow.ly', 'shorturl.at', 'tiny.cc', 'rebrand.ly',
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
    ezpass: [
      'ezpassny.com', 'e-zpassny.com', 'ezpassnj.com', 'ezpasspa.com', 'ezpassva.com',
      'ezpassma.com', 'ezpassmd.com', 'ezpassde.com', 'ezpassil.com', 'ezpassnh.com',
      'ezpassoh.com', 'ezpasswv.com', 'ezpassin.com', 'ezpassri.com', 'ezpassme.com', 'e-zpassiag.com',
    ],
    sunpass: ['sunpass.com'],
    fastrak: ['bayareafastrak.org', 'thetollroads.com', 'metroexpresslanes.net'],
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
    if (TWO_PART_TLDS.has(last2) && parts.length >= 3) {
      return parts.slice(-3).join('.');
    }
    return last2;
  }

  function getRootLabel(rootDomain) {
    const parts = rootDomain.split('.');
    if (parts.length >= 3 && TWO_PART_TLDS.has(parts.slice(-2).join('.'))) {
      return parts.slice(0, -2).join('.');
    }
    return parts.slice(0, -1).join('.');
  }

  function matchesBrandInLabel(label, brand) {
    if (!label.includes(brand)) return false;
    // Avoid false positives for short <=3-char brands inside normal words (e.g. "ups" in "groups", "irs" in "first")
    if (brand.length <= 3) {
      const boundaryRe = new RegExp(`(^|[-_0-9])${brand}($|[-_0-9])`);
      if (boundaryRe.test(label)) return true;
      // Also match short brand prefix glued directly to a known scam bait word (e.g. "upsdelivery", "irspay")
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
      flags.push('Punycode / internationalized lookalike characters detected (homograph attack risk).');
    }
    if (SHORTENERS.has(rootDomain)) {
      score += 35;
      flags.push(`URL shortener (${rootDomain}) hides the true destination — never enter credentials or card info after clicking.`);
    }
    if (RISKY_TLDS.has(tld)) {
      score += 25;
      flags.push(`High-abuse top-level domain (.${tld}) frequently used in disposable scam campaigns.`);
    }
    if (raw.includes('@')) {
      score += 45;
      flags.push('Contains "@" symbol — attackers use this to disguise the real host after the @.');
    }
    if ((rootLabel.match(/-/g) || []).length >= 2) {
      score += 25;
      flags.push(`Multi-hyphen root domain ("${rootDomain}") — heavily used in disposable phishing clones.`);
    } else if ((rootLabel.match(/-/g) || []).length >= 1 && /\d/.test(rootLabel)) {
      score += 25;
      flags.push(`Root domain "${rootDomain}" mixes hyphens and digits — common in throwaway scam clones.`);
    }

    // Brand impersonation check (works WITH OR WITHOUT hyphens, e.g. uspsofficialdelivery.com!)
    let brandImpersonated = null;
    for (const [brand, officialList] of Object.entries(BRAND_OFFICIAL_DOMAINS)) {
      const isOfficial = officialList.includes(rootDomain);
      if (isOfficial) continue;

      if (subdomain !== '(none)' && matchesBrandInLabel(subdomain, brand)) {
        score += 55;
        brandImpersonated = brand;
        flags.push(
          `Subdomain spoofing: mentions "${brand.toUpperCase()}" on the left, but the TRUE site owner is "${rootDomain}" (official: ${officialList[0]}).`,
        );
        break;
      }

      if (matchesBrandInLabel(rootLabel, brand)) {
        score += 55;
        brandImpersonated = brand;
        flags.push(
          `Brand lookalike root domain: "${rootDomain}" embeds "${brand.toUpperCase()}" inside an unofficial domain. Official domain is ${officialList[0]}.`,
        );
        break;
      }
    }

    // Check suspicious bait words glued inside the root domain (e.g., "official" + "delivery", "pay" + "zone")
    const isAnyOfficial = Object.values(BRAND_OFFICIAL_DOMAINS).some((list) => list.includes(rootDomain));
    if (!isAnyOfficial) {
      const hitDomainBait = BAIT_DOMAIN_WORDS.filter((w) => rootLabel.includes(w));
      if (hitDomainBait.length >= 2) {
        score += 30;
        flags.push(
          `High-pressure bait keywords glued into the domain name (${hitDomainBait.slice(0, 4).join(', ')}) — classic smishing clone pattern.`,
        );
      } else if (hitDomainBait.length === 1 && (brandImpersonated || rootLabel.includes('-'))) {
        score += 20;
        flags.push(
          `Suspicious action keyword ("${hitDomainBait[0]}") combined with a lookalike or hyphenated domain.`,
        );
      }
    }

    // Check subdomain depth / gov spoof tokens
    if (subdomain !== '(none)' && /\bgov\b|-gov|gov-/.test(subdomain) && !tld.endsWith('gov')) {
      score += 45;
      flags.push(`Government impersonation cue ("gov") in subdomain on a non-.gov domain ("${rootDomain}").`);
    }

    const suspiciousPathWords = ['verify', 'kyc', 'urgent', 'suspend', 'refund', 'claim', 'unlock', 'pay-now', 'login'];
    const pathLower = `${parsed.pathname}${parsed.search}`.toLowerCase();
    const hitPath = suspiciousPathWords.filter((w) => pathLower.includes(w));
    if (hitPath.length > 0 && score > 0) {
      score += 10;
      flags.push(`Urgency/credential path keywords detected (${hitPath.join(', ')}).`);
    }

    score = Math.min(100, score);
    const level = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';
    if (flags.length === 0) {
      flags.push(
        `No obvious structural red flags found. Still confirm "${rootDomain}" is the exact official domain you expect before entering any password or card.`,
      );
    }

    return {
      host,
      rootDomain,
      subdomain,
      protocol: hasExplicitScheme ? parsed.protocol : '(not specified)',
      score,
      level,
      flags,
    };
  }

  // Expose pure analyzer for automated CLI verification if needed
  window.BAITCHECK_ANALYZE_URL = analyzeUrl;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

    const badgeClass =
      res.level === 'high' ? 'verdict-high' : res.level === 'medium' ? 'verdict-medium' : 'verdict-low';
    const badgeLabel =
      res.level === 'high'
        ? `HIGH RISK (${res.score}/100) — LIKELY SCAM BAIT`
        : res.level === 'medium'
          ? `SUSPICIOUS (${res.score}/100) — VERIFY INDEPENDENTLY`
          : `NO STRUCTURAL RED FLAGS (${res.score}/100)`;

    urlResult.innerHTML = `
      <div class="verdict-row">
        <span class="verdict-badge ${badgeClass}">${badgeLabel}</span>
        <span style="color:#94a3b8;font-size:13px;">True destination owner: <strong style="color:#f8fafc;">${escapeHtml(res.rootDomain)}</strong></span>
      </div>
      <div class="domain-grid">
        <div class="domain-box">
          <small>True Root Domain</small>
          <code style="color:${res.level === 'high' ? '#ff7c92' : res.level === 'medium' ? '#fcd34d' : '#6ee7b7'};font-weight:800;">${escapeHtml(res.rootDomain)}</code>
        </div>
        <div class="domain-box">
          <small>Subdomain (Can Be Faked)</small>
          <code>${escapeHtml(res.subdomain)}</code>
        </div>
        <div class="domain-box">
          <small>Protocol</small>
          <code>${escapeHtml(res.protocol.replace(':', '').toUpperCase())}</code>
        </div>
      </div>
      <ul class="flags-list">
        ${res.flags.map((f) => `<li>• ${escapeHtml(f)}</li>`).join('')}
      </ul>
    `;
  }

  if (urlForm) {
    urlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      renderUrlReport(urlInput.value);
    });
  }

  document.querySelectorAll('.chip[data-sample]').forEach((btn) => {
    btn.addEventListener('click', () => {
      urlInput.value = btn.getAttribute('data-sample') || '';
      renderUrlReport(urlInput.value);
    });
  });

  // Auto-run inspection if deep-linked via ?url=... (e.g. from a Case File page)
  try {
    const params = new URLSearchParams(window.location.search);
    const prefillUrl = params.get('url');
    if (prefillUrl && urlInput) {
      urlInput.value = prefillUrl;
      renderUrlReport(prefillUrl);
    }
  } catch {}

  // 2. Consumer-Focused 60-Second Lockdown Checklist
  const CHECKLIST_DATA = [
    {
      id: 'safe-word',
      cat: 'family',
      title: 'Set a private offline Family Safe Word',
      desc: 'Stops AI voice-clone panic calls instantly—agree on one unusual word in person that no caller can guess.',
    },
    {
      id: 'callback-rule',
      cat: 'family',
      title: 'Enforce the "Hang Up & Call Back" rule',
      desc: 'For any bank, police, or emergency call, hang up and dial the saved contact or official number on the back of your card.',
    },
    {
      id: 'voicemail-voice',
      cat: 'family',
      title: 'Switch voicemail back to the default automated greeting',
      desc: 'Prevents unknown callers from recording a clean 5-second voice sample off your voicemail.',
    },
    {
      id: 'silence-unknown',
      cat: 'mobile',
      title: 'Enable "Silence Unknown Callers" on iPhone / Android & WhatsApp',
      desc: 'Blocks spoofed scam calls and unverified video calls before they trigger panic.',
    },
    {
      id: 'sim-pin',
      cat: 'mobile',
      title: 'Turn on carrier Port-Out Lock & switch banking/email off SMS 2FA',
      desc: 'Stops SIM-swap attackers from hijacking SMS verification codes to reset your accounts.',
    },
    {
      id: 'sms-links',
      cat: 'mobile',
      title: 'Never tap payment links in unexpected toll, parcel, or bank texts',
      desc: 'Forward spam SMS to 7726 (SPAM) and open the official toll, courier, or bank app directly.',
    },
    {
      id: 'qr-check',
      cat: 'finance',
      title: 'Inspect public QR signs for pasted stickers & check the root domain',
      desc: 'Run a finger over parking-meter QR labels and verify the exact domain before entering card details.',
    },
    {
      id: 'credit-freeze',
      cat: 'finance',
      title: 'Place free credit freezes & lower daily instant-transfer limits',
      desc: 'Prevents identity thieves from opening new credit lines and caps damage if an account is compromised.',
    },
  ];

  const STORAGE_KEY = 'baitcheck_checklist_v1';
  let checkedState = {};
  try {
    checkedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    checkedState = {};
  }

  let currentCat = 'all';
  const checklistEl = document.getElementById('checklist-items');
  const fillEl = document.getElementById('checklist-progress-fill');
  const pctEl = document.getElementById('checklist-progress-pct');

  function updateProgress() {
    const done = CHECKLIST_DATA.filter((item) => checkedState[item.id]).length;
    const pct = Math.round((done / CHECKLIST_DATA.length) * 100);
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
  }

  function renderChecklist() {
    if (!checklistEl) return;
    const items =
      currentCat === 'all'
        ? CHECKLIST_DATA
        : CHECKLIST_DATA.filter((i) => i.cat === currentCat);

    checklistEl.innerHTML = items
      .map((item) => {
        const isChecked = Boolean(checkedState[item.id]);
        return `
          <label class="check-item ${isChecked ? 'checked' : ''}">
            <input type="checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''} />
            <div>
              <div class="check-title">${escapeHtml(item.title)}</div>
              <div class="check-desc">${escapeHtml(item.desc)}</div>
            </div>
          </label>
        `;
      })
      .join('');

    checklistEl.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        checkedState[id] = e.target.checked;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedState));
        } catch {}
        e.target.closest('.check-item').classList.toggle('checked', e.target.checked);
        updateProgress();
      });
    });

    updateProgress();
  }

  document.querySelectorAll('#checklist-tabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#checklist-tabs .tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.getAttribute('data-cat') || 'all';
      renderChecklist();
    });
  });

  const printBtn = document.getElementById('print-checklist');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      currentCat = 'all';
      renderChecklist();
      window.print();
    });
  }

  renderChecklist();

  // Shared 1-Tap Family Share helper (Web Share API -> Clipboard / WhatsApp fallback)
  async function shareBaitCheck(title, text, url, feedbackEl) {
    const shareUrl = url || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        if (feedbackEl) feedbackEl.textContent = 'Shared! Thanks for protecting your family.';
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
      if (feedbackEl) feedbackEl.textContent = 'Link copied! Paste straight into your family WhatsApp or text group.';
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`, '_blank', 'noopener');
    }
  }

  const shareHubBtn = document.getElementById('share-hub-btn');
  const shareHubMsg = document.getElementById('share-hub-msg');
  if (shareHubBtn) {
    shareHubBtn.addEventListener('click', () => {
      shareBaitCheck(
        'BaitCheck — Free Family Scam Checklist & Private URL Inspector',
        'Useful free tool to check suspicious package/bank links privately + 60-second Family Scam Checklist:',
        window.location.href.split('#')[0].split('?')[0],
        shareHubMsg,
      );
    });
  }

  const shareChecklistBtn = document.getElementById('share-checklist');
  if (shareChecklistBtn) {
    shareChecklistBtn.addEventListener('click', () => {
      const base = window.location.href.split('#')[0].split('?')[0];
      shareBaitCheck(
        '60-Second Family Scam Lockdown Checklist — BaitCheck',
        'Quick 60-second phone & family scam checklist worth saving:',
        `${base}#checklist`,
      );
    });
  }

  // 3. Render Honest Independent Resources (only shows affiliate disclosure if affiliatesEnabled === true)
  const disclosureEl = document.getElementById('disclosure-banner');
  if (disclosureEl && cfg.affiliatesEnabled) {
    disclosureEl.style.display = 'block';
    disclosureEl.innerHTML =
      '<strong>Affiliate Disclosure:</strong> Some links below are approved partner links. If you sign up through them, BaitCheck may earn a commission at zero extra cost to you.';
  }

  const resEl = document.getElementById('affiliate-cards');
  const items = cfg.resources || [];
  if (resEl && Array.isArray(items)) {
    resEl.innerHTML = items
      .map(
        (tool) => `
      <article class="tool-card accent-${escapeHtml(tool.accent || 'cyan')}">
        <div>
          <span class="tool-badge">${escapeHtml(tool.badge)}</span>
          <h3>${escapeHtml(tool.name)}</h3>
          <p>${escapeHtml(tool.summary)}</p>
        </div>
        <div>
          <a class="btn btn-primary" style="width:100%;" href="${escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer${cfg.affiliatesEnabled ? ' sponsored' : ''}">
            ${escapeHtml(tool.ctaLabel)} →
          </a>
          <div class="partner-note">${escapeHtml(tool.note || '')}</div>
        </div>
      </article>
    `,
      )
      .join('');
  }

  // 4. Render Auto-Synced Published Case Files Archive
  const casesSection = document.getElementById('cases');
  const casesEl = document.getElementById('case-files-grid');
  if (casesEl) {
    if (episodes.length === 0 && casesSection) {
      casesSection.style.display = 'none';
    }
    casesEl.innerHTML = episodes
      .map((ep) => {
        const bullets = (ep.defenseBullets || [])
          .slice(0, 3)
          .map((b) => `<li>✓ ${escapeHtml(b)}</li>`)
          .join('');
        return `
        <article class="case-card">
          <div class="case-meta">
            <span>${escapeHtml(ep.caseNumber)}</span>
            <span style="color:#38bdf8;">${escapeHtml(ep.category)}</span>
          </div>
          <h3>${escapeHtml(ep.title)}</h3>
          <p style="font-size:14px;color:#94a3b8;">${escapeHtml(ep.summary)}</p>
          <ul class="case-bullets">${bullets}</ul>
          <a href="${escapeHtml(ep.caseUrl || '#')}" style="margin-top:auto;padding-top:8px;color:#38bdf8;font-weight:700;font-size:13px;text-decoration:none;">
            Read full forensic guide &amp; take 3s quiz →
          </a>
        </article>
      `;
      })
      .join('');
  }

  // 5. Primary Email Capture Form (cleanly switches to instant-kit mode if newsletterEndpoint is not yet connected)
  const nlLiveWrap = document.getElementById('newsletter-live-wrap');
  const nlInstantWrap = document.getElementById('newsletter-instant-wrap');
  const heroSecActions = document.getElementById('hero-secondary-actions');
  const nlForm = document.getElementById('newsletter-form');
  const nlEmail = document.getElementById('newsletter-email');
  const nlMsg = document.getElementById('newsletter-msg');

  if (!cfg.newsletterEndpoint) {
    if (nlLiveWrap) nlLiveWrap.style.display = 'none';
    if (nlInstantWrap) nlInstantWrap.style.display = 'block';
    if (heroSecActions) heroSecActions.style.display = 'none';
  } else if (nlForm) {
    nlForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (nlEmail.value || '').trim();
      if (!email) return;

      try {
        nlMsg.style.color = '#6ee7b7';
        nlMsg.textContent = 'Subscribing...';
        const res = await fetch(cfg.newsletterEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email, source: 'baitcheck-hub' }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        nlMsg.textContent = 'You are in! Watch your inbox for this week’s BaitCheck alert.';
        nlEmail.value = '';
      } catch (err) {
        nlMsg.style.color = '#ff7c92';
        nlMsg.textContent = `Could not subscribe right now (${err.message}).`;
      }
    });
  }
})();
