chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "playSound") {
    const audio = new Audio(chrome.runtime.getURL("sounds/ding_sound.mp3"));
    audio.play();
  }
});