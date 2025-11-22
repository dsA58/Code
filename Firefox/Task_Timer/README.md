# Task Timer
### Video Demo:  <https://youtu.be/4nV8dGj5cmk>
### Description:

## Manifest:

In my project, Task Timer, the most important file is manifest.json. This file contains details of each task, such as "default_popup": "popup/popup.html". This means that the first pop-up shown is popup.html. I also obtained the necessary permissions in this file, such as alarms or offscreen.

## Popup

The second most important thing is probably the popup folder. This folder contains popup.html, which is the default and only popup, as well as popup.js, which contains the code needed by popup.html, and style. CSS is the file for the style of popup.html, as the name suggests.

### popup.html

Now, let's look at popup.html. There is not much code in popup.html because most of the buttons are created in popup.js. The only button is the one labelled “+ Add task”. The rest of popup.html is just some decorative text.

### popup.js

popup.js contains all the code required to save the inputs and add new buttons, as well as the code for updating the popup. Specifically, this involves updating the timer and status of the task (i.e. whether it is complete). All the code for updating the pop-up is in the “updateTimers” function.

#### updateTimers

>In this function, the program updates the timer if the current task is not paused. To do this, it goes through all the created buttons and, if any of them have a time and are not paused, it decrements the timer by one. If the timer reaches 00:00:00, the timer is deleted from storage and the time in the pop-up is set to 00:00:00 so that the user thinks the timer is still running. After that, it calls check_done to set the task stats for the user as 'done'. But how does the program get all of these boxes? This is simple: the function “createTaskInput” is called when the “+ Add task” button is pressed.


#### createTaskInput

>The createTaskInput function does exactly what it says: it creates a new task input. It creates a new row containing an input field for text and time, as well as buttons for starting, pausing and completing tasks, and a delete button for removing the row. It also creates an image showing whether a task is complete or not. Users can create as many rows as they want, as long as Chrome doesn't have a problem with it. This is useful if you want a timer for your lunch break so you don't miss it, as well as a timer for your work. This is also useful if you have a large task that you want to split into smaller tasks. With this add-on, you can track how many you have completed. It's also like a list of all the tasks you have to do.

#### SaveTasks

>This function saves all new input and any changes that occur before the task is complete or the timer is 1 second smaller than before (of course, this only happens when the timer stops or something similar; it is not triggered every second and is not included in updateTimers). It uses Chrome storage for the permissions granted in the manifest, but doesn't perform any actions independently. Some people find it easier to use the command "chrome.storage.local.set()" because they don't need to update everything manually.

### style.css

style.css is the last file in the popup folder and its job is to ensure that everything looks good using CSS. The task created by 'createTaskInput' is also included because all the added inputs and buttons either have a classList.add() or are called directly by their type (e.g. input).

### code.js

This file is in the content_script folder and is responsible for performing the actual calculations. This is also why the program works when the pop-up is closed: code.js is always running, unlike popup.js, which only runs when the pop-up is open. While popup.js ensures the popup is up to date, code.js ensures popup.js receives the correct time and information on existing tasks.

#### msg Message

>In popup.js, the program sometimes says 'chrome.runtime.sendMessage'. These messages are for code.js. For example, when popup.js sends the message 'start_timer', code.js becomes active. First, it checks what message was sent, and then it executes the appropriate code for 'start_timer'. This involves checking whether the timer is paused. If it is, it gets the remaining time and deletes the task for being paused. If it is not, it will simply use the time from the timer (the original time). It then calculates the time when the timer will finish and sets a Chrome alarm for that time.

#### Notification and Sound

>Notification and sound are also code. JS is the indirect reason for the notification from Chrome that is sent from the code. JS has a custom sound. The program sends a pop-up. It's a message. This message is called 'playSound'. This is for the code in the offscreen folder. It also makes sure that everything is correctly set up for playing the sound. This includes obtaining permission from Chrome to play a sound or create an element.

## Offscreen
### offscreen.html

offscreen.html has no actual code; it's just there to play the sound and the user never sees it. However, Chrome needs an HTML file for a background script.

### offscreen.js

The only thing that is done in offscreen.js is calling the audio.play() function. However, due to the extension, the code sometimes has trouble and fails to play the sound. Therefore, I needed to ensure that the audio was sufficiently loaded to enable the sound to play.