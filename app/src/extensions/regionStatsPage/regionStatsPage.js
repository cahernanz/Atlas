/**
 * @author : Mario Juez (mario@mjuez.com)
 *
 * @license: GPL v3
 *     This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const Workspace = require('Workspace');
const Sidebar = require('Sidebar');
const GuiExtension = require('GuiExtension');
const ToggleElement = require('ToggleElement');
const Table = require('Table');

const icon = "fa fa-area-chart";
const toggleButtonId = 'regionStatsPageToggleButton';

const columnsFormat = {
    1 : {
        base_column : "region",
        column_name : "Region"
    },
    2 : {
        base_column : "Centroids DAPI Alg",
        column_name : "Centroids DAPI (alg)"
    },
    3 : {
        base_column : "Centroids GAD alg",
        column_name : "Centroids GAD (alg)"
    },
    4 : {
        base_column : "centroid GAD manual",
        column_name : "Centroids GAD (man)"
    },
    5 : {
        base_column : "Centroids NeuN alg",
        column_name : "Centroids NeuN (alg)"
    },
    6 : {
        base_column : "area_cal",
        column_name : "Area (cal)"
    },
    7 : {
        base_column : "area_cal density Centroids DAPI Alg",
        column_name : "Area (cal) dens. cent. DAPI (alg)"
    },
    8 : {
        base_column : "area_cal density Centroids GAD alg",
        column_name : "Area (cal) dens. cent. GAD (alg)"
    },
    9 : {
        base_column : "area_cal density centroid GAD manual",
        column_name : "Area (cal) dens. cent. GAD (man)"
    },
    10 : {
        base_column : "area_cal density Centroids NeuN alg",
        column_name : "Area (cal) dens. cent. NeuN (alg)"
    },
    11 : {
        base_column : "area_px",
        column_name : "Area (px)"
    },
    12 : {
        base_column : "volume_cal",
        column_name : "Volume (cal)"
    },
    13 : {
        base_column : "volume_cal density Centroids DAPI Alg",
        column_name : "Volume (cal) dens. cent. DAPI (alg)"
    },
    14 : {
        base_column : "volume_cal density Centroids GAD alg",
        column_name : "Volume (cal) dens. cent. GAD (alg)"
    },
    15 : {
        base_column : "volume_cal density centroid GAD manual",
        column_name : "Volume (cal) dens. cent. DAPI (man)"
    },
    16 : {
        base_column : "volume_cal density Centroids NeuN alg",
        column_name : "Volume (cal) dens. cent. NeuN (alg)"
    },
};

class regionStatsPage extends GuiExtension {

    constructor(gui) {
        super(gui);
        this.icon = icon + " fa-2x";
    }

    activate() {
        super.activate();

        this.addToggleButton({
            id: toggleButtonId,
            buttonsContainer: this.gui.header.actionsContainer,
            icon: icon,
            groupId: "mapPage"
        });

        this.addSidebar();
        this.addPane();
        this.element.appendChild(this.pane.element);
    }

    deactivate() {
        this.sidebar.remove();
        this.element.removeChild(this.pane.element);
        this.removeToggleButton(toggleButtonId);
        super.deactivate();
    }

    show() {
        super.show();
        this.cleanPane();
        this.sidebar.list.clean();
        this.loadWorkspaceData();
    }

    addSidebar() {
        this.sidebar = new Sidebar(this.element); //appendChild (?)
        this.sidebar.addList();
        this.sidebar.list.addSearch({
            placeholder: "Search maps"
        });
        this.sidebar.show();
    }

    addPane() {
        this.pane = new ToggleElement(document.createElement('DIV'));
        this.pane.element.className = 'pane';
        this.pane.show();
    }

    loadWorkspaceData() {
        if (this.gui.workspace.spaces.mapPage) {
            var maps = this.gui.workspace.spaces.mapPage;

            Object.keys(maps).map((key) => {
                let map = maps[key];
                this.addMapToSidebar(map);
            });
        }
    }

    addMapToSidebar(map) {
        let title = document.createElement('STRONG');
        title.innerHTML = map.name;

        let body = new ToggleElement(document.createElement('DIV'));

        this.sidebar.addItem({
            id: `${map.id}`,
            title: title,
            body: body,
            toggle: true,
            onclick: {
                active: () => {
                    this.showRegionsStats(map);
                },
                deactive: () => {
                    this.cleanPane();
                }
            }
        });
    }

    showRegionsStats(map) {
        if (map.layers.drawnPolygons) {
            var polygons = map.layers.drawnPolygons.polygons;
            var table = new Table();
            Object.keys(polygons).map((key) => {
                if(polygons[key].stats){
                    let row = polygons[key].stats;
                    row["region"] = polygons[key].name;
                    table.addRow(row, columnsFormat);
                }
            });

            if(table.tbody.hasChildNodes()){
                let exportContainer = document.createElement('DIV');
                exportContainer.className = "padded";
                let exportButton = document.createElement('BUTTON');
                exportButton.innerHTML = "Export statistics to CSV";
                exportButton.className = "btn btn-default";
                exportButton.onclick = function() { return table.exportToCSV(); };
                exportContainer.appendChild(exportButton);
                this.pane.element.appendChild(exportContainer);
                this.pane.element.appendChild(table.element);
            }   
        }

        if(!this.pane.element.hasChildNodes()){
            let noStats = document.createElement('DIV');
            noStats.className = "padded";
            noStats.innerHTML = "Selected map has no regions statistics.";
            this.pane.element.appendChild(noStats);
        }
    }

    cleanPane(){
        while(this.pane.element.firstChild){
            this.pane.element.removeChild(this.pane.element.firstChild);
        }
    }
}

module.exports = regionStatsPage;