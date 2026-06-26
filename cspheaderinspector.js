(async function cspAudit() {
  try {
    const res = await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
    const csp = res.headers.get('content-security-policy');
    const cspro = res.headers.get('content-security-policy-report-only');
    const xcto = res.headers.get('x-content-type-options');
    const xfo  = res.headers.get('x-frame-options');

    console.group('%c[POC] CSP & Security Headers', 'color:#f97316;font-weight:bold');

    if (!csp) { console.error('[HIGH] No Content-Security-Policy header found'); }
    else {
      const directives = csp.split(';').map(d => d.trim());
      const flags = {
        'unsafe-inline': directives.some(d => d.includes("'unsafe-inline'")),
        'unsafe-eval':   directives.some(d => d.includes("'unsafe-eval'")),
        'wildcard src':  directives.some(d => /script-src[^;]**/.test(d)),
        'missing object-src': !directives.some(d => d.startsWith('object-src')),
        'missing base-uri':   !directives.some(d => d.startsWith('base-uri')),
      };
      Object.entries(flags).forEach(([k,v]) => v && console.warn(`[CSP ISSUE] ${k}`));
      if (cspro && !csp) console.warn('[INFO] CSP is report only - not enforced');
    }

    if (!xcto) console.warn('[MEDIUM] Missing X-Content-Type-Options');
    if (!xfo)  console.warn('[MEDIUM] Missing X-Frame-Options (potential clickjacking)');

    console.log('CSP:', csp || 'ABSENT');
    console.groupEnd();
  } catch(e) { console.error('Fetch failed (CORS or network):', e.message); }
})();
