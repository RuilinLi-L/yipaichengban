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
