(function(a){var b,c,d=0,e={control:a('<div class="colorPicker-picker">&nbsp;</div>'),palette:a('<div id="colorPicker_palette" class="colorPicker-palette" />'),swatch:a('<div class="colorPicker-swatch">&nbsp;</div>'),hexLabel:a('<label for="colorPicker_hex">Hex</label>'),hexField:a('<input type="text" id="colorPicker_hex" />')},f="transparent",g;a.fn.colorPicker=function(b){return this.each(function(){var c=a(this),g=a.extend({},a.fn.colorPicker.defaults,b),h=a.fn.colorPicker.toHex(c.val().length>0?c.val():g.pickerDefault),i=e.control.clone(),j=e.palette.clone().attr("id","colorPicker_palette-"+d),k=e.hexLabel.clone(),l=e.hexField.clone(),m=j[0].id,n,o;a.each(g.colors,function(b){n=e.swatch.clone(),g.colors[b]===f?(n.addClass(f).text("X"),a.fn.colorPicker.bindPalette(l,n,f)):(n.css("background-color","#"+this),a.fn.colorPicker.bindPalette(l,n)),n.appendTo(j)}),k.attr("for","colorPicker_hex-"+d),l.attr({id:"colorPicker_hex-"+d,value:h}),l.bind("keydown",function(b){if(b.keyCode===13){var d=a.fn.colorPicker.toHex(a(this).val());a.fn.colorPicker.changeColor(d?d:c.val())}b.keyCode===27&&a.fn.colorPicker.hidePalette()}),l.bind("keyup",function(b){var d=a.fn.colorPicker.toHex(a(b.target).val());a.fn.colorPicker.previewColor(d?d:c.val())}),a('<div class="colorPicker_hexWrap" />').append(k).appendTo(j),j.find(".colorPicker_hexWrap").append(l),g.showHexField===!1&&(l.hide(),k.hide()),a("body").append(j),j.hide(),i.css("background-color",h),i.bind("click",function(){c.is(":not(:disabled)")&&a.fn.colorPicker.togglePalette(a("#"+m),a(this))}),b&&b.onColorChange?i.data("onColorChange",b.onColorChange):i.data("onColorChange",function(){}),(o=c.data("text"))&&i.html(o),c.after(i),c.bind("change",function(){c.next(".colorPicker-picker").css("background-color",a.fn.colorPicker.toHex(a(this).val()))}),c.val(h);if(c[0].tagName.toLowerCase()==="input")try{c.attr("type","hidden")}catch(p){c.css("visibility","hidden").css("position","absolute")}else c.hide();d++})},a.extend(!0,a.fn.colorPicker,{toHex:function(a){if(a.match(/[0-9A-F]{6}|[0-9A-F]{3}$/i))return a.charAt(0)==="#"?a:"#"+a;if(!a.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/))return!1;var b=[parseInt(RegExp.$1,10),parseInt(RegExp.$2,10),parseInt(RegExp.$3,10)],c=function(a){if(a.length<2)for(var b=0,c=2-a.length;b<c;b++)a="0"+a;return a};if(b.length===3){var d=c(b[0].toString(16)),e=c(b[1].toString(16)),f=c(b[2].toString(16));return"#"+d+e+f}},checkMouse:function(d,e){var f=c,g=a(d.target).parents("#"+f.attr("id")).length;if(d.target===a(f)[0]||d.target===b[0]||g>0)return;a.fn.colorPicker.hidePalette()},hidePalette:function(){a(document).unbind("mousedown",a.fn.colorPicker.checkMouse),a(".colorPicker-palette").hide()},showPalette:function(c){var d=b.prev("input").val();c.css({top:b.offset().top+b.outerHeight(),left:b.offset().left}),a("#color_value").val(d),c.show(),a(document).bind("mousedown",a.fn.colorPicker.checkMouse)},togglePalette:function(d,e){e&&(b=e),c=d,c.is(":visible")?a.fn.colorPicker.hidePalette():a.fn.colorPicker.showPalette(d)},changeColor:function(c){b.css("background-color",c),b.prev("input").val(c).change(),a.fn.colorPicker.hidePalette(),b.data("onColorChange").call(b,a(b).prev("input").attr("id"),c)},previewColor:function(a){b.css("background-color",a)},bindPalette:function(c,d,e){e=e?e:a.fn.colorPicker.toHex(d.css("background-color")),d.bind({click:function(b){g=e,a.fn.colorPicker.changeColor(e)},mouseover:function(b){g=c.val(),a(this).css("border-color","#598FEF"),c.val(e),a.fn.colorPicker.previewColor(e)},mouseout:function(d){a(this).css("border-color","#000"),c.val(b.css("background-color")),c.val(g),a.fn.colorPicker.previewColor(g)}})}}),a.fn.colorPicker.defaults={pickerDefault:"FFFFFF",colors:["000000","993300","333300","000080","333399","333333","800000","FF6600","808000","008000","008080","0000FF","666699","808080","FF0000","FF9900","99CC00","339966","33CCCC","3366FF","800080","999999","FF00FF","FFCC00","FFFF00","00FF00","00FFFF","00CCFF","993366","C0C0C0","FF99CC","FFCC99","FFFF99","CCFFFF","99CCFF","FFFFFF"],addColors:[],showHexField:!0}})(jQuery);

var G = google.maps;
var fenceCount = 0;
var fences = [];
var controlPanel = undefined;
var gmap = undefined;

function initialize() {

    var mapOpts = {
        zoom: 4,
        center: new G.LatLng(50, 10),
        mapTypeId: G.MapTypeId.ROADMAP,
        streetViewControl: false,
        mapTypeControl: true,
        gestureHandling: 'greedy'
    };
    //send to map-canvas div
    gmap = new G.Map(document.getElementById('map-canvas'), mapOpts);
    controlPanel = document.getElementById('fence-list');

    // Use the native Google Maps Data layer for drawing new polygons.
    // DrawingManager / the Drawing Library was removed from Maps JS 3.65.
    gmap.data.setControls(null);
    gmap.data.setDrawingMode(null);
}


function clearMap() {
    for (var i = 0; i < fences.length; i++) {
        fences[i]["poly"].setMap(null);
    }
    fences = [];

    $("#fence-list").remove();
    var $div = $("<div>", {id:"fence-list"});
    $("#controls").append($div);

    initialize();
}

function pointsToPath(points) {
    var path = [];
    for (var i = 0; i < points.length; i++) {
        var position = new G.LatLng(points[i][0], points[i][1]);

        path.push(position);
    }
    return path;
}

function addPolygon(key, path, color = '#6CB1E1') {
    key = key.replace('-', '');

    var geo = new G.Polygon({
        strokeColor: color,
        fillColor: color,
        clickable: false,
        paths: path,
        map: gmap
    });
    geo.setEditable(false);
    geo.addListener('contextmenu', function(mev) {
        if (mev.vertex != null && this.getPath().getLength() > 2) {
            this.getPath().removeAt(mev.vertex);
        }
    });
    var fence = {
        name: key,
        poly: geo,
        color: color,
        id: fenceCount
    };

    fences[fences.length] = fence;

    var fenceName = document.createElement('div');
    fenceName.innerHTML = key;

    var fenceDiv = document.createElement('div');
    fenceDiv.id = "fence" + fenceCount;
    fenceDiv.className = "fence";
    fenceDiv.appendChild(fenceName);
    fenceDiv.style.backgroundColor = color;

    var fenceEdit = document.createElement('input');
    fenceEdit.type = "checkbox";
    fenceEdit.checked = false;
    fenceEdit.id = "edit" + fenceCount;
    fenceEdit.addEventListener("change", function() {
        if (!fenceEdit.checked) {
            geo.setEditable(false);
        } else {
            geo.setEditable(true);
        }
    });

    var fenceArea = document.createElement('a');
    fenceArea.className = "btn bgrey fenceb";
    fenceArea.innerHTML = "area";
    fenceArea.addEventListener("click",function() {
        alert(key + " has an area of " + Math.round((G.geometry.spherical.computeArea(geo.getPath())*0.000001)*10000)/10000 + " square km");
    });

    var fenceVis = document.createElement('input');
    fenceVis.type = "checkbox";
    fenceVis.checked = true;
    fenceVis.id = "vis" + fenceCount;
    fenceVis.addEventListener("change", function() {
        if (!fenceVis.checked) {
            geo.setMap(null);
        } else {
            geo.setMap(gmap);
        }
    });
    fenceName.appendChild(fenceEdit);
    fenceName.appendChild(fenceVis);

    var fenceDel = document.createElement('a');
    fenceDel.className = "btn bred fenceb";
    fenceDel.innerHTML = "&times;";
    fenceDel.addEventListener("click", function() {
        deletePolygon(fence["id"]);
    });

    var fenceDown = document.createElement('a');
    fenceDown.className = "btn barrow fenceb";
    fenceDown.innerHTML = "exp";
    fenceDown.addEventListener("click", function() {
        var x = getFenceIndex(fence["id"]);
        outputDialog(polyToString(fences[x]["poly"]),fences[x]["name"]);
    });

    var fenceRename = document.createElement('a');
    fenceRename.className = "btn bgrey fenceb";
    fenceRename.innerHTML = "ren";
    fenceRename.addEventListener("click", function() {
        var newName = prompt("Enter the new name: ");
        if (newName.length > 1) {
            fenceName.innerHTML = newName;
            fence["name"] = newName;
        }
    });

    var fenceControl = document.createElement('div');
    fenceControl.style.display = "block";
    fenceControl.style.float = "right";

    fenceDiv.appendChild(fenceArea);
    fenceDiv.appendChild(fenceDel);
    fenceDiv.appendChild(fenceRename);
    fenceDiv.appendChild(fenceDown);

    fenceDiv.appendChild(fenceControl);

    controlPanel.appendChild(fenceDiv);
    fenceCount += 1; //dirty id counter....

}

function polyToString(poly) {
    var out = '';
    for (var i = 0; i < poly.getPath().getLength(); i++) {
        out += poly.getPath().getAt(i).toUrlValue(13) + '\n';
    }
    return out;
}

function getFenceIndex(id) {
    for (var i = 0; i < fences.length; i++) {
        if (fences[i]["id"] == id) {
            return i;
        }
    }
    return -1;
}

function deletePolygon(id) {
    // show the confirmation
    $("#delete-dialog").css("display", "block");

    $('#confirm-delete').one("click", function(e) {
        var index = getFenceIndex(id);
        if (index < 0) return;
        fences[index]["poly"].setMap(null);
        $("#fence" + fences[index]["id"]).remove();
        fences.splice(index, 1);

        $("#delete-dialog").css("display", "none");
    });

    //kill dialog
    $('#delete-dialog-hide').one("click", function(e) {
        $("#delete-dialog").css("display", "none");
    });
}

function outputDialog(string, name = "Fence") {
    $("#output-dialog").css("display", "block");

    $("#output-data").val(string);
    $("#output-name").text(name);

    $("#output-download").one("click", function(e) {
        if ($("#output-download-name").prop('checked')) string = "[" + name + "]\n" + string;

        $("#output-dialog").css("display", "none");
        download(name + ".txt", string);
    });
    $("#output-close").one("click", function(e) {
        $("#output-dialog").css("display", "none");
    });
}


//http://stackoverflow.com/a/18197341
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


function parseLines(lines) {
    var regex = /([+-]?\d+(?:\.\d+)?)(?:,\s*)([+-]?\d+(?:\.\d+)?)(?:\n|$)/gi;

    var point, path = [];
    while (point = regex.exec(lines)) {
        var lat = parseFloat(point[1]);
        var lng = parseFloat(point[2]);
        if (isNaN(lat) || isNaN(lng)) return;
        path.push(new G.LatLng(lat, lng));
    }
    return path;
}

// oh god...
function saveConfigFile() {
    $("#download-dialog").css("display", "block");

    $("#download-go").one("click", function(e) {
        $("#download-dialog").css("display", "none");

        var arrOut = [];
        var saveString = "";

        for (var i = 0; i < fences.length; i++) {

            var points = [];

            for (var j = 0; j < fences[i]["poly"].getPath().getLength(); j++) {
                var lls = fences[i]["poly"].getPath().getAt(j).toUrlValue(13).split(",");
                points.push([parseFloat(lls[0]),parseFloat(lls[1])]);
                console.log("PUSHING");
            }

            var fence = {
                name: fences[i]["name"],
                color: fences[i]["color"],
                id: fences[i]["id"],
                path: points
            };
            arrOut.push(fence);
        }
        download("fenceconfig.json", JSON.stringify(arrOut, null, "\t"));
    });
    $("#download-close").one("click", function(e) {
        $("#download-dialog").css("display", "none");
    });
}

function importJSON(jason) {
        clearMap();

        for (var i = 0; i < jason.length; i++) {
                var path = [];
                var rawPath = jason[i]["path"];
                for (var j = 0; j < rawPath.length; j++) {
                        path.push(new G.LatLng(rawPath[j][0],rawPath[j][1]));
                }
                addPolygon(jason[i]["name"], path, jason[i]["color"]);
        }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function loadConfigFile() {
    console.log("uhh yeah....");
    $("#loader-dialog").css("display", "block");

    $("#loader-close").one("click", function(e) {
        $("#loader-dialog").css("display", "none");
    });



    $("#loader-go").off().click(function(e) {
        var files = document.getElementById('loader-file').files;
        console.log(files);
        if (files.length <= 0) {
            return false;
        }

        var fr = new FileReader();

        fr.onload = function(e) {
            console.log(e);
            var result = JSON.parse(e.target.result);
            importJSON(result);
        }

        fr.readAsText(files.item(0));
        $("#loader-dialog").css("display", "none");
    });
}

function createNewFence() {

    var key = $("#fence-name").val();
    if (key == '') {
        key = "untitled" + fenceCount;
    }

    var color = $("#fence-color").val();

    var lines = $("#fence-data").val();
    if (lines != '') {
        var path = parseLines(lines);
        if (path === undefined || path.length < 1) {
            alert("Invalid input for coordinates!");
            return;
        }
        var nameCheck = /(?:[\[{])([A-z0-9]+)(?:[\]}])/;
        var match = nameCheck.exec(lines);
        if (match) key = match[1];

        addPolygon(key, path, color);
    } else {
        $("#fence-mgr-overlay").css("display", "block");

        // Style of the temporary polygon while the user is drawing it.
        gmap.data.setStyle({
            strokeColor: color,
            fillColor: color,
            strokeWeight: 2,
            fillOpacity: 0.35
        });

        // The Data layer fires addfeature once the polygon has been completed.
        G.event.addListenerOnce(gmap.data, 'addfeature', function(event) {
            var geometry = event.feature.getGeometry();

            // We only expect a polygon here, but cleanly abort if another
            // geometry somehow gets created.
            if (!geometry || geometry.getType() !== 'Polygon') {
                gmap.data.remove(event.feature);
                gmap.data.setDrawingMode(null);
                $("#fence-mgr-overlay").css("display", "none");
                return;
            }

            // Ring 0 is the polygon's exterior path. Copy it before removing
            // the temporary Data feature.
            var path = geometry.getAt(0).getArray().slice();

            gmap.data.remove(event.feature);
            gmap.data.setDrawingMode(null);
            $("#fence-mgr-overlay").css("display", "none");

            // Keep the application's existing Polygon-based workflow.
            addPolygon(key, path, color);
        });

        // Start interactive polygon drawing.
        gmap.data.setDrawingMode('Polygon');
    }

    $("#fence-name").val('');
    $("textarea").val('');
    $("#fence-dialog").css("display", "none");
}

/**
 * document initialization
 */
$(document).ready(function() {
    initialize(); // Draw the damn map.

    /**
     * Handle new-fence press
     */
    $('#create-fence').click(function() {
        createNewFence();
    });

    $('#save-cfg').click(function(e) {
        saveConfigFile();
    });

    $('#load-cfg').click(function(e) {
        loadConfigFile();
    });

    //popup with dialog
    $('#fence-dialog-show').click(function(e) {
        $("#fence-dialog").css("display", "block");
    });

    //kill dialog
    $('#fence-dialog-hide').click(function(e) {
        $("#fence-dialog").css("display", "none");
    });

        $('#fence-color').colorPicker({transparency: true});
});

