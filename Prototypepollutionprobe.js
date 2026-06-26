(function protoPollutionProbe() {
  const sentinel = '__pptest_' + Math.random().toString(36).slice(2);
  const results = [];

  const testParams = [
    `?__proto__[${sentinel}]=polluted`,
    `?constructor[prototype][${sentinel}]=polluted`,
    `?__proto__.${sentinel}=polluted`,
  ];

  console.group('%c[POC] Prototype Pollution Probe', 'color:#f97316;font-weight:bold');
  console.log('[INFO] Checking Object.prototype for existing pollution...');

  const protoKeys = Object.getOwnPropertyNames(Object.prototype)
    .filter(k => !['constructor','hasOwnProperty','isPrototypeOf','propertyIsEnumerable','toString','toLocaleString','valueOf','__defineGetter__','__defineSetter__','__lookupGetter__','__lookupSetter__','__proto__'].includes(k));

  if (protoKeys.length > 0) {
    console.error('[FINDING] Object.prototype has unexpected properties:', protoKeys);
    results.push({ type: 'existing pollution', keys: protoKeys });
  } else {
    console.log('[OK] Object.prototype clean at page load');
  }

  try {
    const malicious = JSON.parse(`{"__proto__":{"[${sentinel}]":"polluted"}}`);
    if ({}[sentinel] === 'polluted') {
      console.error('[CRITICAL] JSON.parse prototype pollution succeeded');
      results.push({ type: 'JSON.parse pollution', prop: sentinel });
      delete Object.prototype[sentinel];
    } else console.log('[OK] JSON.parse pollution blocked');
  } catch(e) { console.log('[OK] JSON.parse blocked:', e.message); }

  const vulnLibs = [
    { name: 'lodash', re: /lodash[.@-](d+.d+.d+)/, vuln: v => {
      const [ma,mi] = v.split('.').map(Number);
      return (ma===4 && mi<17) || (ma===3) ? `lodash ${v} < 4.17.21 — PP via merge/set` : null;
    }},
    { name: 'jquery', re: /jquery[.@-](d+.d+.d+)/, vuln: v => {
      const [ma,mi,pa] = v.split('.').map(Number);
      return (ma===3 && mi<5) || (ma<3) ? `jQuery ${v} — possible XSS/PP` : null;
    }},
  ];

  document.querySelectorAll('script[src]').forEach(s => {
    vulnLibs.forEach(lib => {
      const m = s.src.match(lib.re);
      if (m) {
        const finding = lib.vuln(m[1]);
        if (finding) { console.error('[FINDING] Vulnerable library:', finding, s.src); results.push({ type: 'vuln lib', finding, src: s.src }); }
        else console.log(`[OK] ${lib.name} ${m[1]} — version appears safe`);
      }
    });
  });

  console.log('Test URLs for manual deep-dive:');
  testParams.forEach(p => console.log(' ', location.origin + location.pathname + p));
  console.groupEnd();
  return results;
})();
