import React from 'react'

export default function App() {
  const pingBackground = async () => {
    // send message to background service worker
    chrome.runtime.sendMessage('ping', (resp) => {
      console.log('Bg responded', resp)
      alert(JSON.stringify(resp))
    })
  }

  return (
    <div style={{ width: 360, padding: 16, fontFamily: 'Inter, Arial' }}>
      <h2>OmniVision AI (Dev)</h2>
      <p>Popup prototype — Day 1</p>

      <button onClick={pingBackground} style={{ padding: '8px 12px' }}>
        Ping Background
      </button>

      <hr />
      <p style={{ fontSize: 12, color: '#666' }}>
        Use the extension to test popup <br/> (will build to popup.html)
      </p>
    </div>
  )
}