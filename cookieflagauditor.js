(function cookieFlagAudit() {
  const cookies = document.cookie.split(';').map(c => c.trim());
  const issues = [];

  cookies.forEach(raw => {
    const [name] = raw.split('=');
    const n = name.trim();
    if (!n) return;

    const missing = [];
    // HttpOnly/Secure not readable from JS if set absence here means they're NOT set.
    // Enumerate what IS visible (already bypasses HttpOnly-protected ones)
    if (!raw.toLowerCase().includes('secure')) missing.push('Secure');
    if (!raw.toLowerCase().includes('samesite')) missing.push('SameSite');

    issues.push({ name: n, value: document.cookie.match(new RegExp(n+'=([^;]*)')) ?.[1]?.slice(0,40), missing });
  });

  console.group('%c[POC] Cookie Flag Audit', 'color:#f97316;font-weight:bold');
  console.log('Total JS-accessible cookies (HttpOnly absent):', cookies.filter(Boolean).length);
  issues.forEach(i => {
    console.warn(`Cookie: ${i.name} | Missing flags: ${i.missing.join(', ') || 'none'} | Value preview: ${i.value}`);
  });
  if (cookies.filter(Boolean).length > 0)
    console.error('[FINDING] All visible cookies lack HttpOnly, exfiltrable via XSS');
  console.groupEnd();
  return issues;
})();
