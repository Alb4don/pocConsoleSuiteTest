### `Overview`

- Every script in this suite targets a specific vulnerability class from cookie misconfiguration and information disclosure all the way through JWT algorithm confusion and prototype pollution and produces structured, diff-friendly output that maps cleanly onto CVSS 3.1 scoring and OWASP classification.
 
- I built this because manual DevTools analysis tends to be repetitive and error-prone when you're covering the same surface across dozens of targets. Rather than re-typing one-liners from memory or pulling snippets from scattered notes, I wanted a single, organized toolkit I could paste selectively depending on what the target's behavior suggested.

                                          "When you can break it, help mend it" - Unknown author

### `Philosophy`

- None of these scripts inject payloads. The goal is passive instrumentation and enumeration confirming that a vulnerability class is present and characterizable before escalating to active exploitation in a controlled environment.

- False positives are controlled by design; each script reports what it actually observes in the DOM, network headers, or storage layer rather than inferring from indirect signals.

### `Scripts`

### `cookie flag auditor` 
 
- Enumerates every cookie accessible from JavaScript and reports which ones are missing `Secure` and `SameSite` attributes. Any cookie visible from `document.cookie` has already failed the `HttpOnly` check by definition, so the script logs that count as its primary finding.

- The output separates the attribute gap from the visibility gap to avoid conflating two distinct weaknesses in the disclosure report.
  
---
 
### `csp header inspector` 
 
- Issues a `HEAD` request against the current origin and parses the `Content-Security-Policy` response header. It flags `unsafe-inline`, `unsafe eval`, wildcard script sources, and missing `object-src` and `base uri` directives the four gaps that most reliably translate into exploitable XSS injection points even when a policy is nominally present.
  
- It also checks `X-Content-Type-Options` and `X-Frame-Options` in the same pass, since those tend to be missing together with weak CSP configurations.

  ---

### `dom info harvester` 
 
- Walks the entire DOM tree looking for HTML comments, generator and version meta tags, script `src` attributes pointing to localhost, staging, or internal subnets, and inline script patterns matching API keys, debug flags, and internal URLs.

- I wrote this because build pipelines frequently embed version strings and environment flags in the delivered HTML that developers assume no one reads and those strings consistently accelerate the exploitation phase by narrowing the attack surface before I've sent a single authenticated request.

### `full storage enumerator` 
 
- Dumps `localStorage`, `sessionStorage`, IndexedDB database names, and Service Worker cache keys in a single pass. Items whose keys or values match a pattern covering tokens, credentials, PII identifiers, and API references are flagged separately so they stand out in longer outputs.

- The IndexedDB enumeration uses `indexedDB.databases()` where available and degrades gracefully where the API isn't exposed. This script is usually the first thing I run on any target the storage layer tells me more about a front end architecture in thirty seconds than most source maps do.
  
---
 
### `logout persistence detector` 
 
- This one runs in two stages. Before logging out, I call the snapshot function, which serializes the entire storage state into `window.__storageSnapshot`. After logout, the delta function compares what's currently in storage against that snapshot and lists every surviving key alongside a boolean indicating whether the value changed.

- A key that persists with an unchanged value after logout is the strongest possible evidence of incomplete session cleanup and it's exactly the pattern I documented in the Mixpanel `distinct_id` findings that preceded this suite.

### `cors misconfiguration probe` 
 
- Sends credentialed `fetch` requests to a predefined list of common API paths on the current origin and inspects `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, and `Vary` response headers.

- A wildcard or reflected ACAO paired with `ACAC: true` is immediately reportable. The script also logs the test URLs for the origin-spoofing follow-up that needs to happen through an intercepting proxy, since browsers enforce the real `Origin` header regardless of what JavaScript tries to set.
 
 
---
 
### `xss sink detector` 
 
- Instruments `innerHTML`, `document.write`, and `eval` at the prototype level so that any subsequent assignment or call gets logged with a stack trace and a preview of the data reaching the sink. It also checks URL query parameters for reflected values against `document.body.innerText` on load.
  
- The instrumentation is entirely passive no synthetic payload ever touches the DOM which keeps this usable during assessments where active testing requires prior written authorization.

  ---
 
### `jwt decoder and alg auditor` 
 
- Scans localStorage, sessionStorage, and cookies for strings matching the JWT three-part base64url structure, then decodes header and payload without performing signature verification.
  
- For each token found it checks the `alg` field for `none` variants, looks for the RS256→HS256 confusion pattern (HMAC algorithm on a token carrying an `iss` claim), and flags missing `exp` and `nbf` claims or expirations beyond thirty days.
  
- It also patches `XMLHttpRequest.prototype.setRequestHeader` to capture tokens passed in `Authorization` headers from that point forward in the session.
 
 
---
 
### `prototype pollution probe` 
 
- Scans `Object.prototype` for properties that shouldn't be there at page load, then tests whether `JSON.parse` on a crafted `__proto__` key produces observable pollution on a sentinel property.
  
- It also audits every `<script src>` against a table of known vulnerable lodash and jQuery version ranges.
  
- Prototype pollution is one of the more underreported vulnerabilities in modern SPAs precisely because its impact varies so dramatically by context a polluted property that does nothing in isolation can enable authentication bypass the moment a downstream `hasOwnProperty` check fails.

  ---
 
## Usage
 
- Every script is self-contained. Open DevTools on the target (`F12` or `Cmd+Option+I`), navigate to the Console tab, paste the script, and read the grouped output. Scripts that require multi-step execution `logout-persistence-detector` specifically include inline instructions as `console.log` messages at each stage.
 
- The CORS probe and XSS sink detector produce more meaningful results when combined with intercepting proxy traffic. I use these scripts to build a hypothesis about the target's behavior and then validate through Burp Suite before writing findings.

  ---

### `Disclaimer` 

- These scripts are intended exclusively for use against targets you are authorized to test. The author accepts no responsibility for any misuse of these scripts.


---
 
## Author
 
[Alb4don](https://github.com/Alb4don)
