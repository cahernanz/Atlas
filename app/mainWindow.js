// Copyright (c) 2016 Gherardo Varando
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

'use strict';

let t = new Date();

const isDev = require('electron-is-dev');
const {
    gui,
    Workspace,
    ExtensionsManager,
    TasksViewer
} = require(`electrongui`);
const {
    Menu,
    MenuItem
} = require('electron').remote;
const HelpExtension = require('helpextension');
const MapExtension = require('mapextension');
const ImageJ = require('imagejextension');
const GM = require('graphicsmagickextension');
const Shiny = require('rshinyextension');

//prevent app closing
document.addEventListener('dragover', function(event) {
    event.preventDefault();
    return false;
}, false);

document.addEventListener('drop', function(event) {
    event.preventDefault();
    return false;
}, false);
gui.startWaiting();
if (isDev) {
    gui.addMenuItem(new MenuItem({
        label: "Dev",
        type: 'submenu',
        submenu: Menu.buildFromTemplate([{
            label: 'toggledevtools',
            role: "toggledevtools"
        }])
    }));
}
gui.addMenuItem(new MenuItem({
    label: "File",
    type: "submenu",
    submenu: Menu.buildFromTemplate([{
            label: 'New Workspace',
            click: () => {
                if (gui.workspace instanceof Workspace) {
                    gui.workspace.newChecking();
                }
            }
        },
        {
            label: 'Open Workspace',
            click: () => {
                if (gui.workspace instanceof Workspace) {
                    gui.workspace.loadChecking();
                }
            }
        },
        {
            label: 'Save Workspace',
            click: () => {
                if (gui.workspace instanceof Workspace) {
                    gui.workspace.save(gui.workspace.spaces.workspace.path);
                }
            }
        },
        {
            label: 'Save Workspace as',
            click: () => {
                if (gui.workspace instanceof Workspace) {
                    gui.workspace.save();
                }
            }
        },
        {
            label: 'Quit',
            role: 'quit'
        }
    ])
}));

gui.extensionsManager = new ExtensionsManager();
gui.workspace = new Workspace();
gui.helpExtension = new HelpExtension();
gui.tasksViewer = new TasksViewer();
gui.mapExtension = new MapExtension();
new Shiny();
new GM();
gui.helpExtension.activate();
gui.tasksViewer.activate();
gui.mapExtension.activate();
gui.mapExtension.show();
new ImageJ().activate();
gui.stopWaiting();
gui.viewTrick();
gui.notify(`App loaded in ${(new Date())-t} ms`);
module.exports = gui;
