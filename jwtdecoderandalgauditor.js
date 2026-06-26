(function jwtAudit() {
  const b64d = s => {
    try { return JSON.parse(atob(s.replace(/-/g,'+').replace(/_/g,'/'))); } catch { return null; }
  };
  const isJWT = s => typeof s === 'string' && /^[A-Za-z0-9_-]+.[A-Za-z0-9_-]+.[A-Za-z0-9_-]*$/.test(s.trim());

  const found = [];

  [localStorage, sessionStorage].forEach((store, si) => {
    const label = si === 0 ? 'LS' : 'SS';
    Object.keys(store).forEach(k => {
      const v = store.getItem(k);
      if (isJWT(v)) found.push({ source: label, key: k, token: v });
      try {
        const obj = JSON.parse(v || '');
        Object.values(obj).forEach(val => { if (isJWT(val)) found.push({ source: label+':nested', key: k, token: val }); });
      } catch {}
    });
  });

  document.cookie.split(';').forEach(c => {
    const val = c.split('=').slice(1).join('=').trim();
    if (isJWT(val)) found.push({ source: 'Cookie', key: c.split('=')[0].trim(), token: val });
  });

  const _open = XMLHttpRequest.prototype.open;
  const _setHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function(h, v) {
    if (h.toLowerCase() === 'authorization' && isJWT((v||'').replace(/^Bearer /i,'')))
      found.push({ source: 'XHR:Authorization', token: v.replace(/^Bearer /i,'') });
    return _setHeader.call(this, h, v);
  };

  console.group('%c[POC] JWT Auditor', 'color:#f97316;font-weight:bold');

  if (found.length === 0) {
    console.log('No JWTs found in storage/cookies. XHR intercept active trigger an API call then re-check.');
  }

  found.forEach(({ source, key, token }) => {
    const parts = token.split('.');
    const header  = b64d(parts[0]);
    const payload = b64d(parts[1]);
    const issues  = [];

    if (!header) { console.warn('Could not decode header'); return; }
    if (['none','NONE','None'].includes(header.alg)) issues.push('ALG:NONE — signature bypass possible');
    if (header.alg?.startsWith('HS') && payload?.iss) issues.push('HMAC alg with issuer claim — possible RS256→HS256 confusion');
    if (!payload?.exp) issues.push('Missing exp claim — token never expires');
    if (!payload?.nbf) issues.push('Missing nbf claim');
    if (payload?.exp && (payload.exp - Math.floor(Date.now()/1000)) > 86400*30) issues.push('Expiry > 30 days');

    console.group(`[JWT] Source: ${source}${key ? ' | key: '+key : ''}`);
    console.log('Header:', header);
    console.log('Payload:', payload);
    if (issues.length) issues.forEach(i => console.error('[FINDING]', i));
    else console.log('[OK] No obvious algorithm issues');
    console.groupEnd();
  });

  window.__jwtFound = found;
  console.log('All decoded tokens available at window.__jwtFound');
  console.groupEnd();
  return found;
})();
