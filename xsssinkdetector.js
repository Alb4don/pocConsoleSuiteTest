(function xssSinkDetector() {
  const sinks = [];

  const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (desc && desc.set) {
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set(val) {
        if (typeof val === 'string' && val.trim().length > 0) {
          sinks.push({ sink: 'innerHTML', tag: this.tagName, preview: val.slice(0,100), stack: new Error().stack.split('\n')[2] });
        }
        return desc.set.call(this, val);
      },
      get() { return desc.get.call(this); }
    });
  }

  const _eval = window.eval;
  window.eval = function(code) {
    sinks.push({ sink: 'eval', preview: String(code).slice(0,100), stack: new Error().stack.split('\n')[2] });
    return _eval(code);
  };

  const _write = document.write.bind(document);
  document.write = function(str) {
    sinks.push({ sink: 'document.write', preview: str.slice(0,100), stack: new Error().stack.split('\n')[2] });
    return _write(str);
  };

  const params = new URLSearchParams(location.search);
  const domText = document.body.innerText;
  params.forEach((val, key) => {
    if (val.length > 1 && domText.includes(val))
      sinks.push({ sink: 'URL reflection', param: key, value: val, reflected: true });
  });

  console.log('%c[POC] Sink Detector active — interact with the page, then run window.__sinkReport()', 'color:#22c55e');
  window.__sinkReport = () => {
    console.group('%c[POC] XSS Sink Report', 'color:#f97316;font-weight:bold');
    if (sinks.length === 0) console.log('No sinks triggered yet. Navigate/interact more');
    sinks.forEach((s,i) => console.warn(`#${i+1}`, JSON.stringify(s)));
    console.groupEnd();
    return sinks;
  };
})();
