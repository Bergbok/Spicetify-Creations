# Playlist Tags

Introduces an improved way of organizing and sharing playlists.

> If you like it, please consider starring it on GitHub 🌟

## Feature Showcase

<p align="center">
  <img src="https://github.com/Bergbok/Spicetify-Creations/assets/66174189/0a6eba1b-6038-4661-b5b4-67c43cc07194"/></img>
</p>

> Tags can be excluded using the ! character

<p align="center">
  <img src="https://github.com/Bergbok/Spicetify-Creations/assets/66174189/2d368f0e-e48f-49b0-8d60-2401f3a7baf9"/></img>
</p>

> V1.4: Now supports AND/OR filter options

<p align="center">
  <img src="https://github.com/Bergbok/Spicetify-Creations/assets/66174189/d1f0a204-6f3e-460e-8e5b-dc756d9c584e"/></img>
</p>

### Adding Tags

<p align="center">
  <img src="https://github.com/Bergbok/Spicetify-Creations/assets/66174189/df48a94e-a8f3-4c52-a7b6-5dbf194f0a52"/></img>
</p>
<p align="center">
  <img src="https://github.com/Bergbok/Spicetify-Creations/assets/66174189/94e49b0d-8f91-44b5-bca2-181c077fad5c"/></img>
</p>

### Removing Tags

Tags can be removed by right-clicking them.
<br>
Right-clicking a tag on the "Search" or "All Tags" pages removes them from all playlists.

<p align="center">
  <img src="https://github.com/Bergbok/Spicetify-Creations/assets/66174189/d3f45537-c508-42aa-b4bf-5a860e352649"/></img>
</p>

### Settings

<p align="center">
  <img src="https://github.com/Bergbok/Spicetify-Creations/assets/66174189/297da8c6-8f69-426a-ae96-8a0e2f4ccf7a"/></img>
</p>
<p align="center">
  <img src="https://github.com/Bergbok/Spicetify-Creations/assets/66174189/d151b2fa-b71f-43cf-9d63-727a0d9dd475"/></img>
</p>

> Implemented using spcr-settings

Enabling "Use metadata cache" and "Use tracklist cache" speeds up searches and playing a lot, however it also takes up space in Spotify's local storage which is limited to ~10MB. 
<br>
Each track takes up ~0.2-0.4KB, so keep that in mind when caching large amounts of playlists like me. 
<br>
In the event that you get a notification saying "Maximum local storage qouta reached!", use the "Remove tracklist cache" button.
<br>
To see how much space is being used by tags use the "Copy local storage key sizes" option.

The import/export tags option can be used to import tags from other users as well, you can get my tags here: 
- https://gist.github.com/Bergbok/c7503bcb7ba2699ae10830b5aacbf333 (takes up ~2MB of local storage)

Threshold for [artist:VA] tag corresponds to the amount of artists a playlist can contain before it gets tagged as [artist:VA] instead.

## Installation

1. Install Spicetify ([guide](https://spicetify.app/docs/advanced-usage/installation))
2. Download it from [here](https://github.com/Bergbok/Spicetify-Creations/archive/refs/heads/dist/playlist-tags.zip)
3. Run `spicetify config-dir` in a terminal
4. Extract the zip into the CustomApps folder
5. Rename the extracted folder to `playlist-tags`
6. Run `spicetify config custom_apps playlist-tags`
7. Run `spicetify apply`

> If you get stuck check out [Spicetify's official guide](https://spicetify.app/docs/advanced-usage/custom-apps/).

If you have any feature requests/bug reports feel free to [open a issue](https://github.com/Bergbok/Spicetify-Creations/issues/new/choose)!

## Credits

- Made with [Spicetify Creator](https://github.com/FlafyDev/spicetify-creator)
- [harbassan](https://github.com/harbassan/) -  [spotify_card.tsx](https://github.com/harbassan/spicetify-apps/blob/main/shared/components/spotify_card.tsx), [text_input_dialog.tsx](https://github.com/harbassan/spicetify-apps/blob/main/library/src/components/text_input_dialog.tsx)
- [FlafyDev](https://github.com/FlafyDev) - [spcr-settings](https://github.com/FlafyDev/spicetify-creator-plugins/tree/main/packages/spcr-settings), [spcr-navigation-bar](https://github.com/FlafyDev/spicetify-creator-plugins/tree/main/packages/spcr-navigation-bar)

## License

This repository is licensed under the [MIT License](https://github.com/Bergbok/Spicetify-Creations/blob/main/LICENSE).
