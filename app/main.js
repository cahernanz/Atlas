// Copyright (C) 2016  Gherardo Varando (gherardo.varando@gmail.com)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

const {
    fork,
    exec
} = require('child_process')
const {
    app,
    BrowserWindow,
    Tray,
    Menu,
    dialog
} = require('electron')
const path = require('path')
const {
    ipcMain
} = require('electron')


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let trayimg = `${__dirname}/icon.png`
if (process.platform === 'win32') {
    trayimg = `${__dirname}/icon.ico`
}




function createWindow() {

    let frame = true;
    if (process.platform === "linux" | process.platform === "darwin") {
        frame = true;
    }
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: frame,
        titleBarStyle: 'hidden',
        icon: `${__dirname}/icon.png`
    })

    // and load the index.html of the app.
    win.loadURL(`file://${__dirname}/index.html`)

    // Open the DevTools.
    //win.webContents.openDevTools()


    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}



app.commandLine.appendSwitch("disable-renderer-backgrounding");

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)



//Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createMainWindow()
    }
})

ipcMain.on("focusWindow", () => {
    win.focus();
})

ipcMain.on("openDevTools", () => {
    win.webContents.openDevTools()
})

ipcMain.on('setProgress', (event, arg) => {
    win.setProgressBar(arg.value);
});