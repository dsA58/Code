let activeTasks = {};      // aktuell laufende Timer
let pausedTasks = {};      // pausierte Timer (restliche Sekunden)

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
    return true; // sendResponse async
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
    return true; // sendResponse async
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const taskId = alarm.name;

  const data = await chrome.storage.local.get(["activeTasks", "pausedTasks"]);
  activeTasks = data.activeTasks || {};
  pausedTasks = data.pausedTasks || {};

  delete activeTasks[taskId];
  await chrome.storage.local.set({ activeTasks, pausedTasks });
  // Popup update prüft dann automatisch, dass Timer auf 0 ist
});

