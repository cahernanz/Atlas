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
                    gui.workspace.save(this.spaces.workspace.path);
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
