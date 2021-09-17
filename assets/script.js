// Config
const urlParams = new URLSearchParams(window.location.search);
const PUBNUB_CHANNEL = urlParams.get("pubnub_channel"); // "where-is-cindy-test";
const PUBNUB_PUBLISH_KEY = urlParams.get("pubnub_publish_key"); // "pub-c-9e005e61-141d-4a00-a3f9-c5c90ae0d686";
const PUBNUB_SUBSCRIBE_KEY = urlParams.get("pubnub_subscribe_key"); // "sub-c-6aedd952-15aa-11ec-9d3c-1ae560ca2970";
const MAPBOX_ACCESS_TOKEN = urlParams.get("mapbox_access_token"); // "pk.eyJ1IjoiZDJjbG9uIiwiYSI6ImNrdGtsZzV4NzFtdW4ydmpvZGNxamFjcTgifQ.UptWAKLgJmElEj6maC4bWQ"; // URL protected
// example: ?pubnub_channel=where-is-cindy-test&pubnub_publish_key=pub-c-9e005e61-141d-4a00-a3f9-c5c90ae0d686&pubnub_subscribe_key=sub-c-6aedd952-15aa-11ec-9d3c-1ae560ca2970&mapbox_access_token=pk.eyJ1IjoiZDJjbG9uIiwiYSI6ImNrdGtsZzV4NzFtdW4ydmpvZGNxamFjcTgifQ.UptWAKLgJmElEj6maC4bWQ

var App = new Object();

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

  App.PubNub.getHistory();
}

App.PubNub.messageReceived = function(payload) {
  console.debug("App.PubNub.messageReceived", payload);
  App.Map.updatePosition(payload.message.latitude, payload.message.longitude, payload.message.time);
}

App.PubNub.publishPosition = function(latitude, longitude) {
  const message = {
    latitude: latitude,
    longitude: longitude,
    time: Date.now()
  }

  App.PubNub.api.publish({ channel: PUBNUB_CHANNEL, message: message});
}

App.PubNub.getHistory = function() {
  const hour = 1000 * 60 * 60;
  const now = Date.now();
  const oneHourAgo = Date.now() - hour;

  console.log("now", now);
  console.log("oneHourAgo", oneHourAgo);

  try {
    const messages =
      App.PubNub.api.fetchMessages(
        {
          channels: [PUBNUB_CHANNEL],
          start: (now * 10000).toString(), // building timetoken https://www.pubnub.com/docs/sdks/javascript/api-reference/misc#time
          end: (oneHourAgo * 10000).toString(), // building timetoken https://www.pubnub.com/docs/sdks/javascript/api-reference/misc#time
          count: 25

          // channels: ["ch1", "ch2", "ch3"],
          // start: "1631876025383",
          // end: "1631872425383",
          // count: 25,

          // channels: ["ch1", "ch2", "ch3"],
          // start: "15343325214676133",
          // end: "15343325004275466",
          // count: 25,
        },
        App.PubNub.digestHistory
      );

    return messages;
  } catch (error) {
    console.error(error);
  }
}

App.PubNub.digestHistory = function(status, response) {
  console.log("digestHistory", status, response);

  console.log(response.channels[PUBNUB_CHANNEL])

  if(response.channels[PUBNUB_CHANNEL] == null) {
    console.error("Capture when no events available");
  } else {
    response.channels[PUBNUB_CHANNEL].forEach(element => {
      console.log("message", element.message);
      const minimumDistanceMeters = 100;
      App.Map.addHistoryMarkerIfMinimumDistance(element.message.latitude, element.message.longitude, element.message.time, "small", false, minimumDistanceMeters);
    });
  }
}

App.PubNub.deleteHistory = function() {
  App.PubNub.api.deleteMessages({ channel: PUBNUB_CHANNEL });
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

  App.Map.MIN_DISTANCE_MARKERS = 250; // in meters
  App.Map.actualMarker = null;
}

App.Map.markerDragend = function(payload) {
  console.log("App.Map.markerDragend", payload);

  var coordinates = payload.target.getLatLng();
  App.PubNub.publishPosition(coordinates.lat, coordinates.lng);
}

App.Map.updatePosition = function(latitude, longitude, time) {
  console.log("App.Map.updatePosition", latitude, longitude, time);

  App.Map.setActualMarker(latitude, longitude, time);
  App.Map.map.panTo([latitude, longitude]);
}

App.Map.markerBigIcon = L.icon({
  iconUrl: "../assets/marker.png",
  shadowUrl: "../assets/marker_shadow.png",
  iconSize:     [75, 100], // size of the icon
  iconAnchor:   [40, 100], // point of the icon which will correspond to marker's location
  shadowSize:   [81, 87], // size of the shadow
  shadowAnchor: [7, 82],  // the same for the shadow
  popupAnchor:  [-3, -90] // point from which the popup should open relative to the iconAnchor
});

App.Map.markerSmallIcon = L.icon({
  iconUrl: "../assets/marker.png",
  shadowUrl: "../assets/marker_shadow.png",
  iconSize:     [37, 50], // size of the icon
  iconAnchor:   [20, 50], // point of the icon which will correspond to marker's location
  shadowSize:   [40, 43], // size of the shadow
  shadowAnchor: [4, 41],  // the same for the shadow
  popupAnchor:  [-2, -45] // point from which the popup should open relative to the iconAnchor
});

App.Map.createMarker = function (latitude, longitude, time, size = "big", draggable = false){
  console.log("App.Map.createMarker", latitude, longitude, time, size, draggable);

  const markerIcon = size == "big" ? App.Map.markerBigIcon : App.Map.markerSmallIcon;
  const zIndex = size == "big" ? 1 : 0;

  const marker =
    L.marker(
      [latitude, longitude],
      {
        draggable: draggable,
        autoPan: true,
        icon: markerIcon,
        zIndexOffset: zIndex
      }
    ).addTo(App.Map.map);

  const dateFormatted = new Date(time).toLocaleString()
  marker.bindPopup(dateFormatted);

  if(draggable)
    marker.on("dragend", App.Map.markerDragend);

  return marker;
}

App.Map.setActualMarker = function (latitude, longitude, time) {
  if(App.Map.actualMarker == null) {
    App.Map.actualMarker = App.Map.createMarker(latitude, longitude, time, "big");
  }

  App.Map.actualMarker.setLatLng([latitude, longitude]); // .update();

  const lastMarker = App.Map.historyMarkers.pop();

  if(lastMarker == null) {
    App.Map.addHistoryMarker(latitude, longitude, time, "small");
  } else {
    const distanceBetweenMarkers = getDistanceFromLatLonInM(lastMarker.getLatLng().lat, lastMarker.getLatLng().lng, latitude, longitude);

    if (distanceBetweenMarkers > App.Map.MIN_DISTANCE_MARKERS) {
      App.Map.addHistoryMarker(latitude, longitude, time, "small");
    }
  }
}

App.Map.historyMarkers = [];

App.Map.addHistoryMarkerIfMinimumDistance = function (latitude, longitude, time, size = "big", draggable = false){
  const lastMarker = App.Map.historyMarkers.pop();

  if(lastMarker == null) {
    App.Map.addHistoryMarker(latitude, longitude, time, size, draggable);
  } else {
    const previousMarkerCoordinates = lastMarker.getLatLng();
    const distanceToPreviousMarker = getDistanceFromLatLonInM(latitude, longitude, previousMarkerCoordinates.lat, previousMarkerCoordinates.lng);

    console.log("addMarkerIfMinimumDistance.distance", distanceToPreviousMarker);

    if(distanceToPreviousMarker > App.Map.MIN_DISTANCE_MARKERS) {
      App.Map.addHistoryMarker(latitude, longitude, time, size, draggable);
    }
  }
}

App.Map.addHistoryMarker = function (latitude, longitude, time, size = "big", draggable = false){
  console.log("App.Map.addHistoryMarker", latitude, longitude, time, size, draggable);
  const marker = App.Map.createMarker(latitude, longitude, time, size, draggable)
  App.Map.historyMarkers.push(marker);
}

App.Map.createDraggableMarker = function() {
  const marker = App.Map.createMarker(52.5050984, 13.4797039, Date.now(), "big", true);
  App.Map.actualMarker = marker;
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

// Share button
App.Share = new Object();

App.Share.setup = function(element_id) {
  document.getElementById(element_id).addEventListener("click", App.Share.share);
  App.Share.url = window.location.toString().replace("publisher", "subscriber");
}

App.Share.share = function () {
  const shareData = {
    title: "Where is Cindy?",
    text: "Check the actual location of Cindy",
    url: App.Share.url
  }

  try {
    navigator.share(shareData);
  } catch(err) {
    console.error("Error: ", err);
    window.open(App.Share.url, "_blank").focus();
  }
}
