/**
 * A plugin combining geojson-vt with leafletjs which is initially inspired by leaflet-geojson-vt.
 *
 * @author Brandonxiang, Raruto
 *
 * @link https://github.com/brandonxiang/leaflet-geojson-vt
 */
L.GridLayer.GeoJSON = L.GridLayer.extend({
  options: {
    async: false,
    maxZoom: 24,
    tolerance: 3,
    debug: 0,
    extent: 4096,
    buffer: 256,
    icon: {
      width: 28,
      height: 28
    },
    styles: {
      strokeWidth: 1,
      strokeColor: '#f00',
      strokeOpacity: 1.0,
      fillColor: '#000',
      fillOpacity: 0.25
    }
  },

  initialize: function(geojson, options) {
    L.setOptions(this, options);
    L.GridLayer.prototype.initialize.call(this, options);
    this.tileIndex = geojsonvt(geojson, this.options);
    this.geojson = geojson; // eg. saved for advanced "leaflet-pip" mouse/click integrations
  },

  createTile: function(coords) {
    var tile = L.DomUtil.create('canvas', 'leaflet-tile');
    var size = this.getTileSize();
    tile.width = size.x;
    tile.height = size.y;
    var ctx = tile.getContext('2d');

    // return the tile so it can be rendered on screen
    var tileInfo = this.tileIndex.getTile(coords.z, coords.x, coords.y);
    var features = tileInfo ? tileInfo.features : [];
    for (var i = 0; i < features.length; i++) {
      this._drawFeature(ctx, features[i]);
    }
    return tile;
  },

  _drawFeature: function(ctx, feature) {
    ctx.beginPath();
    this._setStyle(ctx, feature);

    if (feature.type === 1) this._drawIcon(ctx, feature);
    else if (feature.type === 2) this._drawLine(ctx, feature);
    else if (feature.type === 3) this._drawPolygon(ctx, feature);
    else console.warn('Unsupported feature type: ' + feature.geometry.type, feature);

    ctx.stroke();
  },

  _drawIcon: function(ctx, feature) {
    var icon = new Image(),
      p = feature.geometry[0],
      width = this.options.icon.width,
      height = this.options.icon.height;
    icon.onload = function() {
      ctx.drawImage(icon, (p[0] / 16.0) - (width / 2.0), (p[1] / 16.0) - (height / 2.0), width, height);
    };
    icon.src = feature.tags.icon ? feature.tags.icon : null;
  },

  _drawLine: function(ctx, feature) {
    for (var j = 0; j < feature.geometry.length; j++) {
      var ring = feature.geometry[j];
      for (var k = 0; k < ring.length; k++) {
        var p = ring[k];
        if (k) ctx.lineTo(p[0] / 16.0, p[1] / 16.0);
        else ctx.moveTo(p[0] / 16.0, p[1] / 16.0);
      }
    }
  },

  _drawPolygon: function(ctx, feature) {
    this._drawLine(ctx, feature);
    ctx.fill('evenodd');
  },

  _setStyle: function(ctx, feature) {
    var style = {};

    if (feature.type === 1) style = this._setPointStyle(feature, style);
    else if (feature.type === 2) style = this._setLineStyle(feature, style);
    else if (feature.type === 3) style = this._setPolygonStyle(feature, style);

    ctx.lineWidth = style.stroke ? this._setWeight(style.weight) : 0;
    ctx.strokeStyle = style.stroke ? this._setOpacity(style.stroke, style.opacity) : {};
    ctx.fillStyle = style.fill ? this._setOpacity(style.fill, style.fillOpacity) : {};
  },

  _setPointStyle: function(feature, style) {
    return style;
  },

  _setLineStyle: function(feature, style) {
    style.weight = (feature.tags["stroke-width"] ? feature.tags["stroke-width"] : this.options.styles.strokeWidth) * 1.05;
    style.opacity = feature.tags["stroke-opacity"] ? feature.tags["stroke-opacity"] : this.options.styles.strokeOpacity;
    style.stroke = feature.tags.stroke ? feature.tags.stroke : this.options.styles.strokeColor;
    return style;
  },

  _setPolygonStyle: function(feature, style) {
    style = this._setLineStyle(feature, style);
    style.fill = feature.tags.fill ? feature.tags.fill : this.options.styles.fillColor;
    style.fillOpacity = feature.tags["fill-opacity"] ? feature.tags["fill-opacity"] : this.options.styles.fillOpacity;
    return style;
  },

  _setWeight: function(weight) {
    return weight || 5;
  },

  _setOpacity: function(color, opacity) {
    color = color || '#f00';
    if (opacity && this._iscolorHex(color)) {
      var colorRgb = this._colorRgb(color);
      return "rgba(" + colorRgb[0] + "," + colorRgb[1] + "," + colorRgb[2] + "," + opacity + ")";
    }
    return color;
  },

  _iscolorHex: function(color) {
    return /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/.test(color.toLowerCase());
  },

  _colorRgb: function(color) {
    var sColor = color.toLowerCase();
    if (sColor.length === 4) {
      var sColorNew = "#";
      for (var i = 1; i < 4; i += 1) {
        sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
      }
      sColor = sColorNew;
    }
    var sColorChange = [];
    for (var j = 1; j < 7; j += 2) {
      sColorChange.push(parseInt("0x" + sColor.slice(j, j + 2)));
    }
    return sColorChange;
  }

});

L.gridLayer.geoJson = function(geojson, options) {
  return new L.GridLayer.GeoJSON(geojson, options);
};
