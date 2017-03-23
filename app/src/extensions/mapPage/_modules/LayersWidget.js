'use strict'

const Util = require('Util');
const ListGroup = require('ListGroup');
const TabGroup = require('TabGroup');
const Grid = require('Grid');
const {
    Menu,
    MenuItem
} = require('electron').remote;
const Input = require('Input');
const ToggleElement = require('ToggleElement');

class LayersWidget {

    constructor() {
        this.element = Util.div(null, 'layers-widget');
        this.content = Util.div(null, 'content');
        this.tabs = new TabGroup(this.content);
        this.baselist = new ListGroup(this.content);
        this.tileslist = new ListGroup(this.content);
        this.tileslist.element.classList.add('tiles-list');
        this.overlaylist = new ListGroup(this.content);
        this.datalist = new ListGroup(this.content);
        this.overlaylist.hide();
        this.datalist.hide();
        this.tabs.addItem({
            name: '<span class="fa fa-map" title="base layers"></span>',
            id: 'base'
        });
        this.tabs.addItem({
            name: '<i class="fa fa-map-marker"></i><i class="fa fa-map-o"></i>',
            id: 'overlay'
        });
        this.tabs.addItem({
            name: '<span class="fa fa-database" title="data"></span>',
            id: 'data'
        });
        this.tabs.addClickListener('base', () => {
            this.baselist.show();
            this.tileslist.show();
            this.overlaylist.hide();
            this.datalist.hide();
        });
        this.tabs.addClickListener('overlay', () => {
            this.baselist.hide();
            this.tileslist.hide();
            this.overlaylist.show();
            this.datalist.hide();
        });
        this.tabs.addClickListener('data', () => {
            this.baselist.hide();
            this.tileslist.hide();
            this.datalist.show();
            this.overlaylist.hide();
        });
        this.element.appendChild(this.content);
        this.baseLayer = null;
        this.baseLayers = {};
        this.overlayLayers = {};
    }

    setMapManager(mapManager) {
        this.mapManager = mapManager;

        this.mapManager.on('clean', () => {
            this.baselist.clean();
            this.tileslist.clean();
            this.overlaylist.clean();
            this.datalist.clean();
            this.baseLayer = null;
            this.baseLayers = {};
            this.overlayLayers = {};
        });

        this.mapManager.on('add:tileslayer', (e) => {
            let configuration = e.configuration;
            let layer = e.layer;
            let list;
            if (configuration.baseLayer) {
                list = this.baselist;
            } else {
                list = this.tileslist;
            }

            let tools = this.createToolbox(layer, true, false, false);

            if (configuration.baseLayer) {
                if (!this.baseLayer) {
                    this.baseLayer = layer;
                    this.mapManager._map.addLayer(this.baseLayer);
                }
            }
            let customMenuItems = [];
            let calibrationSettingsMenuItem = new MenuItem({
                label: 'Calibration settings',
                click: () => {

                }
            });
            customMenuItems.push(calibrationSettingsMenuItem);
            let baseLayerMenuItem = new MenuItem({
                label: 'Base layer',
                type: 'checkbox',
                checked: configuration.baseLayer,
                click: () => {
                    if (this.baseLayer === layer) return;
                    this.mapManager.removeLayer(layer);
                    configuration.baseLayer = baseLayerMenuItem.checked;
                    this.mapManager.addLayer(configuration);
                }
            });
            customMenuItems.push(baseLayerMenuItem);
            this._addToList(layer, customMenuItems, tools, configuration, list);
        });

        this.mapManager.on('add:pointslayermarkers', (e) => {
            let configuration = e.configuration;
            let layer = e.layer;
            layer._configuration = configuration;

            let tools = this.createToolbox(layer, false, true, true);
            let customMenuItems = [];

            this._addToList(layer, customMenuItems, tools, configuration, this.overlaylist);
        });

        this.mapManager.on('remove:layer', (e) => {
            if (e.configuration.baseLayer) {
                this.baselist.removeItem(e.configuration.id);
            } else if (e.configuration.type === 'pointsLayer' || e.configuration.type === 'pixelsLayer') {
                this.datalist.removeItem(e.configuration.id);
            } else if (e.configuration.type === 'tilesLayer') {
                this.tileslist.removeItem(e.configuration.id);
            } else {
                this.overlaylist.removeItem(e.configuration.id);
            }
        });
    }

    /**
     * Removes a layer from a list of layers.
     * @param {number} idLayer id of the layer to remove.
     * @param {Object} layers Object that contains a list of layers.
     */
    _removeLayer(idLayer, layers) {
        if (layers[idLayer]) {
            let layer = layers[idLayer];
            if (this.mapManager._map.hasLayer(layer)) {
                this.mapManager._map.removeLayer(layer);
            }
            delete layers[idLayer];
        }
    }

    _addToList(layer, customMenuItems, tools, configuration, list) {
        let txtTitle = Input.input({
            value: configuration.name,
            className: 'list-input',
            readOnly: true,
            onblur: () => {
                txtTitle.readOnly = true;
            },
            onchange: () => {
                layer._configuration.name = txtTitle.value;
            }
        });

        let titleTable = Util.div(null, 'table-container');
        let txtTitleContainer = Util.div(null, 'cell full-width');
        txtTitleContainer.appendChild(txtTitle);
        let btnToolsContainer = Util.div(null, 'cell');
        let btnTools = document.createElement('button');
        btnTools.className = 'btn btn-default';
        btnTools.onclick = (e) => {
            e.stopPropagation();
            tools.toggle();
        }
        let iconTools = document.createElement('span');
        iconTools.className = 'icon icon-tools';
        btnTools.appendChild(iconTools);
        btnToolsContainer.appendChild(btnTools);

        titleTable.appendChild(txtTitleContainer);
        titleTable.appendChild(btnToolsContainer);

        let context = new Menu();
        context.append(new MenuItem({
            label: 'Rename',
            click: () => {
                txtTitle.readOnly = false;
            }
        }));

        context.append(new MenuItem({
            label: 'Delete',
            click: () => {
                if (this.baseLayer === layer) {
                    return;
                }
                this.mapManager.removeLayer(layer);
            }
        }));

        customMenuItems.map((menuItem) => {
            context.append(menuItem);
        });
        list.addItem({
            id: configuration.id,
            title: titleTable,
            details: tools,
            active: (this.baseLayer === layer) || (list === this.datalist) || (this.mapManager._map.hasLayer(layer)),
            oncontextmenu: () => {
                context.popup()
            },
            onclick: {
                active: (item, e) => {
                    if (configuration.baseLayer) {
                        this.mapManager._map.removeLayer(this.baseLayer);
                        this.baseLayer = layer;
                    }
                    this.mapManager._map.addLayer(layer);
                },
                deactive: (item, e) => {
                    if (!configuration.baseLayer) {
                        this.mapManager._map.removeLayer(layer);
                    } else {
                        item.element.classList.add('active'); //no deactive if baselayer
                    }
                }
            },
            key: configuration.name,
            toggle: true
        });


        if (typeof layer.on === 'function') {
            layer.on('remove', () => {
                list.deactiveItem(configuration.id);
            });
        }


    }

    createToolbox(layer, hasOpacityControl, hasColorControl, hasRadiusControl) {
        let toolbox = new ToggleElement(Util.div(null, 'table-container toolbox'));
        toolbox.hide();
        toolbox.element.onclick = (e) => e.stopPropagation();
        let configuration = layer._configuration;

        if (hasColorControl) {
            let colorCell = Util.div(null, 'cell');

            let colorPickerContainer = Util.div(null, 'color-picker-wrapper');
            colorPickerContainer.style.backgroundColor = configuration.color || '#ed8414';

            let input = Input.input({
                label: '',
                className: '',
                value: configuration.color || '#ed8414',
                parent: colorPickerContainer,
                type: 'color',
                placeholder: 'color',
                oninput: (inp) => {

                },
                onchange: (inp) => {
                    colorPickerContainer.style.backgroundColor = inp.value;
                    configuration.color = inp.value;
                    configuration.fillColor = inp.value;
                    layer.eachLayer((l) => {
                        l.setStyle({
                            fillColor: inp.value,
                            color: inp.value
                        });
                    });
                }
            });

            colorCell.appendChild(colorPickerContainer);

            toolbox.appendChild(colorCell);
        }

        if (hasRadiusControl) {
            let radiusCell = Util.div(null, 'cell full-width');

            let input = Input.selectInput({
                label: 'Radius: ',
                className: '',
                parent: radiusCell,
                placeholder: 'Radius',
                choices: [
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10
                ],
                value: configuration.weight || 3,
                oninput: (inp) => {
                    configuration.weight = inp.value;
                    layer.eachLayer((l) => {
                        l.setStyle({
                            weight: inp.value
                        });
                    });
                }
            });

            toolbox.appendChild(radiusCell);
        }

        if (hasOpacityControl) {
            let opacityCell = Util.div(null, 'cell');

            let input = Input.input({
                label: '',
                className: 'form-control',
                parent: opacityCell,
                type: 'range',
                max: 1,
                min: 0,
                step: 0.1,
                value: configuration.opacity,
                placeholder: 'opacity',
                oninput: (inp) => {
                    configuration.opacity = Number(inp.value);
                    layer.setOpacity(configuration.opacity);
                }
            });

            toolbox.appendChild(opacityCell);
        }

        return toolbox;
    }


}

module.exports = LayersWidget;
