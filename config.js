/**
 * Centralized brand, email-capture, and monetization-ready resource config for LedgerZero.
 *
 * Policy note: Keep `affiliatesEnabled: false` until you have applied and received
 * official approval from each sponsor/affiliate program. Once approved, plug in your
 * partner URLs and flip `affiliatesEnabled: true` to display FTC-compliant disclosure.
 */
window.LEDGERZERO_CONFIG = {
  brandName: 'LedgerZero',
  tagline: 'True Billion-Dollar Heists, Mind-Bending Money Scale & Interactive Financial Tools',
  social: {
    youtube: 'https://www.youtube.com/@TheLedgerZero',
    instagram: '',
  },
  // Paste your Beehiiv / ConvertKit / Formspree POST endpoint to activate live email capture
  newsletterEndpoint: '',
  affiliatesEnabled: false,
  resources: [
    {
      id: 'bep-currency-facts',
      badge: 'OFFICIAL SOURCE • MONEY SCALE',
      name: 'U.S. Bureau of Engraving & Printing — Currency Specs',
      summary:
        'Every $100 bill stack calculation on LedgerZero uses official U.S. Treasury dimensions: 0.0043 in (0.10922 mm) thickness and 1.0 gram weight per Federal Reserve note.',
      ctaLabel: 'View U.S. Currency Specs',
      url: 'https://www.bep.gov/currency/how-money-is-made',
      accent: 'emerald',
      note: 'Official U.S. Treasury reference • Verified math',
    },
    {
      id: 'password-vault',
      badge: 'FINANCE & VAULT SECURITY',
      name: 'Domain-Locked Password Manager (Bitwarden / 1Password)',
      summary:
        'Stops credential theft and fake banking login pages by refusing to auto-fill passwords on lookalike domains—the #1 upgrade for protecting brokerage and bank accounts.',
      ctaLabel: 'Explore Bitwarden (Free)',
      url: 'https://bitwarden.com/',
      accent: 'cyan',
      note: 'Independent security pick • Open-source free tier',
    },
    {
      id: 'hardware-passkeys',
      badge: 'STOP ACCOUNT TAKEOVERS',
      name: 'App-Based 2FA & Hardware Passkeys (Ente Auth / YubiKey)',
      summary:
        'SMS one-time codes can be intercepted via SIM swaps. Moving banking, brokerage, and primary email accounts to passkeys or TOTP apps locks out remote attackers.',
      ctaLabel: 'Check Ente Auth (Free)',
      url: 'https://ente.io/auth/',
      accent: 'amber',
      note: 'Independent resource • Encrypted open-source 2FA',
    },
    {
      id: 'credit-freeze',
      badge: 'FREE FINANCIAL LOCKDOWN',
      name: 'Freeze Your Credit Bureaus (Equifax, Experian, TransUnion)',
      summary:
        'Freezing your credit files is 100% free by U.S. federal law and blocks unauthorized loans or credit lines even if your personal data leaks in a breach.',
      ctaLabel: 'Official FTC Freeze Guide',
      url: 'https://consumer.ftc.gov/articles/what-know-about-credit-freezes-and-fraud-alerts',
      accent: 'danger',
      note: 'Official FTC consumer resource • $0 cost',
    },
  ],
};
// Preserve legacy alias for backward compatibility
window.BAITCHECK_CONFIG = window.LEDGERZERO_CONFIG;
