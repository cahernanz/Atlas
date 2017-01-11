"use strict";
//use non-map convention x-y if v=coords x=v[0] y=v[1]
//
const Baby = require("babyparse");
const fss = require("fs");

class pixelsLayer {

    constructor(configuration) {
        this.configuration = configuration;
        if (!this.configuration.basePath) {
            this.configuration.basePath = "";
        }
        this.options = {};
    }

    /**
     * check if a given point is inside a polygon
     * @param  {array} point   2 dimensions vector
     * @param  {polygon} polygon vector of 2dim vectors components,
     * @return {logical}
     */
    pointinpolygon(point, polygon) {
        if (!polygon) {
            return true;
        }

        // ray-casting algorithm based on
        // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        var x = point[0],
            y = point[1]; // extract x and y form point


        //convert latlngs to a vector of coordinates
        var vs = polygon;

        var inside = false; //initialize inside variable to false

        //ray-casting algorithm
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0],
                yi = vs[i][1];
            var xj = vs[j][0],
                yj = vs[j][1];
            var intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    getBounds(polygon) {
        if (polygon) {
            let b = {
                west: polygon[0][0],
                east: polygon[0][0],
                north: polygon[0][1],
                south: polygon[0][1]
            };
            for (var i in polygon) {
                b.west = Math.min(b.west, polygon[i][0]);
                b.east = Math.max(b.east, polygon[i][0]);
                b.north = Math.min(b.north, polygon[i][1]);
                b.south = Math.max(b.south, polygon[i][1]);
            }
            return b;
        } else {
            return polygon;
        }
    }

    // bounds is an object with .west .east .north and .south
    getReferences(bounds) {
        let tileSize = this.configuration.tileSize;
        let x0 = this.configuration.tilex0;
        let y0 = this.configuration.tiley0;
        if (bounds) {
            if (!x0) {
                x0 = 0;
            }

            if (!y0) {
                y0 = 0;
            }
            var temp = [];
            let siz = this.configuration.size;
            Object.keys(bounds).map((k) => {
                bounds[k] = Math.max(Math.min(bounds[k], siz), 0)
            });
            var xstart = Math.floor(bounds.west / tileSize);
            var xstop = Math.floor(bounds.east / tileSize);
            var ystart = Math.floor(bounds.north / tileSize);
            var ystop = Math.floor(bounds.south / tileSize);
            if (xstop === (bounds.east / tileSize)) xstop--;
            if (ystop === (bounds.south / tileSize)) ystop--;
            for (var i = xstart; i <= xstop; i++) {
                for (var j = ystart; j <= ystop; j++) {
                    //if (i>=0 && j>=0){
                    temp.push([i, j]);
                    //}
                }
            }

            var res = temp.map((coord) => {
                return ({
                    col: coord[0] + x0,
                    row: coord[1] + y0,
                    x: coord[0] * tileSize,
                    y: coord[1] * tileSize
                })
            });

            return (res);
        } else {
            return this.getReferences({
                west: 0,
                east: this.configuration.size,
                north: 0,
                south: this.configuration.size
            });
        }
    }

    sum(options) {
        let t0 = process.hrtime();
        let polygon = options.polygon;
        let complete = options.complete;
        let error = options.errorcl;
        let cl = options.cl;
        let bunch = options.bunch;
        let maxTiles = options.maxTiles;
        var references = this.getReferences(this.getBounds(polygon));
        var l = references.length;
        const tot = l;
        var pixelsUrlTemplate = this.configuration.pixelsUrlTemplate;
        let res = 0;
        let N=0;

        var step = (v, x, y)=> {
            if (this.pointinpolygon([x, y], polygon) ) {
                res = res + v;
                N++;
                if (typeof cl === 'function') {
                    cl(v, x, y);
                }
            }
        };

        var end = () => {
            l = l - 1;
            if (bunch) {
                bunch(tot - l, tot);
            }
            if (l <= 0) {
                let t1 = process.hrtime(t0);
                if (typeof complete === 'function') {
                    complete({
                        sum: res,
                        mean: res/N,
                        N:N,
                        tot: tot,
                        time: t1
                    });
                }
            }
        };


        var err = (e) => {
            if (typeof error === 'function') {
                error(e);
            }
            l = l - 1;
            if (typeof bunch === 'function') {
                bunch(tot - l, tot);
            }
            if (l <= 0) {
                let t1 = process.hrtime(t0);
                if (typeof complete === 'function') {
                    complete({
                        sum: res,
                        tot: tot,
                        time: t1
                    });
                }
            }
        };

        if (maxTiles) {
            maxTiles = Math.min(maxTiles, references.length);
        } else {
            maxTiles = references.length;
        }

        for (var tt = 0; tt < maxTiles; tt++) {
            this.read(polygon, references[tt], step, err, end);
        }
    }

    isRemote() {
        if (typeof this.configuration.source === 'string') {
            if (this.configuration.source === 'remote') return true;
            if (this.configuration.source === 'local') return false;
        }
        if (typeof this.configuration.pixelsUrlTemplate === 'string') {
            if (this.configuration.pixelsUrlTemplate.startsWith('http')) return true;
            if (this.configuration.pixelsUrlTemplate.startsWith('file')) return false;
            if (this.configuration.pixelsUrlTemplate.startsWith('/')) return false;
        }
        return false;
    }

    read(polygon, reference, step, error, end) {
        let url = this.configuration.pixelsUrlTemplate;
        url = url.replace("{x}", reference.col);
        url = url.replace("{y}", reference.row);
        let j = 0;
        try {
            let contents = '';
            if (this.isRemote()) {
                contents = url;

            } else {
                contents = fss.readFileSync(url).toString();
            }
            Baby.parse(contents, {
                dynamicTyping: true,
                fastMode: true,
                step: (results, parser) => { //read line by line
                    let y = j + reference.row * this.configuration.tileSize;
                    for (let i = 0; i < results.data[0].length; i++) {
                        let x = i + reference.col * this.configuration.tileSize;
                        step(results.data[0][i], x, y); //read one cell of the csv
                    }
                    j++; //increment lines count
                },
                complete: (results, file) => {
                    if (end) {
                        end();
                    }
                },
                error: (e, file) => {
                    if (typeof error === 'function') {
                        error(e);
                    }
                }
            });
        } catch (e) {
            if (error) {
                error(e);
            }
        }
    }
}

//export as node module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pixelsLayer;
}
// ...or as browser global
else {
    global.pixelsLayer = pixelsLayer;
}
