let activeTasks = {};      // runnig timer
let pausedTasks = {};      // paused timer
let creating; // A global promise to avoid concurrency issues

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    const data = await chrome.storage.local.get(["activeTasks", "pausedTasks"]);
    activeTasks = data.activeTasks || {};
    pausedTasks = data.pausedTasks || {};

    if (msg.type === "start_timer") {
      const { id, duration } = msg;
      // if timer is paused, resume from remaining time
      let remainingSeconds = duration;
      if (pausedTasks[id]) {
        remainingSeconds = pausedTasks[id].remaining;
        delete pausedTasks[id];
      }
      const endTime = Date.now() + remainingSeconds * 1000;
      activeTasks[id] = { endTime };
      await chrome.storage.local.set({ activeTasks, pausedTasks });

      // set alarm
      chrome.alarms.create(id, { when: endTime });
      sendResponse({ ok: true });
      return true; // async response
    }

    if (msg.type === "pause_timer") {
      const { id } = msg;

      if (activeTasks[id]) {
        const remaining = Math.max(0, Math.floor((activeTasks[id].endTime - Date.now()) / 1000));
        pausedTasks[id] = { remaining };
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

      // delete alarm
      chrome.alarms.clear(id);

      // set Tasks-Zeit -> 00:00:00
      try {
        const { tasks = [] } = await chrome.storage.local.get(["tasks"]);
        const idx = tasks.findIndex(t => t.id === id);
        if (idx !== -1) {
          tasks[idx].time = "00:00:00";
          playNotificationSound(tasks[idx]?.text || "");
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
// when alarm == 0
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const taskId = alarm.name;
  const data = await chrome.storage.local.get(["activeTasks", "pausedTasks", "tasks"]);
  activeTasks = data.activeTasks || {};
  pausedTasks = data.pausedTasks || {};
  const tasks = data.tasks || [];

  // Clear from active tasks
  delete activeTasks[taskId];

  // Mark the task as done and reset time in persistent storage
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    tasks[idx].time = "00:00:00";
    tasks[idx].done = true;
  }

  // Persist changes so UI reflects done state next time popup opens
  await chrome.storage.local.set({ activeTasks, pausedTasks, tasks });

  // Notify user (sound + notification)
  playNotificationSound(tasks[idx]?.text || "");
});

async function playNotificationSound(task) {
  try {
    await setupOffscreenDocument('offscreen/offscreen.html');
    
    // Wait for sound to play successfully
    const response = await chrome.runtime.sendMessage({ type: 'playSound' });
    
    if (response?.success) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icons/house_48.png"),
        title: "Timer finished",
        message: `Timer  "${task}" has finished!`
      });
    }
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
      // Give the offscreen document time to fully initialize on first creation
      return new Promise(resolve => setTimeout(resolve, 300));
    })
    .catch((error) => {
      creating = null;
      // Document might already exist, ignore error
      if (!error.message.includes('Only a single offscreen')) {
        throw error;
      }
    })
    .finally(() => {
      creating = null;
    });
    await creating;
  }
}

