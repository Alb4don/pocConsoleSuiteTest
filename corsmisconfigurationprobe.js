(async function corsProbe() {
  const testOrigins = [
    'https://evil.com',
    'https://attacker.io',
    location.origin + '.evil.com',
    'null'
  ];
  const endpoints = ['/', '/api', '/api/v1', '/api/user', '/graphql', '/me'];

  console.group('%c[POC] CORS Misconfiguration Probe', 'color:#f97316;font-weight:bold');
  console.warn('[NOTE] Spoofed Origin headers require a proxy browser enforces real Origin. Use this to map API surface, then re-test with Burp.');

  for (const path of endpoints) {
    try {
      const res = await fetch(path, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      const acao = res.headers.get('access-control-allow-origin');
      const acac = res.headers.get('access-control-allow-credentials');
      const vary = res.headers.get('vary');

      if (acao) {
        const vuln = (acao === '*' || acao === 'null') && acac === 'true';
        const reflective = acao !== '*' && vary?.toLowerCase().includes('origin');

        console[vuln ? 'error' : 'log'](
          `[${res.status}] ${path} | ACAO: ${acao} | ACAC: ${acac} | Vary: ${vary}`,
          vuln ? '⚠ WILDCARD+CREDENTIALS' : reflective ? '— check reflection' : ''
        );
      } else {
        console.log(`[${res.status}] ${path} | No CORS headers`);
      }
    } catch(e) { console.warn(`[${path}] ${e.message}`); }
  }
  console.groupEnd();
})();
