import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'PR Lens',
  version: '1.0.0',
  description:
    'Track which files you have reviewed on a GitHub PR and get on-device AI summaries. Free, local, no API key required.',
  minimum_chrome_version: '138',
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  permissions: ['storage', 'sidePanel'],
  host_permissions: [
    'https://github.com/*',
    'https://api.github.com/*',
    'https://api.anthropic.com/*',
    'https://generativelanguage.googleapis.com/*',
    'https://huggingface.co/*',
    'https://*.huggingface.co/*',
    'https://*.hf.co/*',
    'https://raw.githubusercontent.com/*',
  ],
  content_security_policy: {
    extension_pages:
      "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
  },
  background: {
    service_worker: 'src/background/sw.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://github.com/*'],
      js: ['src/content/main.ts'],
      run_at: 'document_idle',
    },
  ],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  action: {
    default_title: 'PR Lens — settings',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
  },
})
