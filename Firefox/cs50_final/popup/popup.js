const taskContainer = document.getElementById("task-container");
const addButton = document.getElementById("add");

// ----- Aufgaben aus Speicher laden -----
document.addEventListener("DOMContentLoaded", async () => {
  const result = await chrome.storage.local.get("tasks");
  const tasks = result.tasks || [];

  tasks.forEach((task) => {
    const taskRow = createTaskInput(task.text, task.time, task.id);
    taskContainer.appendChild(taskRow);
  });

  updateTimers(); // direkt beim Laden einmal die Timer aktualisieren
});

// ----- Neuen Task hinzufügen -----
addButton.addEventListener("click", async () => {
  const taskRow = createTaskInput("", "");
  taskContainer.appendChild(taskRow);
  saveTasks();
});

// ----- Task-Input-Feld erstellen -----
function createTaskInput(value, time, id) {
  const taskRow = document.createElement("div");
  taskRow.classList.add("task-row");
  taskRow.dataset.id = id || crypto.randomUUID();

  // Eingabefeld
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "new task";
  input.value = value;

  // Timerfeld
  const timer = document.createElement("input");
  timer.type = "time";
  timer.step = 1; // Sekunden erlauben
  timer.value = time || "00:00:00";

  // Start-/Pause-Button
  const staBtn = document.createElement("button");
  staBtn.textContent = "▶️";
  staBtn.classList.add("timer-btn", "start-btn");
  // Der Lauf-Status wird über dataset.running gehalten ("true"/"false")
  taskRow.dataset.running = taskRow.dataset.running || "false";

  staBtn.addEventListener("click", () => {
    const isRunning = taskRow.dataset.running === "true";
    const finished = taskRow.dataset.done;
    if (timer.value.trim() !== "00:00:00" && !isRunning) {
      start_timer(taskRow, timer);
      staBtn.textContent = "⏸️";
      taskRow.dataset.running = "true";
    } else if (isRunning) {
      paus_timer(taskRow);
      staBtn.textContent = "▶️";
      taskRow.dataset.running = "false";
    } else {
      alert("Pleas enter a time > 00:00:00!");
    }

    if (finished === "true") {
      taskRow.dataset.done = "false";
      check.src = chrome.runtime.getURL("picture/Wrong.jpg");
    }
  });

  // Clear-Button
  const clBtn = document.createElement("button");
  clBtn.textContent = "clear";
  clBtn.classList.add("timer-btn");
  clBtn.addEventListener("click", async () => {
    if (timer.value.trim() !== "00:00:00") {
      await delete_timer(taskRow);
      timer.value = "00:00:00";
      staBtn.textContent = "▶️";
      taskRow.dataset.running = "false";
      saveTasks();
    }
  });

  // Löschen-Button
  const delBtn = document.createElement("button");
  delBtn.textContent = "🗑️";
  delBtn.addEventListener("click", () => {
    delete_task(taskRow);
    taskRow.remove();
    saveTasks();
  });
  // img for done or not done
  taskRow.dataset.done = taskRow.dataset.done || "false";

  const check = document.createElement("img");
  check.classList.add("img");
  if (taskRow.dataset.done === "true") {
    check.src = chrome.runtime.getURL("picture/Right.jpg");
  }
  else {
    check.src = chrome.runtime.getURL("picture/Wrong.jpg");
  }

  // Änderungen speichern
  input.addEventListener("input", saveTasks);
  timer.addEventListener("input", saveTasks);

  taskRow.append(input, timer, staBtn, clBtn, delBtn, check);
  return taskRow;
}

// ----- Aufgaben speichern -----
async function saveTasks() {
  const rows = taskContainer.querySelectorAll(".task-row");
  const tasks = Array.from(rows).map((row) => {
    const [input, timer] = row.querySelectorAll("input");
    return { id: row.dataset.id, text: input.value, time: timer.value }; 
  });
  await chrome.storage.local.set({ tasks });
}

// ----- Timer starten -----
function start_timer(taskRow, timer) {
  const id = taskRow.dataset.id;
  const parts = (timer.value || "").split(":").map((x) => Number(x));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n) || n < 0)) {
    alert("Ungültige Zeit. Bitte HH:MM:SS eingeben.");
    return;
  }
  const [h, m, s] = parts;
  const totalSeconds = h * 3600 + m * 60 + s;
  if (totalSeconds <= 0) {
    alert("Bitte eine Zeit > 00:00:00 eingeben!");
    return;
  }

  chrome.runtime.sendMessage({
    type: "start_timer",
    id,
    duration: totalSeconds
  });
}

// ----- Timer pausieren -----
function paus_timer(taskRow) {
  const id = taskRow.dataset.id;
  chrome.runtime.sendMessage({
    type: "pause_timer",
    id
  });
}

// ----- Task löschen (inkl. Timer-Aufräumen) -----
function delete_task(taskRow) {
  const id = taskRow.dataset.id;
  chrome.runtime.sendMessage({
    type: "delete_task",
    id
  });
}

async function delete_timer(taskRow) {
  const id = taskRow.dataset.id;
  paus_timer(taskRow);
  await chrome.runtime.sendMessage({
      type: "delete_timer",
      id
    });
}

// ----- Timeranzeige aktualisieren -----
async function updateTimers() {
  const rows = document.querySelectorAll(".task-row");
  const data = await chrome.storage.local.get(["activeTasks", "pausedTasks", "tasks"]);
  const activeTasks = data.activeTasks || {};
  const pausedTasks = data.pausedTasks || {};
  const tasks = data.tasks || [];
  let saveNeeded = false;

  rows.forEach((row) => {
    const id = row.dataset.id;
    const timerInput = row.querySelector('input[type="time"]');
    const startBtn = row.querySelector('button.start-btn');
    const check = row.querySelector('img.img');
    const task = tasks.find((t) => t.id === id);

    if (pausedTasks[id] && pausedTasks[id].remaining !== undefined){
      const remaining = pausedTasks[id].remaining;
      const hh = String(Math.floor(remaining / 3600)).padStart(2, "0");
      const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
      const ss = String(remaining % 60).padStart(2, "0");
      timerInput.value = `${hh}:${mm}:${ss}`;
      // Pausiert => Play-Icon
      if (startBtn) {
        startBtn.textContent = "▶️";
      }
      row.dataset.running = "false";
    } else if (activeTasks[id] && activeTasks[id].endTime !== undefined ) {
      const remaining = Math.max(0, Math.floor((activeTasks[id].endTime - Date.now()) / 1000));
      const hh = String(Math.floor(remaining / 3600)).padStart(2, "0");
      const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
      const ss = String(remaining % 60).padStart(2, "0");
      timerInput.value = `${hh}:${mm}:${ss}`;

      // Läuft => Pause-Icon
      if (startBtn) {
        startBtn.textContent = "⏸️";
      }
      row.dataset.running = "true";

      // Wenn Timer abgelaufen ist:
      if (remaining === 0 || isNaN(remaining)) {
        delete activeTasks[id];
        if (task) {
          task.time = "00:00:00";
          saveNeeded = true;
          if (startBtn && startBtn.textContent === "⏸️") {
            startBtn.textContent = "▶️";
          }
          row.dataset.running = "false";

          row.dataset.done = "true";
          if (row.dataset.done === "true") {
            check.src = chrome.runtime.getURL("picture/Right.jpg");
          }
          else {
            check.src = chrome.runtime.getURL("picture/Wrong.jpg");
          }

          if (task.text.trim() === "") {
            alert(`Timer for task has finished!`);
          } else {
            alert(`Timer for task "${task.text}" has finished!`);
          }
        }
      }
    } else {
      // Kein Status => sicherstellen, dass Start-Icon gesetzt ist
      if (startBtn) {
        startBtn.textContent = "▶️";
      }
      row.dataset.running = "false";
      row.dataset.done = "true";
    }
  });

  if (saveNeeded) {
    await chrome.storage.local.set({ tasks, activeTasks });
  }
}
// Update-Timer jede Sekunde
setInterval(updateTimers, 1000);