let activeTasks = {};      // aktuell laufende Timer
let pausedTasks = {};      // pausierte Timer (restliche Sekunden)
let creating; // A global promise to avoid concurrency issues

let timer_exist = true;

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    const data = await chrome.storage.local.get(["activeTasks", "pausedTasks"]);
    activeTasks = data.activeTasks || {};
    pausedTasks = data.pausedTasks || {};

    if (msg.type === "start_timer") {
      const { id, duration } = msg;
      // Wenn Timer pausiert ist, weiter ab Restzeit
      let remainingSeconds = duration;
      if (pausedTasks[id]) {
        remainingSeconds = pausedTasks[id].remaining;
        delete pausedTasks[id];
      }
      const endTime = Date.now() + remainingSeconds * 1000;
      activeTasks[id] = { endTime };
      await chrome.storage.local.set({ activeTasks, pausedTasks });

      // Alarm setzen
      chrome.alarms.create(id, { when: endTime });
      sendResponse({ ok: true });
      return true; // async response
    }

    if (msg.type === "pause_timer") {
      const { id } = msg;

      if (activeTasks[id]) {
        const remaining = Math.max(0, Math.floor((activeTasks[id].endTime - Date.now()) / 1000));
        pausedTasks[id] = { remaining };
        console.log(pausedTasks[id]);
        delete activeTasks[id];

        await chrome.storage.local.set({ activeTasks, pausedTasks });
        chrome.alarms.clear(id);
      }

      sendResponse({ ok: true });
      return true; // async response
    }

    if (msg.type === "delete_task") {
      const { id } = msg;

      let changed = false;
      if (activeTasks[id]) {
        delete activeTasks[id];
        changed = true;
      }
      if (pausedTasks[id]) {
        delete pausedTasks[id];
        changed = true;
      }

      if (changed) {
        await chrome.storage.local.set({ activeTasks, pausedTasks });
      }
      chrome.alarms.clear(id);

      sendResponse({ ok: true });
      timer_exist = false;
      return true; // async response
    }


    if (msg.type === "delete_timer") {
      const { id } = msg;

      let changed = false;
      if (activeTasks[id]) {
        delete activeTasks[id];
        changed = true;
      }
      if (pausedTasks[id]) {
        delete pausedTasks[id];
        changed = true;
      }

      // Timer-Alarm löschen
      chrome.alarms.clear(id);

      // Tasks-Zeit auf 00:00:00 zurücksetzen
      try {
        const { tasks = [] } = await chrome.storage.local.get(["tasks"]);
        const idx = tasks.findIndex(t => t.id === id);
        if (idx !== -1) {
          tasks[idx].time = "00:00:00";
          playNotificationSound();
          await chrome.storage.local.set({ tasks });
        }
      } catch (e) {
        // ignore
      }

      if (changed) {
        await chrome.storage.local.set({ activeTasks, pausedTasks });
      }

      sendResponse({ ok: true });
      return true; // sendResponse async
      }
  });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const taskId = alarm.name;

  const data = await chrome.storage.local.get(["activeTasks", "pausedTasks"]);
  activeTasks = data.activeTasks || {};
  pausedTasks = data.pausedTasks || {};

  delete activeTasks[taskId];
  playNotificationSound();
  await chrome.storage.local.set({ activeTasks, pausedTasks });
});

async function playNotificationSound() {
  try {
    await setupOffscreenDocument('offscreen/offscreen.html');
    
    // Send message with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await chrome.runtime.sendMessage({ type: 'playSound' });
        break; // Success, exit loop
      } catch (error) {
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        } else {
          console.error('Failed to send message after retries:', error);
        }
      }
    }
    
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/house_48.png"),
      title: "Timer finished",
      message: `Timer has finished!`
    });
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  
  // Check if offscreen document already exists
  try {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) {
      return;
    }
  } catch (e) {
    // If getContexts fails, try to create anyway
  }

  // Create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Play notification sounds for timer completion',
    })
    .then(() => {
      creating = null;
      // Give the offscreen document time to initialize
      return new Promise(resolve => setTimeout(resolve, 100));
    })
    .catch((error) => {
      creating = null;
      // Document might already exist, ignore error
      if (!error.message.includes('Only a single offscreen')) {
        throw error;
      }
    });
    await creating;
  }
}

