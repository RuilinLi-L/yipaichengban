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

## [ERR-20260705-002] impeccable_cleanup_script_not_in_project

**Logged**: 2026-07-05T00:00:00+08:00
**Priority**: low
**Status**: pending
**Area**: frontend

### Summary
The Impeccable skill update cleanup command expected a project-local script that is not present in this workspace.

### Error
```text
Error: Cannot find module 'D:\文件\AIGC挑战赛\.codex\skills\impeccable\scripts\cleanup-deprecated.mjs'
```

### Context
- Command attempted: `node .codex/skills/impeccable/scripts/cleanup-deprecated.mjs`
- The active skill file lives under `C:\Users\RuilinLi\.codex\skills\impeccable`, not under the project `.codex` directory.

### Suggested Fix
When a skill maintenance command is relative to a missing project-local skill path, skip the cleanup or run the absolute skill script only with explicit approval if it needs to modify files outside the workspace.

### Metadata
- Reproducible: yes
- Related Files: C:/Users/RuilinLi/.codex/skills/impeccable/SKILL.md
- Tags: skills, impeccable, windows-path

---

## [ERR-20260705-001] powershell_variable_before_colon

**Logged**: 2026-07-05T00:00:00+08:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
PowerShell interpreted `$p:` inside a double-quoted status string as an invalid scoped variable reference.

### Error
```text
Variable reference is not valid. ':' was not followed by a valid variable name character.
Consider using ${} to delimit the name.
```

### Context
- Command attempted to scan APK-embedded `app-service.js` for multiple patterns.
- The failure happened in a string like `"--- $p: NOT FOUND ---"`.

### Suggested Fix
When interpolating a PowerShell variable immediately before a colon, use `${p}:` or format strings instead.

### Metadata
- Reproducible: yes
- Related Files: prototype-yipaichengban-uniapp/unpackage/release/apk/__UNI__E16DD23__20260705002230.apk
- Tags: powershell, apk-inspection

### Resolution
- **Resolved**: 2026-07-05T00:00:00+08:00
- **Notes**: Reran the scan with `${p}` in the status string.

---
## [ERR-20260510-001] docx_missing_builtin_table_style

**Logged**: 2026-05-10T01:18:42+08:00
**Priority**: low
**Status**: resolved
**Area**: docs

### Summary
A source DOCX did not contain the expected Word built-in Table Grid style, so assigning it with python-docx raised a KeyError.

### Error
`	ext
KeyError: "no style with name 'Table Grid'"
`

### Context
- Command attempted: run 	mp/complete_win_doc.py to insert a table into D:\QQDownload\win.docx.
- The document's available table styles only included Normal Table.

### Suggested Fix
When editing externally supplied DOCX files, do not assume built-in table styles exist. Either use an existing style such as Normal Table or set OOXML borders/shading directly.

### Metadata
- Reproducible: yes
- Related Files: tmp/complete_win_doc.py
- Tags: docx, python-docx, table-style

### Resolution
- **Resolved**: 2026-05-10T01:18:42+08:00
- **Notes**: Updated the script to draw table borders and shading directly instead of assigning Table Grid.

---

## [ERR-20260511-001] docx_render_tool_unavailable

**Logged**: 2026-05-11T12:58:00+08:00
**Priority**: medium
**Status**: pending
**Area**: docs

### Summary
DOCX visual rendering could not run in the current Windows desktop session because LibreOffice/soffice was missing and Microsoft Word COM could not start.

### Error
```text
render_docx.py: FileNotFoundError: [WinError 2] The system cannot find the file specified.
Word COM: HRESULT 0x80070520, specified logon session does not exist.
winget: specified logon session does not exist.
```

### Context
- Task attempted to render `docx_work/win_layout_polished.docx` with the bundled `render_docx.py`.
- `soffice`/LibreOffice was not installed or discoverable in PATH.
- Word COM and winget both failed under the current app/sandbox logon session, so installing or using Office as a renderer was not available.

### Suggested Fix
For future DOCX work in this Windows environment, either provide a workspace-local LibreOffice/soffice path before rendering or add a documented fallback that performs structural DOCX QA when no renderer can be started.

### Metadata
- Reproducible: unknown
- Related Files: docx_work/win_layout_polished.docx
- Tags: docx, rendering, libreoffice, word-com

---

## [ERR-20260511-002] powershell_piped_python_unicode_path

**Logged**: 2026-05-11T12:59:00+08:00
**Priority**: low
**Status**: resolved
**Area**: docs

### Summary
Inline Python code piped from Windows PowerShell mangled Chinese path literals into question marks, causing `python-docx` to report the DOCX package was missing.

### Error
```text
docx.opc.exceptions.PackageNotFoundError: Package not found at 'output/doc/win_?????.docx'
```

### Context
- The actual DOCX file existed and was valid.
- The failure happened only when the Chinese filename was embedded directly in Python source passed via a PowerShell here-string.
- Rewriting the check to locate the file with `Path('output/doc').glob('win_*.docx')` avoided the encoding-sensitive literal.

### Suggested Fix
When running piped Python from PowerShell in workspaces with Chinese paths, prefer ASCII-relative paths, command-line args, or directory globbing instead of embedding non-ASCII path literals in the piped source.

### Metadata
- Reproducible: yes
- Related Files: output/doc/win_排版完善版.docx
- Tags: powershell, python, unicode-path, docx

### Resolution
- **Resolved**: 2026-05-11T12:59:00+08:00
- **Notes**: Final content verification passed after locating the output file by glob instead of by a Chinese filename literal.

---

## [ERR-20260511-003] docx_table_index_signature_false_positive

**Logged**: 2026-05-11T13:17:00+08:00
**Priority**: low
**Status**: resolved
**Area**: docs

### Summary
A DOCX preservation check falsely reported that original table content was missing after inserting a new table before existing tables.

### Error
```text
RuntimeError: Existing content missing after insertion: ('t1r0c0', '产品类型')
```

### Context
- The document edit inserted a new flow table before the original comparison table.
- The verification signature included table indexes (`t1r0c0`), so the original table's content moved to a different table index and looked "missing" even though the text was preserved.

### Suggested Fix
For DOCX insertion checks, verify original paragraphs as an ordered subsequence and verify table cell text by content rather than by absolute table index when new tables may be added.

### Metadata
- Reproducible: yes
- Related Files: docx_work/add_initial_demo_section.py
- Tags: docx, qa, table-index

### Resolution
- **Resolved**: 2026-05-11T13:17:00+08:00
- **Notes**: Updated the script to check paragraph order separately and table cell text independent of table index.

---

## [ERR-20260511-004] windows_tempfile_cross_drive_replace

**Logged**: 2026-05-11T13:29:00+08:00
**Priority**: low
**Status**: resolved
**Area**: docs

### Summary
Replacing a DOCX with a temporary file failed on Windows because the temp file was created on C: while the target document was on D:.

### Error
```text
OSError: [WinError 17] The system cannot move the file to a different disk drive:
'C:\\Users\\RuilinLi\\AppData\\Local\\Temp\\tmp....docx' -> 'output\\doc\\win_字体统一黑色版.docx'
```

### Context
- A script rebuilt a DOCX zip into `NamedTemporaryFile()` and then called `Path.replace()` to overwrite the target.
- Windows cannot perform this replace operation across different drives.

### Suggested Fix
When rebuilding Office zip files on Windows, create the temporary output beside the target file, e.g. `PATH.with_name(PATH.stem + ".tmp.docx")`, then replace.

### Metadata
- Reproducible: yes
- Related Files: docx_work/force_ooxml_font_black.py
- Tags: windows, tempfile, docx, zip

### Resolution
- **Resolved**: 2026-05-11T13:29:00+08:00
- **Notes**: The script now writes the temporary DOCX in the target directory before replacing the final file.

---
## [ERR-20260701-001] docx_permission_denied_chinese_filename

**Logged**: 2026-07-01T00:00:00+08:00
**Priority**: low
**Status**: resolved
**Area**: docs

### Summary
Saving a newly generated DOCX to a Chinese filename failed with PermissionError even though the output directory was writable and no file was visible at that path.

### Error
```text
PermissionError: [Errno 13] Permission denied: 'D:\文件\AIGC挑战赛\output\doc\智存复赛四人团队分工与项目完善说明.docx'
```

### Context
- Command attempted: run `docx_work/build_zhicun_team_division_doc.py` with bundled Python.
- `output\doc` ACL allowed modify access and the target file did not appear in directory listing.
- This workspace has prior Windows DOCX/Chinese path friction.

### Suggested Fix
When generating DOCX files on Windows in this workspace, try the requested Chinese filename first, then fall back to an ASCII filename if `PermissionError` occurs. Validate and deliver the actual saved path.

### Metadata
- Reproducible: unknown
- Related Files: docx_work/build_zhicun_team_division_doc.py
- See Also: ERR-20260427-001, ERR-20260511-002

### Resolution
- **Resolved**: 2026-07-01T00:00:00+08:00
- **Notes**: Builder now falls back to `output/doc/zhicun_fusai_team_division.docx` if the preferred Chinese filename cannot be opened for writing.

---
