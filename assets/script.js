var App = new Object();

// Config
const PUBNUB_CHANNEL = "where-is-cindy-test";
const PUBNUB_PUBLISH_KEY = "pub-c-9e005e61-141d-4a00-a3f9-c5c90ae0d686";
const PUBNUB_SUBSCRIBE_KEY = "sub-c-6aedd952-15aa-11ec-9d3c-1ae560ca2970";
const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoiZDJjbG9uIiwiYSI6ImNrdGtsZzV4NzFtdW4ydmpvZGNxamFjcTgifQ.UptWAKLgJmElEj6maC4bWQ";

// PubNub
App.PubNub = new Object();

App.PubNub.setup = function() {
  App.PubNub.channel = PUBNUB_CHANNEL;
  App.PubNub.api = new PubNub({
    publishKey: PUBNUB_PUBLISH_KEY,
    subscribeKey: PUBNUB_SUBSCRIBE_KEY
  });

  App.PubNub.api.subscribe({channels: [PUBNUB_CHANNEL]});
  App.PubNub.api.addListener({message: App.PubNub.messageReceived});
}

App.PubNub.messageReceived = function(payload) {
  console.debug("App.PubNub.messageReceived", payload);
  App.Map.updatePosition(payload.message.latitude, payload.message.longitude);
}

App.PubNub.publishPosition = function(latitude, longitude) {
  App.PubNub.api.publish({ channel: PUBNUB_CHANNEL, message: { latitude: latitude, longitude: longitude }});
}

// Maps
App.Map = new Object();

App.Map.setup = function(mapid, draggable = false) {
  App.Map.map = L.map(mapid).setView([52.5050984, 13.4797039], 13);

  L.tileLayer(
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: "mapbox/streets-v11",
      tileSize: 512,
      zoomOffset: -1,
      accessToken: MAPBOX_ACCESS_TOKEN
    }
  ).addTo(App.Map.map);

  var markerIcon = L.icon({
    iconUrl: "../assets/marker.png",
    shadowUrl: "../assets/marker_shadow.png",
    iconSize:     [75, 100], // size of the icon
    iconAnchor:   [40, 100], // point of the icon which will correspond to marker's location
    shadowSize:   [90, 60], // size of the shadow
    shadowAnchor: [3, 59],  // the same for the shadow
    // popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  App.Map.marker =
    L.marker(
      [52.5050984, 13.4797039],
      {
        draggable: draggable,
        autoPan: true,
        icon: markerIcon
      }
    ).addTo(App.Map.map);

  if(draggable)
    App.Map.marker.on("dragend", App.Map.markerDragend);
}

App.Map.markerDragend = function(payload) {
  console.log("App.Map.markerDragend", payload);

  var coordinates = payload.target.getLatLng();
  App.PubNub.publishPosition(coordinates.lat, coordinates.lng);
}

App.Map.updatePosition = function(latitude, longitude) {
  console.log("App.Map.updatePosition", latitude, longitude);

  App.Map.marker.setLatLng([latitude, longitude]);
  App.Map.map.panTo([latitude, longitude]);
}

// Geolocation
App.Geo = new Object();

App.Geo.getLocation = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(App.Geo.publishPosition);
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

App.Geo.publishPosition = function (position) {
  App.PubNub.publishPosition(position.coords.latitude, position.coords.longitude);
}
