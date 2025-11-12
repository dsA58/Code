let activeTasks = {};      // aktuell laufende Timer
let pausedTasks = {};      // pausierte Timer (restliche Sekunden)

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

function playNotificationSound() {
  const audio = new Audio(chrome.runtime.getURL("sounds/ding_sound.mp3"));
  audio.play();
}
