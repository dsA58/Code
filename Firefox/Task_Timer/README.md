# YOUR PROJECT TITLE
### Video Demo:  <https://youtu.be/4nV8dGj5cmk>
### Description:
## manifest

In my project Task Timer, the most important file is manifest.json. In this file everything is given a task, like "default_popup": "popup/popup.html". This means that the popup that is shown first is popup.html. In this file I also got the permissions that I need, like alarms or offscreen.

## popup

The probably second most important thing is the popup folder. In this folder are popup.html, which is, like I say, the default and also the only popup; popup.js, which is the file for the code that popup.html needs; and style. CSS, as the name says, is the file for the style of popup.html.

### popup.html

Now to popup.html. In popup.html there is not much code because most buttons are created in popup.js; that’s why the only button is the button called “+ Add task.” The rest in popup.html is only some decorative text.

### popup.js

In popup.js is basically all of the code to save the inputs and add new buttons; also there is the code for updating the popup, to be specific the timer and status of the task (is it done or not). All the things for updating the popup are in the function “updateTimers.”

#### updateTimers

>In this function the program aktualisiert the timer if the current task is not paused. To check that, it goes through all rows of buttons that were created, and if any of them has a time and is not paused, it makes the timer go down by one. And if the timer hits 00:00:00, it deletes the timer in the storage and sets the time in the popup to 00:00:00, so the user thinks the timer still exists. After that it calls check_done to set the stats for the task for the user to done. But how does the program get all of these boxes? That is simple with the function “createTaskInput” that is called when the button “+ Add task” gets pressed.

#### createTaskInput

>The function createTaskInput does the thing that it says: it creates a new task input. But actually it creates a new row with the input field for the text and time but also many buttons, like the start and pause buttons and also the done button, which clears the time, and a delete button, which deletes the row. And at least it creates an image where the user can see if a task is done or not done. The user can create as many rows as he wants, as long as Chrome doesn’t have a problem with it. This is useful if, for example, you want a timer for when the lunch break is so you don’t miss it and, at the same time, a timer for your work. Another case where this is useful is if you have a bigger task and want to split it into many small tasks. With this add-on you can track how many you have done. It is also like a list for all tasks that you have to do.

#### saveTasks

>This function has the task of saving all of the new input, and any changes that come by the time that the task is done or the timer is now 1 second smaller than before (of course, only when the timer stops or something like that; it is not triggered every second, and it is also not in updateTimers). It uses the Chrome storage for what the program got permission for in the manifest, but it doesn’t do anything by itself. For some it is easier to say “chrome.storage.local.set(…)” because you don’t need to always update everything.

### style.css

style.css is the last file in the folder popup, and its task is to make sure that everything looks good by using CSS. The task created by “createTaskInput” is also included because all of the added inputs and buttons have classList.add(…) or are directly called by their type (like input).

### code.js

This file is in the content_script folder. code.js is for doing the real calculation and is also the reason why the program works when the popup is closed, because code.js is always running, not like popup.js, which is only running when the popup is opened. While the popup.js task is to make sure the popup is up to date, code.js is making sure that popup.js gets the right time and also the information on which tasks exist.

#### msg Message
>In popup.js the program sometimes says “chrome.runtime.sendMessage.” These messages are for code.js, for example, when popup.js sends the message “start_timer.” code.js is getting active. It first checks what message was sent; after that, it executes the appropriate code for “start_timer.” That would be checking if the timer is paused or not. If it is paused, it will get the remaining time and delete the task for being paused. If it is not paused, it will just use the time from the timer (the original time). After that, it will calculate the time when the timer finishes and set a Chrome alarm for the calculated time.

#### notification and sound
>Also is code. JS is the indirect reason for the notification from Chrome that is sent from code. JS has a custom sound. The program sends a popup. It's a message. This message is called playSound. This is for code, in the folder offscreen. Also, it makes sure that everything is correctly set up for playing the sound. That includes getting the permission from Chrome to play a sound/create an element.

## offscreen
### offscreen.html

offscreen.html basically has no code because it is just there for playing the sound, and the user also never sees it, but Chrome needs an HTML file for a background script.

### offscreen.js

In offscreen.js the only thing that is done is saying audio.play(), but due to the extension the code sometimes has trouble and fails to play the sound. So I needed to make sure that it always plays, so I had to make sure that the audio was sufficiently loaded so that the sound could play.