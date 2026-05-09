# Errors

## [ERR-20260427-001] docx_generation_windows_unicode_path

**Logged**: 2026-04-27T16:55:00+08:00
**Priority**: medium
**Status**: pending
**Area**: docs

### Summary
Generating and validating DOCX files from PowerShell here-strings can corrupt Chinese path literals when piped into Python.

### Error
```text
OSError: [Errno 22] Invalid argument: 'output\\doc\\AIGC????????????.docx'
zipfile.BadZipFile: File is not a zip file
```

### Context
- The workspace path and target filename contained Chinese characters.
- Inline Python via PowerShell pipeline saw Chinese filename literals as question marks.
- A generated Chinese-named DOCX was also temporarily locked by an Office background service (`~$...docx` lock file).

### Suggested Fix
Use a UTF-8 Python script file or ASCII output filename when creating DOCX files on Windows, then validate with `python-docx` using the ASCII path. Avoid parallel validation reads against the same DOCX.

### Metadata
- Reproducible: yes
- Related Files: output/doc/aigc_app_track_analysis_and_suggestions.docx
- Tags: windows, powershell, unicode, docx

---

## [ERR-20260507-001] vite_esbuild_spawn_eperm_windows_sandbox

**Logged**: 2026-05-07T16:28:00+08:00
**Priority**: medium
**Status**: pending
**Area**: frontend

### Summary
Vite/Vue verification failed because the Windows sandbox rejected spawning esbuild from `node_modules`.

### Error
```text
Error: spawn EPERM
at ensureServiceIsRunning (...\node_modules\esbuild\lib\main.js)
```

### Context
- Command attempted: `npm run prototype:build`
- Workspace path contains Chinese characters.
- `npm install` also failed on `esbuild@0.21.5 postinstall` until retried with `--ignore-scripts`.

### Suggested Fix
For quick prototypes in this workspace, prefer a no-build static H5 artifact or run package-manager/build steps from an ASCII path outside the sandbox. If using Vite here, test whether esbuild can be installed and spawned before committing to that toolchain.

### Metadata
- Reproducible: yes
- Related Files: prototype-yipaichengban/package.json
- Tags: windows, sandbox, vite, esbuild, frontend

---

## [ERR-20260509-001] shell_command_windows_sandbox_refresh

**Logged**: 2026-05-09T15:53:16+08:00
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
Some PowerShell commands in this Windows workspace fail before execution because the sandbox setup refresh exits with code 1.

### Error
```text
windows sandbox: setup refresh failed with status exit code: 1
```

### Context
- Commands attempted: `npm run build`, lightweight `node -e "import(...)"` checks.
- The same session could still run simple reads and `git status`, so the failure appears to be sandbox/tool setup rather than project syntax.
- Workspace path contains Chinese characters, matching prior Vite/esbuild verification friction.

### Suggested Fix
When build commands hit this setup-refresh failure, retry only once, then use non-build static checks where possible and report the verification limit. If recurring, run the project from an ASCII path or a less restrictive shell environment.

### Metadata
- Reproducible: unknown
- Related Files: prototype-yipaichengban/vite.config.js
- See Also: ERR-20260507-001

---

## [ERR-20260509-002] browser_plugin_timeout_resets_node_repl

**Logged**: 2026-05-09T15:58:32+08:00
**Priority**: medium
**Status**: pending
**Area**: frontend

### Summary
The in-app browser verification workflow timed out and reset the shared Node REPL session, stopping a Vite server that had been started there.

### Error
```text
js execution timed out; kernel reset, rerun your request
timed out awaiting tools/call after 120s
```

### Context
- The Vite dev server was started through the Node REPL because PowerShell `Start-Process` was blocked by policy.
- Browser setup/navigation to `http://127.0.0.1:5173/` timed out twice.
- After the timeout, the REPL reset and the local dev server was no longer reachable.

### Suggested Fix
For this workspace, verify Vite pages with the JS API build and direct HTTP fetch when the in-app browser setup hangs. If browser verification is required, start the dev server outside the same REPL session so a browser timeout cannot kill it.

### Metadata
- Reproducible: unknown
- Related Files: prototype-yipaichengban/src/App.vue
- See Also: ERR-20260509-001

---

## [ERR-20260509-003] vite_env_loaded_from_wrong_cwd

**Logged**: 2026-05-09T16:10:41+08:00
**Priority**: high
**Status**: resolved
**Area**: config

### Summary
The OpenAI proxy returned 503 because `vite.config.js` loaded `.env.local` from `process.cwd()` instead of the project directory.

### Error
```text
{"error":"OPENAI_API_KEY is not configured. Falling back to local mock on the client."}
```

### Context
- `.env.local` existed under `prototype-yipaichengban/`.
- Programmatic Vite startup from the workspace root made `process.cwd()` resolve to `D:\文件\AIGC挑战赛`.
- `loadEnv(mode, process.cwd(), '')` therefore missed the project env file.

### Suggested Fix
Use the config file location as the env directory, e.g. `fileURLToPath(new URL('.', import.meta.url))`, when Vite config may be loaded from outside the project root.

### Metadata
- Reproducible: yes
- Related Files: prototype-yipaichengban/vite.config.js
- See Also: ERR-20260509-001

### Resolution
- **Resolved**: 2026-05-09T16:12:00+08:00
- **Notes**: `vite.config.js` now loads env files from the config directory and falls back to `process.env` inside the API proxy.

---

## [ERR-20260509-004] powershell_iwr_utf8_mojibake

**Logged**: 2026-05-09T16:55:00+08:00
**Priority**: high
**Status**: resolved
**Area**: backend

### Summary
Chinese model output became mojibake after the Windows PowerShell API fallback decoded the HTTP response with the wrong encoding.

### Error
```text
ç³»ç»Ÿ... / å¾...
```

### Context
- The Node `fetch` path failed for the OpenAI-compatible proxy, so the project used a Windows PowerShell fallback.
- The fallback used `Invoke-WebRequest` and then read `$response.Content`.
- Windows PowerShell can decode response content incorrectly when charset handling is ambiguous, even when the API returned valid UTF-8 JSON.

### Suggested Fix
For PowerShell HTTP fallbacks that must preserve Chinese/UTF-8 text, read raw response bytes and decode with `[System.Text.Encoding]::UTF8.GetString(...)` instead of using `$response.Content`.

### Metadata
- Reproducible: yes
- Related Files: prototype-yipaichengban/server/openaiAnalysisPlugin.js
- See Also: ERR-20260509-002

### Resolution
- **Resolved**: 2026-05-09T16:57:00+08:00
- **Notes**: Replaced the fallback request with `WebClient.UploadData`, decoding success and error response streams from raw bytes as UTF-8.

---
