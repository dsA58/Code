chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "playSound") {
    const audio = new Audio(chrome.runtime.getURL("sounds/ding_sound.mp3"));

    let responded = false;
    const safeRespond = (payload) => {
      if (responded) return;
      responded = true;
      try {
        sendResponse(payload);
      } catch (e) {
        // ignore sendResponse errors
      }
    };

    const playAudio = () => {
      audio.play()
        .then(() => {
          safeRespond({ success: true });
        })
        .catch((error) => {
          console.error('Audio playback failed:', error);
          safeRespond({ success: false, error: error.message });
        });
    };

    // If audio is already sufficiently loaded, try to play immediately
    if (audio.readyState >= 3) {
      playAudio();
    } else {
      // Wait until it should be playable
      audio.addEventListener('canplaythrough', () => {
        playAudio();
      }, { once: true });

      // If loading fails, report failure
      audio.addEventListener('error', (event) => {
        const error = audio.error;
        console.error('Audio error event:', error || event);
        safeRespond({ success: false, error: error?.message || 'Audio error' });
      }, { once: true });

      // Fallback timeout: if nothing happens for a while, treat as failure
      setTimeout(() => {
        if (!responded) {
          console.error('Audio load timeout');
          safeRespond({ success: false, error: 'Audio load timeout' });
        }
      }, 5000);
    }

    return true; // Keep channel open for async response
  }
});
