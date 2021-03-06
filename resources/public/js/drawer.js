/*jslint bitwise: true */

// Bresenham's line algorithm
// http://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm

goog.provide("tixi.drawer");

(function () {
    var repeatString = function (string, times) {
        var result = "";
        var i;
        for (i = 0; i < times; i += 1) {
            result += string;
        }
        return result;
    };

    var add = function (result, x, y, character) {
        var value = {};
        value["v"] = character;
        var key = [x, y];
        result.points.push([[x, y], value]);
        result.index[x + "_" + y] = value;
    };

    var merge = function (object, other) {
        var k;
        for (k in other) {
            if (other.hasOwnProperty(k)) {
                object[k] = other[k];
            }
        }
    };

    var concat = function (result, other) {
        result.points = result.points.concat(other.points);
        merge(result.index, other.index);
    };

    tixi.drawer.buildLine = function (data, firstChar) {
        var x1 = data[0];
        var y1 = data[1];
        var x2 = data[2];
        var y2 = data[3];
        var dx = Math.abs(x2 - x1);
        var dy = Math.abs(y2 - y1);
        var sx = (x1 < x2 ? 1 : -1);
        var sy = (y1 < y2 ? 1 : -1);
        var err = dx - dy;
        var sym = (dx < dy ? "|" : "-");
        var slash = (sx === sy ? "\\" : "/");

        var result = {points: [], index: {}};
        while (x1 !== x2 || y1 !== y2) {
            var e2 = err << 1;
            var newErr;
            if (e2 > -dy && e2 < dx) {
                newErr = err - dy + dx;
            } else if (e2 > -dy) {
                newErr = err - dy;
            } else if (e2 < dx) {
                newErr = err + dx;
            } else {
                newErr = err;
            }
            var newX1 = (e2 > -dy ? x1 + sx : x1);
            var newY1 = (e2 < dx ? y1 + sy : y1);
            var newSym;
            if (result.points.length === 0 && firstChar) {
                newSym = firstChar;
            } else {
                newSym = ((sym === "|" && newX1 !== x1) || (sym === "-" && newY1 !== y1) ? slash : sym);
            }

            add(result, x1, y1, newSym);

            x1 = newX1;
            y1 = newY1;
            err = newErr;
        }
        add(result, x2, y2, (result.points.length === 0 && firstChar ? firstChar : sym));

        return result;
    };

    tixi.drawer.buildRect = function (data) {
        var x1 = Math.min(data[0], data[2]);
        var y1 = Math.min(data[1], data[3]);
        var x2 = Math.max(data[0], data[2]);
        var y2 = Math.max(data[1], data[3]);
        var result = {points: [], index: {}};
        add(result, x1, y1, "+");
        if (x1 !== x2) {
            add(result, x2, y1, "+");
        }
        if (y1 !== y2) {
            add(result, x1, y2, "+");
        }
        if (x1 !== x2 && y1 !== y2) {
            add(result, x2, y2, "+");
        }
        if (Math.abs(x2 - x1) > 1) {
            concat(result, tixi.drawer.buildLine([x1 + 1, y1, x2 - 1, y1], "-"));
            if (Math.abs(y2 - y1) > 0) {
                concat(result, tixi.drawer.buildLine([x1 + 1, y2, x2 - 1, y2], "-"));
            }
        }
        if (Math.abs(y2 - y1) > 1) {
            concat(result, tixi.drawer.buildLine([x1, y1 + 1, x1, y2 - 1], "|"));
            if (Math.abs(x2 - x1) > 0) {
                concat(result, tixi.drawer.buildLine([x2, y1 + 1, x2, y2 - 1], "|"));
            }
        }
        return result;
    };

    tixi.drawer.buildRectLine = function (data, direction) {
        var x1 = data[0];
        var y1 = data[1];
        var x2 = data[2];
        var y2 = data[3];
        direction = direction || "horizontal";

        var result = {points: [], index: {}};
        if (direction === "horizontal") {
            if (Math.abs(x2 - x1) > 0) {
                concat(result, tixi.drawer.buildLine([x1, y1, x2 > x1 ? (x2 - 1) : (x2 + 1), y1], "-"));
            }
            add(result, x2, y1, "+");
            if (Math.abs(y2 - y1) > 0) {
                concat(result, tixi.drawer.buildLine([x2, y2 > y1 ? (y1 + 1) : (y1 - 1), x2, y2], "|"));
            }
        } else {
            if (Math.abs(y2 - y1) > 0) {
                concat(result, tixi.drawer.buildLine([x1, y1, x1, y2 > y1 ? (y2 - 1) : (y2 + 1)], "|"));
            }
            add(result, x1, y2, "+");
            if (Math.abs(x2 - x1) > 0) {
                concat(result, tixi.drawer.buildLine([x2 > x1 ? (x1 + 1) : (x1 - 1), y2, x2, y2], "-"));
            }
        }
        return result;
    };

    tixi.drawer.sortData = function (data) {
        return (data || []).sort(function (a, b) {
            var result;
            if (a[0][1] > b[0][1]) {
                result = 1;
            } else if (a[0][1] < b[0][1]) {
                result = -1;
            } else {
                if (a[0][0] > b[0][0]) {
                    result = 1;
                } else if (a[0][0] < b[0][0]) {
                    result = -1;
                } else {
                    result = 0;
                }
            }
            return result;
        });
    };

    tixi.drawer.generateData = function (width, height, points) {
        var line = 0;
        var pos = 0;
        var result = "";
        var i;
        for (i in points) {
            if (points.hasOwnProperty(i)) {
                var dataPoint = points[i];
                var point = dataPoint[0];
                var x = point[0];
                var y = point[1];
                var character = dataPoint[1];
                while (y !== line) {
                    result += repeatString(" ", width - pos);
                    result += "\n";
                    pos = 0;
                    line += 1;
                }
                result += repeatString(" ", x - pos);
                result += character["v"];
                pos = x + 1;
                line = y;
            }
        }
        while (line < height) {
            result += repeatString(" ", width - pos);
            pos = 0;
            line += 1;
            if (line < height) {
                result += "\n";
            }
        }
        return result;
    };

    tixi.drawer.buildResult = function (items, cache) {
        var values = [];
        var key;
        for (key in items) {
            if (items.hasOwnProperty(key)) {
                values.push([key, items[key], cache[key]]);
            }
        }
        values = values.sort(function (a, b) {
            return parseInt(a[1]["z"], 10) - parseInt(b[1]["z"], 10);
        });

        function generateIndex(viewport) {
            var width = 0;
            var height = 0;
            var index = {};
            var i;
            for (i = 0; i < values.length; i += 1) {
                item = values[i][1];
                cache = values[i][2];
                var k;
                for (k in cache["index"]) {
                    if (cache["index"].hasOwnProperty(k)) {
                        var match = k.match(/(\d+)_(\d+)/);
                        if (match) {
                            var x = parseInt(match[1], 10);
                            var y = parseInt(match[2], 10);
                            var startX = Math.min(item["input"]["start"].x, item["input"]["end"].x) - viewport.startX;
                            var startY = Math.min(item["input"]["start"].y, item["input"]["end"].y) - viewport.startY;
                            index[(startX + x) + "_" + (startY + y)] = cache["index"][k];
                        }
                    }
                }
            }
            return index;
        }

        function generatePoints(index) {
            var points = [];
            var k;
            for (k in index) {
                if (index.hasOwnProperty(k)) {
                    var match = k.match(/(\d+)_(\d+)/);
                    if (match) {
                        var x = parseInt(match[1], 10);
                        var y = parseInt(match[2], 10);
                        points.push([[x, y], index[k]]);
                    }
                }
            }
            return tixi.drawer.sortData(points);
        }

        function stringLength(str) {
            return str.length;
        }

        function getViewport() {
            var i;
            var result = {startX: Infinity, startY: Infinity, endX: 0, endY: 0};
            for (i = 0; i < values.length; i += 1) {
                var item = values[i][1];
                result.startX = Math.min(result.startX, item["input"]["start"].x, item["input"]["end"].x);
                result.startY = Math.min(result.startY, item["input"]["start"].y, item["input"]["end"].y);
                result.endX = Math.max(result.endX, item["input"]["start"].x, item["input"]["end"].x);
                result.endY = Math.max(result.endY, item["input"]["start"].y, item["input"]["end"].y);
            }
            return result;
        }

        function addText(viewport, width, height, data) {
            var i;
            for (i = 0; i < values.length; i += 1) {
                var item = values[i][1];
                var text = item.text;
                var widthItem = Math.abs(item["input"]["start"].x - item["input"]["end"].x);
                var heightItem = Math.abs(item["input"]["start"].y - item["input"]["end"].y);
                var startX = Math.min(item["input"]["start"].x, item["input"]["end"].x) - viewport.startX;
                var startY = Math.min(item["input"]["start"].y, item["input"]["end"].y) - viewport.startY;
                var widthCenterItem = startX + widthItem / 2;
                var heightCenterItem = startY + heightItem / 2;
                var j;
                var pos;
                var line;
                if (text) {
                    var textArray;
                    if (item.type === "text") {
                        var textArray = text.split("\n");
                        for (j = 0; j < textArray.length; j += 1) {
                            line = textArray[j];
                            pos = (startY + j) * (width + 1) + startX;
                            data = data.substr(0, pos) +
                                data.substr(pos, line.length).replace(/.*/, line) +
                                data.substr(pos + line.length, data.length - (pos + line.length));
                        }
                    } else {
                        textArray = [];
                        text.split("\n").forEach(function (line) {
                            if (line.length === 0) {
                                textArray.push("");
                            } else {
                                for (var k = 0; k < line.length; k += widthItem - 1) {
                                    textArray.push(line.substr(k, widthItem - 1));
                                }
                            }
                        });
                        console.log(textArray);
                        var widthText = Math.max.apply(null, textArray.map(stringLength));
                        var heightText = textArray.length;
                        var startXText = Math.ceil(widthCenterItem - widthText / 2);
                        var startYText = Math.ceil(heightCenterItem - heightText / 2);
                        for (j = 0; j < textArray.length; j += 1) {
                            line = textArray[j];
                            pos = (startYText + j) * (width + 1) + startXText;
                            data = data.substr(0, pos) +
                                data.substr(pos + 1, line.length).replace(/.*/, line) +
                                data.substr(pos + line.length, data.length - (pos + line.length));
                        }
                    }
                }
            }
            return data;
        }

        var viewport = getViewport();
        var result = generateIndex(viewport);
        var points = generatePoints(result);
        var width = viewport.endX - viewport.startX + 1;
        var height = viewport.endY - viewport.startY + 1;
        var content = tixi.drawer.generateData(width, height, points);
        content = addText(viewport, width, height, content);
        return {width: width, height: height, content: content};
    };
}());
