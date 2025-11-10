# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

These commands use Mozilla’s web-ext CLI. If not installed, run one of:
- npm i -g web-ext
- npx web-ext@latest <command>

Common tasks (from the repo root):
- Run the extension in Firefox with live reload:
  - npx web-ext run --source-dir .
- Lint the extension (manifest, permissions, basic issues):
  - npx web-ext lint --source-dir .
- Build a signed .zip for distribution (outputs to dist/):
  - npx web-ext build --source-dir . --artifacts-dir dist
- Manual load (no CLI):
  - Navigate to about:debugging#/runtime/this-firefox in Firefox → Load Temporary Add-on… → select manifest.json.

Tests: none are configured in this repository.

## High-level architecture

This is a WebExtension (Manifest V3) for Firefox that provides a task list with per-task countdown timers in the browser action popup.

Key pieces and responsibilities:
- Manifest (manifest.json)
  - manifest_version: 3
  - action: popup at popup/popup.html with default icon
  - background service worker: content_script/code.js
  - permissions: storage, alarms (tabs is declared but not used in code)
- Background service worker (content_script/code.js)
  - Persists and manages two maps in chrome.storage.local:
    - activeTasks: { [taskId]: { endTime: number (ms since epoch) } }
    - pausedTasks: { [taskId]: { remaining: number (seconds) } }
  - Listens for messages from the popup:
    - start_timer: schedules a chrome.alarms entry named by taskId to fire at endTime; resumes from pausedTasks when present.
    - pause_timer: captures remaining seconds into pausedTasks and clears the alarm.
  - Handles chrome.alarms.onAlarm to clear finished timers from activeTasks.
- Popup UI (popup/popup.html, popup/popup.js, popup/style.css)
  - Renders a list of tasks; each row has:
    - Text input, time input (HH:MM:SS), ▶️ start, ⏸️ pause, 🗑️ delete.
  - Data model stored in chrome.storage.local:
    - tasks: Array<{ id: string, text: string, time: "HH:MM:SS" }>
  - On load, populates rows from tasks and starts a 1s interval (updateTimers) to:
    - Read activeTasks, pausedTasks, tasks from storage.
    - For active tasks, compute remaining from endTime and update the time input; when remaining hits 0, reset the task’s time to 00:00:00 and remove from activeTasks.
    - For paused tasks, display the stored remaining value.
  - Sends messages to the background to start or pause timers; task IDs are stable (crypto.randomUUID). 

Data flow overview:
- User edits popup → saveTasks writes tasks[] to storage.
- Start ▶️ → popup sends start_timer(id, duration) → background writes activeTasks[id] with endTime and creates an alarm.
- Pause ⏸️ → popup sends pause_timer(id) → background snapshots remaining into pausedTasks[id] and clears the alarm.
- Every second → popup.updateTimers reads storage and updates displayed HH:MM:SS.
- Alarm fires → background removes activeTasks[taskId]; popup detects remaining === 0 and normalizes the UI/state on next tick.

Notes for future changes:
- In pause_timer, the code currently does not delete activeTasks[id] (line marked with //delete activeTasks[id];). Because popup.updateTimers checks activeTasks before pausedTasks, leaving activeTasks populated may cause the paused state to be ignored in the UI. If pausing should immediately reflect a frozen countdown, consider removing activeTasks[id] when pausing.
