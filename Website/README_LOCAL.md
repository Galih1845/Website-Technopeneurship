Local run & test (concise)

Follow these exact PowerShell commands while in `C:\Website`.

1) Check Node/npm are installed

```powershell
node -v
npm -v
```

If these commands return errors, on Windows install Node.js LTS with winget (recommended) or download the installer:

```powershell
winget install OpenJS.NodeJS.LTS -s msstore
```

Or download: https://nodejs.org/

2) Install dependencies and start server

```powershell
cd C:\Website
npm install
npm start
# OR (if you prefer)
# node server.js
```

3) Quick checks (new PowerShell window)

```powershell
# Check server is listening
Invoke-WebRequest -Uri http://localhost:3000/api/_debug/users -UseBasicParsing -TimeoutSec 10 | Select-Object -ExpandProperty Content

# Request homepage
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 10 | Select-Object -ExpandProperty StatusCode
```

4) Optional: expose via ngrok for external testing

Download ngrok, then run:

```powershell
ngrok http 3000
```

Copy the https ngrok URL and use it as `API_BASE` in `script.js` (or open the public URL in a browser).

Notes:
- `robots.txt` is present and permissive; `Index.html` currently has no `noindex` meta tag.
- If `npm` is not recognized, install Node.js first and retry `npm install`.
