<template>
  <div id="map-wrap" class="wrapper">
    <loading :active.sync="isLoading" :can-cancel="false" />
    <client-only>
      <l-map id="map" ref="Lmap" v-on:draw:created="addDrawnFence($event)" :zoom="13" @update:center="updateCenter">
        <v-container fluid class="search">
          <v-row
            class="mb-6"
            justify="center"
            no-gutters
          >
            <v-col class="pa-2 search" md="auto">
              <v-text-field
                id="searchBox"
                v-model="searchString"
                @keyup.enter="search()"
                label="location"
                filled
                inline
              />
            </v-col>
            <v-col class="pa-3 search" md="auto">
              <v-btn v-on:click="search()" right color="green">
                Search
              </v-btn>
            </v-col>
            <v-col class="pa-3 search" right md="auto">
              <v-btn v-on:click="drawFence()" right color="green">
                Make geofence
              </v-btn>
            </v-col>
          </v-row>
          <span v-if="$geolocation.loading">        Loading location...</span>
          <span v-else-if="!$geolocation.supported">              Geolocation API is not supported</span>
        </v-container>
        <!-- end of search stuff -->

        <!-- beginning of search results -->
        <transition name="slide-fade">
          <v-card
            v-if="foundAreas.length"
            class="searchResultBox mx-auto"
            max-width="300"
          >
            <v-list rounded>
              <v-list-item-group v-model="foundAreas" color="primary">
                <v-list-item
                  v-for="area in foundAreas"
                  v-bind:key="area.osm_id"
                  class="foundAreas"
                >
                  <v-list-item-content v-on:click="panToArea(area)" rounded>
                    {{ area.class }} {{ area.type }}
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card>
        </transition>
        <!-- End of search results -->

        <!-- Beginning of created geofences -->
        <v-card
          id="geofencesArea"
          class="geofencesArea transparent mx-auto"
          max-width="300"
          max-height="100%"
          height="auto"
          style="overflow-Y: auto;"
        >
          <v-list rounded>
            <v-row justify="center">
              <v-col class="pa-1 search" md="auto">
                <v-btn v-on:click="showAllFences('txt')" left color="blue" rounded>
                  show all
                </v-btn>
              </v-col>
            </v-row>
            <v-row justify="left">
              <v-col class="pa-1 search" right md="auto">
                &nbsp;&nbsp;&nbsp;Export as:
              </v-col>
            </v-row>
            <v-row justify="center">
              <v-col class="pa-1 search" right md="auto">
                <v-btn v-on:click="download('txt')" left color="blue" rounded>
                  txt
                </v-btn>
                <v-btn v-on:click="download('json')" center color="blue" rounded>
                  json
                </v-btn>
                <v-btn v-on:click="download('geojson')" right color="blue" rounded>
                  GEOjson
                </v-btn>
              </v-col>
            </v-row>
            <v-file-input
              ref="myFile"
              v-on:change="selectedFile()"
              v-model="files"
              class="pa-1"
              dense
              multiple
              placeholder="Upload existing geofence"
            />
            <v-list-item-group color="primary">
              <div class="scroll">
                <v-list-item
                  v-for="fence in geofences"
                  v-bind:key="fence.id"
                  v-on:click="panToGeofence(fence)"
                  class="pa-1"
                  style="height: 5px; overflow-y: hidden; padding:0px;"
                >
                  <v-text-field v-model="fence.name" />
                  <v-list-item-action>
                    <v-btn icon>
                      <v-icon v-on:click="removeGeofence(fence.name)" color="grey lighten-1">
                        mdi-delete-outline
                      </v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </div>
            </v-list-item-group>
          </v-list>
        </v-card>

        <l-tile-layer url="http://tiles.pogomap.fr/tile/klokantech-basic/{z}/{x}/{y}/2/png" />

        <!-- area popup -->
        <v-row ref="currentAreaPopup">
          <v-col>
            step
            <input
              v-model="minStep"
              :min="0"
              :max="10000"
              type="number"
              class="popup"
              inline
            >
            <v-btn v-on:click="addGeofence(currentResult)" right>
              add area
            </v-btn>
          </v-col>
        </v-row>
        <!-- error message snackbar -->
        <v-snackbar
          v-model="error"
          :timeout="3000"
          :top="true"
          color="red"
        >
          {{ errorMsg }}
          <v-btn
            @click="snackbar = false"
            color="black"
            text
          >
            Close
          </v-btn>
        </v-snackbar>
      </l-map>
    </client-only>
  </div>
</template>
<script>

import Axios from 'axios'
import Loading from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/vue-loading.css'
import 'leaflet-draw/dist/leaflet.draw.css'

let L = { icon () {} }
if (process.browser) {
  L = require('leaflet')
  require('leaflet-draw')
  require('leaflet-toolbar')
}

function convertToFeatures (geofences) {
  const outFeatures = []
  geofences.forEach((area) => { outFeatures.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [area.path.map(coordinates => coordinates.reverse())] }, properties: { name: area.name, color: area.color, id: area.id } }) })
  return outFeatures
}

function convertFromFeatures (geogeofences) {
  if (geogeofences.type !== 'FeatureCollection' || !geogeofences.features) { return }
  const geofenceGEOjson = geogeofences.features
  const outGeofence = []
  for (let i = 0; i < geofenceGEOjson.length; i++) {
    if (geofenceGEOjson[i].type === 'Feature' && geofenceGEOjson[i].geometry.type === 'Polygon') {
      const name = geofenceGEOjson[i].properties.name || 'city' + i.toString()
      const color = geofenceGEOjson[i].properties.color || `#${Math.floor(Math.random() * 16777215).toString(16)}`
      outGeofence[i] = {
        name, id: i, color, path: []
      }
      geofenceGEOjson[i].geometry.coordinates[0].forEach(coordinates => outGeofence[i].path.push([coordinates[1], coordinates[0]]))
    }
  }
  return outGeofence
}

export default {
  components: {
    Loading

  },
  data () {
    return {
      searchString: '',
      files: [],
      foundAreas: [],
      geofences: [],
      currentResult: {},
      error: false,
      errorMsg: '',
      minStep: 50,
      rawAreaLayer: { clearLayers: () => {} },
      rawGeofenceLayer: { clearLayers: () => {} },
      rawAllAreasLayer: { clearLayers: () => {} },
      L,
      showResults: false,
      isLoading: false,
      currentLocation: { lat: 0, lon: 0 }
    }
  },

  mounted () {
    this.initPosition()
  },
  updated () {
    // this.changeView('potato')
  },
  methods: {
    updateCenter (val) {
      this.currentLocation.lat = val.lat
      this.currentLocation.lon = val.lng
    },
    download (extension) {
      const element = document.createElement('a')
      let text = ''
      const geogeofences = { type: 'FeatureCollection', features: [] }

      if (extension === 'txt') {
        text = this.geofences.map((area) => {
          let areastring = `[${area.name}]\n`
          area.path.forEach((coord) => {
            areastring = areastring + `${coord[0]},${coord[1]}\n`
          })
          return areastring + '\n'
        }).join('\n')
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
        element.setAttribute('download', 'geofence.txt')
      } else if (extension === 'json') {
        text = JSON.stringify(this.geofences, null, '\t')

        element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text))
        element.setAttribute('download', 'geofence.json')
      } else if (extension === 'geojson') {
        geogeofences.features = convertToFeatures(this.geofences)
        text = JSON.stringify(geogeofences, null, '\t')

        element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text))
        element.setAttribute('download', 'geofence.json')
      }

      element.style.display = 'none'
      document.body.appendChild(element)

      element.click()

      document.body.removeChild(element)
    },
    drawFence () {
      this.rawAreaLayer.clearLayers()
      this.rawGeofenceLayer.clearLayers()
      this.rawAreaLayer.clearLayers()
      new this.L.Draw.Polygon(this.$refs.Lmap.mapObject, true).enable()
    },
    addDrawnFence (res) {
      if (res.layerType !== 'polygon') { return }
      const points = res.layer._latlngs[0]
      let maxId = 0
      this.geofences.map((obj) => {
        if (obj.id > maxId) { maxId = obj.id }
      })
      const drawnGeofence = {
        name: `Rename Me${this.geofences.length ? ' ' + this.geofences.length : ''}`,
        id: maxId + 1,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        path: points.map(coord => [coord.lat, coord.lng])
      }
      this.rawGeofenceLayer = L.geoJSON(L.polygon(drawnGeofence.path).toGeoJSON(), { color: drawnGeofence.color })
      this.rawGeofenceLayer.addTo(this.$refs.Lmap.mapObject)
      this.geofences.push(drawnGeofence)
      this.mapStopScrolling()
    },
    showAllFences () {
      if (!this.geofences.length) {
        console.log('no geofences in there')
        this.errorMsg = 'Add some geofences first'
        this.error = true
        return
      }
      this.rawAreaLayer.clearLayers()
      this.rawGeofenceLayer.clearLayers()
      this.rawAreaLayer.clearLayers()
      const allCoords = []
      this.geofences.map(area => allCoords.push(...area.path))
      const lats = allCoords.map(coords => coords[0])
      const lons = allCoords.map(coords => coords[1])
      const maxLat = Math.max(...lats)
      const minLat = Math.min(...lats)
      const maxLon = Math.max(...lons)
      const minLon = Math.min(...lons)

      this.geofences.forEach((geofence) => {
        this.rawGeofenceLayer = L.geoJSON(L.polygon(geofence.path).toGeoJSON(), { color: geofence.color })
        this.rawGeofenceLayer.addTo(this.$refs.Lmap.mapObject)
      })

      if (this.getDistance(this.currentLocation, { lat: minLat, lon: minLon }) > 1000000) { // 1000 km
        this.$refs.Lmap.mapObject.fitBounds(L.latLngBounds(L.latLng(minLat, minLon), L.latLng(maxLat, maxLon)))
      } else {
        this.$refs.Lmap.mapObject.flyToBounds(L.latLngBounds(L.latLng(minLat, minLon), L.latLng(maxLat, maxLon)))
      }
    },
    mapStopScrolling () {
      console.log('don`\'tscroll')
      const el = document.getElementById('geofencesArea')
      this.L.DomEvent.disableScrollPropagation(el)
    },
    async search () {
      this.$nuxt.$loading.start()
      this.isLoading = true
      this.foundAreas = []
      const { data } = await Axios.get(`https://nominatim.openstreetmap.org/search.php?q=${encodeURIComponent(this.searchString)}&format=json&addressdetails=1&limit=10&polygon_geojson=1`)
      this.foundAreas = data
      this.showResults = !!data.length
      this.$nuxt.$loading.finish()
      this.isLoading = false
    },
    panToArea (area) {
      if (!this.$refs.Lmap) { return }
      this.currentResult = area
      this.rawAreaLayer.clearLayers()
      this.rawGeofenceLayer.clearLayers()
      this.rawAreaLayer.clearLayers()
      this.rawAreaLayer = L.geoJSON(area.geojson)
      this.rawAreaLayer.addTo(this.$refs.Lmap.mapObject)
      this.rawAreaLayer.bindPopup(this.$refs.currentAreaPopup)
      if (this.getDistance(this.currentLocation, area) > 1000000) { // 1000 km
        this.$refs.Lmap.mapObject.fitBounds(L.latLngBounds(L.latLng(area.boundingbox[0], area.boundingbox[2]), L.latLng(area.boundingbox[1], area.boundingbox[3])))
      } else {
        this.$refs.Lmap.mapObject.flyToBounds(L.latLngBounds(L.latLng(area.boundingbox[0], area.boundingbox[2]), L.latLng(area.boundingbox[1], area.boundingbox[3])))
      }
    },
    panToGeofence (geofence) {
      if (!this.$refs.Lmap) { return }

      this.rawAreaLayer.clearLayers()
      this.rawGeofenceLayer.clearLayers()
      this.rawAreaLayer.clearLayers()
      this.rawGeofenceLayer = L.geoJSON(L.polygon(geofence.path).toGeoJSON(), { color: geofence.color })
      this.rawGeofenceLayer.addTo(this.$refs.Lmap.mapObject)
      this.rawGeofenceLayer.bindPopup('potato')

      const lats = geofence.path.map(coords => coords[0])
      const lons = geofence.path.map(coords => coords[1])
      const maxLat = Math.max(...lats)
      const minLat = Math.min(...lats)
      const maxLon = Math.max(...lons)
      const minLon = Math.min(...lons)

      if (this.getDistance(this.currentLocation, { lat: minLat, lon: minLon }) > 1000000) { // 1000 km
        this.$refs.Lmap.mapObject.fitBounds(L.latLngBounds(L.latLng(minLat, minLon), L.latLng(maxLat, maxLon)))
      } else {
        this.$refs.Lmap.mapObject.flyToBounds(L.latLngBounds(L.latLng(minLat, minLon), L.latLng(maxLat, maxLon)))
      }
    },
    async initPosition () {
      const { coords } = await this.$geolocation.getCurrentPosition()
      if (!this.$refs.Lmap) { return }
      this.$refs.Lmap.mapObject.setView(L.latLng(coords.latitude, coords.longitude), 12)
    },
    selectedFile () {
      this.isLoading = true
      const file = this.files[0]
      this.isLoading = false
      if (!file || !(file.type === 'text/plain' || file.type === 'application/json')) {
        this.errorMsg = 'Can\'t Open file for parsing'
        this.error = true
        return
      }

      const reader = new FileReader()
      reader.readAsText(file, 'UTF-8')
      reader.onload = (evt) => {
        let updFile = evt.target.result
        if (file.type === 'application/json') {
          updFile = JSON.parse(updFile)
        } else {
          const areaNames = updFile.match(/\[.+]/g).map(n => n.replace(/[\]["]/g, ''))
          const areaLocs = updFile.split(/\[.+]/g).filter(a => a).map((loc) => {
            const locArray = loc.split('\n').filter(a => a)
            return locArray.map((line) => {
              const coords = line.split(',')
              return [+coords[0], +coords[1]]
            }).filter(x => x[0] && x[1])
          })
          const result = []
          areaNames.forEach((key, idx) => { result.push({ name: key, color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, id: idx.toString(), path: areaLocs[idx] }) })
          updFile = result
        }
        if (updFile.type === 'FeatureCollection') {
          updFile = convertFromFeatures(updFile)
        }
        if (!updFile.length) {
          this.errorMsg = 'No geofences in file'
          this.error = true
          console.error('no areas in geofence file')
          return
        }
        updFile.forEach((area) => {
          if (!area.name || !area.color || !area.id.toString() || !area.path || !area.path.length) {
            this.errorMsg = 'geofence file dosn\'t have needed fields'
            this.error = true
            console.error('geofence file dosn\'t have needed fields')
          }
        })
        updFile.filter(area => !this.geofences.find(a => a.name === area.name))
        this.geofences = [...this.geofences, ...updFile]

        this.mapStopScrolling()
      }
      reader.onerror = (evt) => {
        console.error(evt)
        this.errorMsg = 'geofence file unhappy' + evt
        this.error = true
      }
    },

    addGeofence () {
      this.loading = true
      if (!this.currentResult.geojson.type || !(this.currentResult.geojson.type === 'Polygon' || this.currentResult.geojson.type === 'MultiPolygon')) {
        console.error('can\'t make a geofence of this result')
        this.errorMsg = 'can\'t make a geofence of this result'
        this.error = true
        return
      }
      const coords = this.currentResult.geojson.type === 'Polygon' ? [ this.currentResult.geojson.coordinates ] : this.currentResult.geojson.coordinates
      for (const area in coords) {
        const path = []
        const geopath = []
        const currentLoc = { lat: 0, lon: 0 }

        let tempStep = this.minStep
        let first = true
        coords[area][0].forEach((coord) => {
          if (first || (this.getDistance(currentLoc, { lat: coord[1], lon: coord[0] }) > tempStep)) { // eslint-disable-line
            path.push([coord[1], coord[0]])
            geopath.push([coord[0], coord[1]])
            tempStep = this.minStep
          } else {
            tempStep = tempStep - this.getDistance(currentLoc, { lat: coord[1], lon: coord[0] })
          }
          currentLoc.lat = coord[1]
          currentLoc.lon = coord[0]
          first = false
        })
        let maxId = 0
        this.geofences.map((obj) => {
          if (obj.id > maxId) { maxId = obj.id }
        })
        if (path.length > 3) {
          this.geofences.push({
            name: !area ? this.searchString : (this.searchString + area),
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            id: maxId + 1,
            path

          })
        }
      }
      this.mapStopScrolling()
      this.loading = false
    },
    removeGeofence (name) {
      this.geofences = this.geofences.filter(geofence => geofence.name !== name)
      this.rawAreaLayer.clearLayers()
      this.rawGeofenceLayer.clearLayers()
      this.rawAreaLayer.clearLayers()
    },
    getDistance (start, end) {
      if (typeof (Number.prototype.toRad) === 'undefined') {
        Number.prototype.toRad = function toRad () { // eslint-disable-line
          return this * Math.PI / 180
        }
      }
      const earthRadius = 6371 * 1000
      let lat1 = parseFloat(start.lat)
      let lat2 = parseFloat(end.lat)
      const lon1 = parseFloat(start.lon)
      const lon2 = parseFloat(end.lon)

      const dLat = (lat2 - lat1).toRad()
      const dLon = (lon2 - lon1).toRad()
      lat1 = lat1.toRad()
      lat2 = lat2.toRad()

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const d = earthRadius * c
      return Math.ceil(d)
    }
  }
}

</script>

<style scoped>

  #searchBox{
    width: 100px;
    background: transparent;

  }
  .search{
    top: -10px;
    z-index: 9000;
    background: transparent;
  }
  .foundAreas{
    z-index: 999;
    align-items:right;
    right: 0;
    opacity: 100 !important;
  }
  .searchResultBox{
    right: 0;
    float: right;
    z-index: 9999;
    background: transparent;
    opacity: .94;
  }
  .geofencesArea{
    left: 0;
    float: left;
    z-index: 9999;
    background: transparent;
    opacity: .94;

  }
  .popup {
    border: 2px solid gray;
    height:30px;
    width:50px;
  }

  .slide-fade-enter-active {
    transition: all .6s ease;
  }
  .slide-fade-leave-active {
    transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
  }
  .slide-fade-enter{
    transform: translateX(10px);
    opacity: 1;
  }
  .transparent {
    background-color: transparent!important;
    border-color: transparent!important;
  }

  .makeGeofenceButton {
    z-index: 999999999999999999;
    position:relative;
    float: right;
    right: 2px;
  }
  .wrapper {
    height: 100%;
    overflow-Y: hidden;
    position: fixed;
    left:0;
    width: 100%;
    height: 100%;
  }

  .scroll {
    overflow-Y: auto;
    position: relative;
  }

</style>
