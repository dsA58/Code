# Task Timer
### Video Demo:  <https://youtu.be/4nV8dGj5cmk>
### Description:

## Manifest:

In my project, Task Timer, the most important file is `manifest.json`. This file contains details of the extension, such as `"default_popup": "popup/popup.html"`. This means that the first pop-up shown is `popup.html`. I also obtained the necessary permissions in this file, such as `alarms`, `offscreen`, `notifications` and `storage`.

## Popup

The second most important thing is probably the `popup` folder. This folder contains `popup.html`, which is the default and only popup, as well as `popup.js`, which contains the code needed by `popup.html`, and `style.css`. `style.css` is the file for the style of `popup.html`, as the name suggests.

### popup.html

Now, let's look at `popup.html`. There is not much code in `popup.html` because most of the buttons are created in `popup.js`. The only button is the one labelled “+ Add task”. The rest of `popup.html` is just some decorative text. One important thing to say is that everything in `<main>` is in a container (`id="task-container"`).

### popup.js

`popup.js` contains all the code required to save the inputs and add new buttons, as well as the code for updating the popup. Specifically, this involves updating the timer and status of the task (i.e. whether it is complete). All the code for updating the popup is in the `updateTimers` function.

#### updateTimers

> In this function, the program updates the timers by reading the time from `activeTasks`, `pausedTasks` and `tasks` from `chrome.storage.local`. Then, for each row, it checks if the task is paused. If it is, the time is set to the remaining seconds from `pausedTasks[id]`. If it is not paused, it computes the new remaining time and sets the timer to it.  
> When the timer finishes, it will be deleted from `activeTasks`, the visible time is set to `00:00:00`, and the task is marked as done. After that, it calls `check_done` to set the task status for the user as “done”.

How does the program get all of these boxes? This is simple: the function `createTaskInput` is called when the “+ Add task” button is pressed.

#### createTaskInput

> The `createTaskInput` function does exactly what it says: it creates a new task input. It creates a new row containing an input field for text and time, as well as buttons for starting, pausing and completing tasks, and a delete button for removing the row. It also creates an image showing whether a task is complete or not. Users can create as many rows as they want, as long as Chrome doesn't have a problem with it. This is useful if you want a timer for your lunch break so you don't miss it, as well as a timer for your work. This is also useful if you have a large task that you want to split into smaller tasks. With this add-on, you can track how many you have completed. It's also like a list of all the tasks you have to do.

#### SaveTasks

> This function just collects the information about text, time and done from each row and saves them with an id in Chrome storage. It is always called when something in the number of rows changes, when something is done, or when the text or time changes.

### style.css

`style.css` is the last file in the popup folder and its job is to ensure that everything looks good using CSS. The tasks created by `createTaskInput` are also included because all the added inputs and buttons either have a `classList.add()` or are styled directly by their type (e.g. `input`).

### code.js

This file is in the `content_script` folder (it is a background service worker) and is responsible for performing the actual calculations. This is also why the program works when the pop-up is closed: `code.js` runs in the background, unlike `popup.js`, which only runs when the pop-up is open. While `popup.js` ensures the popup is up to date, `code.js` ensures `popup.js` receives the correct time and information on existing tasks.

#### msg Message

> In `popup.js`, the program sometimes calls `chrome.runtime.sendMessage`. These messages are for `code.js`. For example, when `popup.js` sends the message `"start_timer"`, `code.js` becomes active. First, it checks what message was sent and then it executes the appropriate code for that message. For example, if the message was `"start_timer"`, the code checks whether the timer is paused or not. If it is, it gets the remaining time and deletes the paused entry. If it is not, it will simply use the time from the timer (the original time). It then calculates the time when the timer will finish and sets a Chrome alarm for that time.

#### Notification and Sound

> The sound and notification are mostly handled by `code.js` and `offscreen.js`. When the timer reaches `00:00:00`, `code.js` calls `playNotificationSound()`. This function first makes sure `offscreen.html` exists, then it sends a message `"playSound"`, which is handled by `offscreen.js`. After `offscreen.js` sends a successful response, `code.js` sends a Chrome notification.

## Offscreen

### offscreen.html

`offscreen.html` has no actual visible code; it's just there to play the sound and the user never sees it, because Chrome requires an HTML document to host the offscreen script. Also notable is that this file is created (as an offscreen document) from `code.js`.

### offscreen.js

`offscreen.js` listens for the `"playSound"` message from `code.js`. When it receives this message, it creates an `Audio` object and calls `audio.play()`. However, due to the extension environment, the code sometimes has trouble and fails to play the sound. Therefore, it makes sure that the audio is sufficiently loaded before playing. When that is done, it reports back to `code.js` with success or failure.