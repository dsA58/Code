const taskContainer = document.getElementById("task-container");
const addButton = document.getElementById("add");

// load tawsk from storage
// the prototype with storage was all made with ai but i added new buttons and other stuff myself
//prototype -> input, timer
document.addEventListener("DOMContentLoaded", async () => {
  const result = await chrome.storage.local.get("tasks");
  const tasks = result.tasks || [];

  tasks.forEach((task) => {
    const taskRow = createTaskInput(task.text, task.time, task.id, task.done);
    taskContainer.appendChild(taskRow);
  });

  updateTimers(); // Update the timer immediately on load
});
//end ai
//add new task
addButton.addEventListener("click", async () => {
  const taskRow = createTaskInput("", "");
  taskContainer.appendChild(taskRow);
  saveTasks();
});

// crate task input row
function createTaskInput(value, time, id, done) {
  const taskRow = document.createElement("div");
  taskRow.classList.add("task-row");
  taskRow.dataset.id = id || crypto.randomUUID();

  // input feld
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "new task";
  input.value = value;

  // timer input feld
  const timer = document.createElement("input");
  timer.type = "time";
  timer.step = 1; // add seconds
  timer.value = time || "00:00:00";

  // start/pause button
  const staBtn = document.createElement("button");
  staBtn.textContent = "▶️";
  staBtn.classList.add("timer-btn", "start-btn");
  // keep track of running state
  taskRow.dataset.running = taskRow.dataset.running || "false";
  //Ai -> (timer.value.trim() !== "00:00:00" && !isRunning)
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
      alert("Please enter a time > 00:00:00!");
    }

    if (finished === "true") {
      taskRow.dataset.done = "false";
      check_done(taskRow);
    }
  });

  // Done-Button
  const clBtn = document.createElement("button");
  clBtn.textContent = "done";
  clBtn.classList.add("timer-btn");
  clBtn.addEventListener("click", async () => {
    if (timer.value.trim() !== "00:00:00") {
      await delete_timer(taskRow);
      timer.value = "00:00:00";
      staBtn.textContent = "▶️";
      taskRow.dataset.running = "false";

      taskRow.dataset.done = "true";
      check_done(taskRow);
      saveTasks();
    }
  });

  // delete button
  const delBtn = document.createElement("button");
  delBtn.textContent = "🗑️";
  delBtn.classList.add("delBtn");
  delBtn.addEventListener("click", () => {
    delete_task(taskRow);
    taskRow.remove();
    saveTasks();
  });
  // img for done or not done
  //ai
  taskRow.dataset.done = (done !== undefined ? String(done) : (taskRow.dataset.done || "false"));
  //end ai

  const check = document.createElement("img");
  check.classList.add("img");
  if (taskRow.dataset.done === "true") {
    check.src = chrome.runtime.getURL("picture/Right.jpg");
  } else {
    check.src = chrome.runtime.getURL("picture/Wrong.jpg");
  }

  //save on input change
  input.addEventListener("input", saveTasks);
  timer.addEventListener("input", saveTasks);

  taskRow.append(input, timer, staBtn, clBtn, delBtn, check);
  return taskRow;
}

// save tasks to storage
//ai (like i said before (not "done: is_done" this was made by me))
async function saveTasks() {
  const rows = taskContainer.querySelectorAll(".task-row");
  const tasks = Array.from(rows).map((row) => {
    const [input, timer] = row.querySelectorAll("input");
    const is_done = row.dataset.done;
    return { id: row.dataset.id, text: input.value, time: timer.value, done: is_done}; 
  });
  await chrome.storage.local.set({ tasks });
}
//end ai

// start timer
async function start_timer(taskRow, timer) {
  const id = taskRow.dataset.id;
  //ai
  const parts = (timer.value || "").split(":").map((x) => Number(x));
  //end ai
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

// pause timer
async function paus_timer(taskRow) {
  const id = taskRow.dataset.id;
  chrome.runtime.sendMessage({
    type: "pause_timer",
    id
  });
}

// delete task (row)
async function delete_task(taskRow) {
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

// update timers in the UI
// ai (i mad a prototype but it had many bugs and this is the fixed version with some of my own code)
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
    const task = tasks.find((t) => t.id === id);

    if (pausedTasks[id] && pausedTasks[id].remaining !== undefined){
      const remaining = pausedTasks[id].remaining;
      const hh = String(Math.floor(remaining / 3600)).padStart(2, "0");
      const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
      const ss = String(remaining % 60).padStart(2, "0");
      timerInput.value = `${hh}:${mm}:${ss}`;
      // pause => Play-Icon
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

      // running => Pause-Icon
      if (startBtn) {
        startBtn.textContent = "⏸️";
      }
      row.dataset.running = "true";

      // if timer is done
      if (remaining === 0 || isNaN(remaining)) {
        delete activeTasks[id];
        if (task) {
          task.time = "00:00:00";
          task.done = true;
          saveNeeded = true;
          if (startBtn && startBtn.textContent === "⏸️") {
            startBtn.textContent = "▶️";
          }
          row.dataset.running = "false";

          row.dataset.done = "true";
          check_done(row);
        }
      }
  } else {
      // no state => set icon to Play
      if (startBtn) {
        startBtn.textContent = "▶️";
      }
      row.dataset.running = "false";

      // Restore saved done state on load (default to false)
      if (task && typeof task.done !== "undefined") {
        row.dataset.done = String(task.done);
      } 
      check_done(row);
    }
  });

  if (saveNeeded) {
    await chrome.storage.local.set({ tasks, activeTasks });
  }
}
//end ai
function check_done(taskRow) {
  const check = taskRow.querySelector('img.img');
  if (taskRow.dataset.done === "true") {
    check.src = chrome.runtime.getURL("picture/Right.jpg");
  }
  else {
    check.src = chrome.runtime.getURL("picture/Wrong.jpg");
  }
}
// updat timers every second
setInterval(updateTimers, 1000);