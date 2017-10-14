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
  Workspace,
  ExtensionsManager,
  TasksViewer,
  Gui,
  util
} = require(`electrongui`)

const {
  ipcRenderer
} = require('electron')
//const HelpExtension = require('helpextension')
const MapExtension = require('mapextension')
const ImageJExtension = require('imagejextension')
//const GM = require('graphicsmagickextension')
//const Shiny = require('rshinyextension')

let gui = new Gui()
let mainProc = require('electron').remote.require('process')
let isCleanW = mainProc.argv.includes('--clean')

//prevent app closing
document.addEventListener('dragover', function(event) {
  event.preventDefault()
  return false
}, false)

document.addEventListener('drop', function(event) {
  event.preventDefault()
  return false
}, false)
gui.startWaiting()
gui.win.setMaximizable(false) //work just in win and mac
if (isDev) {
  gui.addMenuItem(new MenuItem({
    label: "Dev",
    type: 'submenu',
    submenu: Menu.buildFromTemplate([{
      label: 'toggledevtools',
      role: "toggledevtools"
    }])
  }))
}
gui.addMenuItem(new MenuItem({
  label: "File",
  type: "submenu",
  submenu: Menu.buildFromTemplate([{
      label: 'New Workspace',
      click: () => {
        if (gui.workspace instanceof Workspace) {
          gui.workspace.newChecking()
        }
      }
    },
    {
      label: 'Open Workspace',
      click: () => {
        if (gui.workspace instanceof Workspace) {
          gui.workspace.loadChecking()
        }
      }
    },
    {
      label: 'Save Workspace',
      click: () => {
        if (gui.workspace instanceof Workspace) {
          gui.workspace.save(gui.workspace.spaces.workspace.path)
        }
      }
    },
    {
      label: 'Save Workspace as',
      click: () => {
        if (gui.workspace instanceof Workspace) {
          gui.workspace.save()
        }
      }
    },
    {
      label: 'Quit',
      role: 'quit'
    }
  ])
}))

gui.extensionsManager = new ExtensionsManager(gui)
gui.workspace = new Workspace(gui, {
  clean: isCleanW
})
//gui.helpExtension = new HelpExtension()
gui.tasksViewer = new TasksViewer(gui)
new MapExtension(gui)
//gui.helpExtension.activate()
gui.tasksViewer.activate()
gui.extensions.MapExtension.activate()
gui.extensions.MapExtension.show()
new ImageJExtension(gui)
gui.extensions.ImageJExtension.activate()
gui.stopWaiting()
gui.viewTrick()
gui.notify(`App loaded in ${(new Date())-t} ms`)
module.exports = gui
