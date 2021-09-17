# WhereIsCindy

Test concept for real time geolocation sharing through HTML5

Using HTML5 Geolocation API and PubNub as backend this application is sending the geolocation of the _publisher_
and everybody in the _subscriber_ page will receive this location in real time.

## API keys

To prevent storing the API keys in the code the application is expecting to receive the API keys in the **URL params**:

- **pubnub_channel**: The PubNub channel to emit/receive the events
- **pubnub_publish_key**: The PubNub Publisher key
- **pubnub_subscribe_key**: The PubNub Subscriber key
- **mapbox_access_token**: The MapBox API key

## How to use the App

Create an account in PubNub and get the Publisher and Subscriber key

- PubNub: https://www.pubnub.com/

Create an account in MapBox and get the API key:

- MapBox: https://www.mapbox.com/


## Publisher

    /publisher/index.html?pubnub_channel=PUBNUB_CHANNEL&pubnub_publish_key=PUBNUB_PUBLISH_KEY&pubnub_subscribe_key=PUBNUB_SUBSCRIBE_KEY&mapbox_access_token=MAPBOX_ACCESS_TOKEN

## Subscriber

    /subscribe/index.html?pubnub_channel=PUBNUB_CHANNEL&pubnub_publish_key=PUBNUB_PUBLISH_KEY&pubnub_subscribe_key=PUBNUB_SUBSCRIBE_KEY&mapbox_access_token=MAPBOX_ACCESS_TOKEN
