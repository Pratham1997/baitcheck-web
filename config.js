/**
 * Centralized brand, email-capture, and defense-resources config for BaitCheck.
 *
 * Policy note: Do NOT mark links as "Partner / Affiliate links" until you have
 * applied and received official approval from each program. Set
 * `affiliatesEnabled: true` ONLY after real traffic + approved affiliate URLs
 * are configured.
 */
window.BAITCHECK_CONFIG = {
  brandName: 'BaitCheck',
  tagline: 'Real Scam Artifact Teardowns, Private URL Checks & Free Family Defenses',
  social: {
    youtube: 'https://youtube.com/@BaitCheck',
    instagram: 'https://instagram.com/baitcheck',
  },
  // Paste your Beehiiv / ConvertKit / Formspree POST endpoint for the primary email funnel
  newsletterEndpoint: '',
  // Optional: form/webhook URL where viewers can submit redacted scam texts/URLs for teardown
  submissionUrl: '#newsletter',
  affiliatesEnabled: false,
  resources: [
    {
      id: 'password-manager',
      badge: 'STOPS PHISHING AUTO-FILL',
      name: 'Domain-Locked Password Manager (Bitwarden / 1Password)',
      summary:
        'A password manager refuses to auto-fill credentials on lookalike phishing domains (such as ezpass-ny-toll[.]com), stopping credential theft even when a clone page looks identical.',
      ctaLabel: 'Explore Bitwarden (Free)',
      url: 'https://bitwarden.com/',
      accent: 'emerald',
      note: 'Independent resource • Open-source free tier available',
    },
    {
      id: 'authenticator-2fa',
      badge: 'STOPS SIM-SWAP TAKEOVERS',
      name: 'App-Based 2FA & Passkeys (Ente Auth / Aegis / Hardware Keys)',
      summary:
        'SMS one-time codes can be hijacked via carrier SIM swaps. Switching email and banking logins to an authenticator app or passkey removes SMS as a single point of failure.',
      ctaLabel: 'Check Ente Auth (Free)',
      url: 'https://ente.io/auth/',
      accent: 'cyan',
      note: 'Independent resource • Open-source & encrypted backup',
    },
    {
      id: 'credit-freeze',
      badge: 'FREE IDENTITY LOCKDOWN',
      name: 'Freeze Credit Files & Enable Carrier Port-Out Lock',
      summary:
        'Freezing your credit reports (Equifax, Experian, TransUnion) is 100% free by law in the US and stops scammers from opening loans even if your SSN leaks. Add a carrier SIM/port-out PIN today.',
      ctaLabel: 'FTC Credit Freeze Guide',
      url: 'https://consumer.ftc.gov/articles/what-know-about-credit-freezes-and-fraud-alerts',
      accent: 'amber',
      note: 'Official US FTC guide • 100% free to enable',
    },
    {
      id: 'official-reporting',
      badge: 'REPORT ACTIVE SCAMS',
      name: 'Official Fraud Reporting Portals (FTC / IC3 / Sanchar Saathi)',
      summary:
        'Report active phishing numbers and scam domains immediately so carriers and registrars can sinkhole infrastructure before other families get targeted.',
      ctaLabel: 'ReportFraud.ftc.gov',
      url: 'https://reportfraud.ftc.gov/',
      accent: 'danger',
      note: 'Official government reporting portal • Free public service',
    },
  ],
};
