# ha-Bioscoop
Movie Card for HomeAssistant

<p align="center">
  <img src="https://user-images.githubusercontent.com/38769179/121244564-4bae4700-c89f-11eb-8ae4-c86a1483610e.png">
</p>

Search for movies and series from the JustWatch service.
And play them directly from the card to your android device.

Click the film or tv icon to filter searches by movie, tv-show or both.

**How to install**:

  Download the "bioscoop.js" file
  
  Place it into your config/www folder
  
  Then
  ```
  Go to configuration
    => Lovelace Dashboards
      =>  Resources
```
Add the following resources:

    /local/bioscoop.js
    type: Javascript module
    
**How to use**:

When installed you can add the card

Chose manual and add the following code:
```
type: 'custom:bioscoop-card'
media_device: media_player.android_tv_1
poster_count: 3
media_region: en
```

You can change the poster count to your liking

Make sure to select the proper media_player.

This uses the android ADB command

Default media region: NL

*configuration.yaml*
```
media_player:
  # Use the Python ADB implementation
  - platform: androidtv
    name: Android TV 1
    host: 192.168.1.1
```
    
Currently only Netflix is supported as provider, more comming soon.

**Todo**:
- Make easy install (Learn how HACS works)
- Add different providers
- Create easy edit menu
