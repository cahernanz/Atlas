// Copyright (C) 2016  Gherardo Varando (gherardo.varando@gmail.com)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

'use strict'

let t = new Date()
const {
  Menu,
  MenuItem,
  app
} = require('electron').remote
const isSecond = app.makeSingleInstance((argv, workingdir) => {
  if (argv.includes('--clean')) gui.workspace.newChecking()
  if (win) win.show()
})
if (isSecond) {
  app.quit()
}
const isDev = require('electron-is-dev')
const {
  TasksViewer,
  Gui,
  util
} = require(`electrongui`)

const {
  ipcRenderer
} = require('electron')
const MapExtension = require('mapextension')
const ImageJExtension = require('imagejextension')
const GmExtension = require('graphicsmagickextension')

let mainProc = require('electron').remote.require('process')
let isCleanW = mainProc.argv.includes('--clean')

let gui = new Gui({
  workspace: {
    clean: isCleanW
  }
})

//prevent app closing
document.addEventListener('dragover', function(event) {
  event.preventDefault()
  return false
}, false)

document.addEventListener('drop', function(event) {
  event.preventDefault()
  return false
}, false)
gui.win.setMaximizable(false) //work just in win and mac
if (isDev) {
  gui.addMenuItem(new MenuItem({
    label: "Dev",
    type: 'submenu',
    submenu: Menu.buildFromTemplate([{
      label: 'toggledevtools',
      click(item, focusedWindow) {
        if (focusedWindow) focusedWindow.webContents.toggleDevTools()
      }
    }])
  }))
}
gui.addMenuItem(new MenuItem({
  label: "File",
  type: "submenu",
  submenu: Menu.buildFromTemplate([{
      label: 'New Workspace',
      click: () => {
        gui.workspace.newChecking()
      }
    },
    {
      label: 'Open Workspace',
      click: () => {
        gui.workspace.loadChecking()
      }
    },
    {
      label: 'Save Workspace',
      click: () => {
        gui.workspace.save(gui.workspace.spaces.workspace.path)
      }
    },
    {
      label: 'Save Workspace as',
      click: () => {
        gui.workspace.save()
      }
    },
    {
      label: 'Quit',
      role: 'quit'
    }
  ])
}))

gui.header.actionsContainer.addButton({
  id: 'save',
  groupId: 'basetools',
  icon: 'fa fa-save',
  title: 'Save current workspace',
  action: () => {
    gui.workspace.save()
  }
})


gui.header.actionsContainer.addButton({
  id: 'load',
  groupId: 'basetools',
  icon: 'fa fa-folder-open-o',
  title: 'Load a workspace',
  action: () => {
    gui.workspace.loadChecking()
  }
})

gui.workspace.on('load', (e) => {
  gui.win.setTitle(`${gui.workspace.spaces.workspace.path}--${app.getName()}-v${app.getVersion()}`)
})
gui.workspace.on('save', (e) => {
  gui.win.setTitle(`${gui.workspace.spaces.workspace.path}--${app.getName()}-v${app.getVersion()}`)
})

gui.workspace.on('error', (e) => {
  gui.alerts.add(e.message, 'warning')
})

gui.extensions.activate()
let tasksViewer = new TasksViewer(gui)
let mapext = new MapExtension(gui)
tasksViewer.activate()
mapext.activate()
mapext.show()
let imgj = new ImageJExtension(gui)
imgj.activate()

gui.extensions.load('graphicsmagickextension')
gui.viewTrick()
let stat = 'default'
if (isDev) stat = 'warning'
gui.alerts.add(`App loaded in ${(new Date())-t} ms`, stat)
module.exports = gui
