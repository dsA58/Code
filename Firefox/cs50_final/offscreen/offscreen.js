chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "playSound") {
    const audio = new Audio(chrome.runtime.getURL("sounds/ding_sound.mp3"));
    audio.play()
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('Audio playback failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});
