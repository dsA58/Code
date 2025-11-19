# YOUR PROJECT TITLE
### Video Demo:  <https://youtu.be/4nV8dGj5cmk>
### Description:
## manifest
In my project Task Timer the most important file id manifest.json in this file everything is given a Task like: "default_popup": "popup/popup.html" this means that the popup that is shown first is popup.html in this file i also got the permissons that i need like : alarms or offscreen
## popup
The propaly second most important thing is the popup folder in thid folder are : popup.html, waht is like i say the deffalt and also only popup, popup.js, this file is for the code that popup.html needs and style.css, waht is like the name says the file for the style off popup.html.
### popup.html
Now to popup.html. In popup.html is not much code because the most buttons are created in popup.js, thats why the only button is the button called "+ Add task" the rest in popup.html  is only some decorativ text.
### popup.js
In popup.js is basicl all off the code to save the inputs and add new buttons, also id there the code for updating the popup, to be specific the timer and status of the task (is it done or not).All the things for updating the popup is in the function "updateTimers" .
#### updateTimers
In this function the programm akktualsiert the timer if the current task is not paused to check that it goes throw all rows off buttons thath were created and if any of them as a time and is not paused it makes the timer go down by one and if the timer hits 00:00:00 it deleats the timer in the storage and sets the time in the popup to 00:00:00 so the user things the timer still exists after that it calls check_done to set the stats for the task fot the user to done also it , but how does the progaramm get all of these boxes and that is simple with the function "createTaskInput" that is called when the button "+ Add task" gets pressed.
#### createTaskInput
The function createTaskInput does the thing that it says it creats a new task input but acctuly it creats a new row with the input field for the text and time but also many buttons like the start- and pausebutton alos the done button which clears the time and a delete button which deleats the row and at least it creats an img wehere the user can see if a task is done or not done the user can creat as many rows as he wants, as long chrome doesn't have a porblem with it, this is usefull if you for example want a timer when the lunch break is so you don't miss it and at the same time a timer your work a other case where this is usfull is if you have a bigger task and want to split it in many small tasks with this addon you can track how many you have done it is also like a list for all task that you have to do.
