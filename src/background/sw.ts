import type { PrRef } from '../types'

interface OpenSummaryMessage {
  type: 'OPEN_SUMMARY'
  pr: PrRef
}

chrome.runtime.onMessage.addListener(
  (message: OpenSummaryMessage, sender, sendResponse) => {
    if (message?.type === 'OPEN_SUMMARY') {
      const tabId = sender.tab?.id
      void chrome.storage.session.set({ activePr: message.pr })
      if (tabId != null) {
        void chrome.sidePanel.open({ tabId }).catch(() => {})
      }
      sendResponse({ ok: true })
    }
    return false
  },
)

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage()
})
