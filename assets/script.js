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
  App.PubNub.api.addListener({message: App.PubNub.debug});
}

App.PubNub.debug = function(payload) {
  console.debug("pubnubDebug", payload);
}

// Maps
App.Map = new Object();

App.Map.setup = function(mapid) {
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

  App.Map.marker =
    L.marker(
      [52.5050984, 13.4797039],
      {
        draggable: true,
        autoPan: true
      }
    ).addTo(App.Map.map);

  App.Map.marker.on("dragend", App.Map.markerDragend);
}

App.Map.markerDragend = function(payload) {
  console.log("markerDragend", payload);
  console.log("position", payload.target.getLatLng());

  var coordinates = payload.target.getLatLng();
  App.Geo.updatePosition(coordinates.lat, coordinates.lng);
}

// Geolocation
App.Geo = new Object();

App.Geo.getLocation = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(App.Geo.updatePositionFromCurrentPosition);
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

App.Geo.updatePositionFromCurrentPosition = function (position) {
  App.Geo.PUBNUB_SUBSCRIBE_KEYupdatePosition(position.coords.latitude, position.coords.longitude);
}

App.Geo.updatePosition = function(latitude, longitude) {
  console.log("updatePosition", latitude, longitude);

  App.Map.marker.setLatLng([latitude, longitude]);
  App.Map.map.panTo([latitude, longitude]);
  App.PubNub.api.publish({ channel: PUBNUB_CHANNEL, message: { latitude: latitude, longitude: longitude }});
}
