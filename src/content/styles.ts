export const CSS = `
#gh-prh-panel{--ac:#7c6cf5;position:fixed;right:18px;bottom:18px;z-index:2147483000;width:300px;display:flex;flex-direction:column;background:#13151c;color:#e6edf3;border:1px solid #2a2f3a;border-radius:12px;box-shadow:0 20px 48px -12px rgba(0,0,0,.78),0 0 0 1px rgba(0,0,0,.35);font-family:'Inter',ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:13px;overflow:hidden}
.gh-prh-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #21242c}
.gh-prh-logo{width:18px;height:18px;border-radius:6px;background:var(--ac);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.gh-prh-logo>i{width:8px;height:8px;border-radius:50%;border:2px solid #fff;display:block}
.gh-prh-title{font-weight:600;font-size:13px;flex:1;letter-spacing:-.01em}
.gh-prh-ai{display:flex;align-items:center;gap:5px;padding:4px 9px;border:1px solid color-mix(in srgb,var(--ac) 40%,transparent);background:color-mix(in srgb,var(--ac) 13%,transparent);color:var(--ac);border-radius:6px;font-size:11.5px;font-weight:500;cursor:pointer}
.gh-prh-ai:hover{background:color-mix(in srgb,var(--ac) 22%,transparent)}
.gh-prh-ai>i{width:5px;height:5px;border-radius:50%;background:var(--ac);display:block}
.gh-prh-collapse{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border:none;background:none;color:#8b949e;cursor:pointer;border-radius:6px}
.gh-prh-collapse:hover{background:#1b1f27;color:#e6edf3}
.gh-prh-collapse svg{display:block;transition:transform .16s}
#gh-prh-panel.gh-prh-collapsed .gh-prh-collapse svg{transform:rotate(-90deg)}
#gh-prh-panel.gh-prh-collapsed .gh-prh-list{display:none}
#gh-prh-panel.gh-prh-collapsed .gh-prh-progress{border-bottom:none}
.gh-prh-progress{padding:11px 12px;border-bottom:1px solid #191c22}
.gh-prh-progress-text{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.gh-prh-progress-text>span:first-child{font-size:12.5px;font-weight:500;color:#c9d1d9}
.gh-prh-pct{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;color:#8b949e}
.gh-prh-bar{height:6px;background:#21242c;border-radius:999px;overflow:hidden}
.gh-prh-bar>i{display:block;height:100%;width:0;border-radius:999px;background:var(--ac);transition:width .22s ease}
.gh-prh-list{max-height:236px;overflow-y:auto;padding:6px}
.gh-prh-item{display:flex;align-items:center;gap:9px;padding:7px 11px;border-radius:7px;cursor:pointer;transition:background .12s,opacity .12s}
.gh-prh-item:hover{background:#1b1f27}
.gh-prh-item.gh-prh-done{opacity:.55}
.gh-prh-box{flex-shrink:0;width:15px;height:15px;border-radius:4px;display:flex;align-items:center;justify-content:center;border:1.5px solid #48505b;background:transparent;transition:all .12s}
.gh-prh-item.gh-prh-done .gh-prh-box{border-color:var(--ac);background:var(--ac)}
.gh-prh-box svg{display:block;opacity:0;transition:opacity .12s}
.gh-prh-item.gh-prh-done .gh-prh-box svg{opacity:1}
.gh-prh-name{display:flex;align-items:center;min-width:0;flex:1;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:11.5px}
.gh-prh-dir{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0;color:#6e7681}
.gh-prh-base{flex-shrink:0;white-space:nowrap;color:#c9d1d9}
.gh-prh-item.gh-prh-done .gh-prh-dir,.gh-prh-item.gh-prh-done .gh-prh-base{text-decoration:line-through;color:#7d828c}
.gh-prh-stat{flex-shrink:0;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:11px;white-space:nowrap}
.gh-prh-add{color:#3fb950}
.gh-prh-del{color:#f85149}
.gh-prh-empty{padding:18px 12px 26px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;color:#8b949e;font-size:12.5px}
.gh-prh-spin{width:16px;height:16px;border:2px solid #2b2f37;border-top-color:var(--ac);border-radius:50%;animation:gh-prh-spin .7s linear infinite}
@keyframes gh-prh-spin{to{transform:rotate(360deg)}}
.gh-prh-seen{display:inline-flex;align-items:center;gap:5px;margin-left:8px;font-size:12px;color:#8b949e;cursor:pointer;user-select:none;vertical-align:middle}
.gh-prh-seen input{accent-color:#7c6cf5;cursor:pointer;margin:0}
`
