import { MassTagOperation } from './types/mass_tag_operations';
import { PlaylistContents } from './types/playlist_contents';
import { PlaylistMetadata } from './types/playlist_metadata';
import { renderElement } from '@shared/utils/react-utils';
import { waitForElement } from '@shared/utils/dom-utils';
import React from 'react';
import SpotifyCard from './components/spotify_card';
import TextInputDialog from "./components/text_input_dialog";

//////////////////////////////////////// TAGGING FUNCTIONS /////////////////////////////////////////

/**
 * Appends a tag to playlists.
 *
 * @param {string[]} playlist_uris - The URIs of the playlists to append tags to.
 * @param {string} [tag] - The tag to append, if not provided a dialog will be shown.
 */
function appendTag(playlist_uris: string[], tag?: string): void {
  const onSave = (value: string) => {
    playlist_uris.forEach(playlist_uri => {
      const current_value = Spicetify.LocalStorage.get('tags:' + playlist_uri);
      const current_tags = current_value ? JSON.parse(current_value) : [];
      const new_tags = value.trim().split(' ').reduce((unique_tags, tag) => {
        if (!current_tags.includes(tag)) {
            unique_tags.push(tag);
        }
        return unique_tags;
      }, [...current_tags]);

      try {
        Spicetify.LocalStorage.set('tags:' + playlist_uri, JSON.stringify(new_tags)); 
      } catch (DOMExcpection) {
        Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.', true);
      }

      if (current_value === null) {
        registerPlaylistAsTagged(playlist_uri);
      }
    });
    if (Spicetify.Platform.History.location.pathname.startsWith('/playlist/')) {
      removePlaylistPageElements();
      renderPlaylistPageElements(getPlaylistTags(getCurrentPageURI()));
    }
  };

  if (tag) {
    onSave(tag);
    return;
  }

  Spicetify.PopupModal.display({
      title: "Add Tags",
      // @ts-ignore
      content: <React.Fragment>
                  <TextInputDialog def={""} placeholder="..." onSave={onSave}/>
                  {/* <br></br><p style={{color: 'var(--spice-subtext)'}}>To add multiple tags, seperate them with a space</p> */}
               </React.Fragment>,
  });
};

/**
 * Removes a tag from a playlist.
 *
 * @param {string} playlist_uris - The URI of the playlist to remove the tag from.
 * @param {string} tag - The tag to remove.
 */
function removeTag(playlist_uri: string, tag: string): void {
  let current_value = Spicetify.LocalStorage.get('tags:' + playlist_uri);
  let current_tags = current_value ? JSON.parse(current_value) : [];
  let new_tags = current_tags.filter((t: string) => t !== tag);

  try {
    Spicetify.LocalStorage.set('tags:' + playlist_uri, JSON.stringify(new_tags));  
  } catch (DOMExcpection) {
    Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.', true);
  }
  
  if (new_tags.length === 0) {
    deregisterPlaylistAsTagged(playlist_uri);
  }
};

/**
 * Registers a playlist as tagged by adding it to the taggedPlaylistURIs array.
 *
 * @param {string} playlist_uri - The URI of the playlist to register.
 */
function registerPlaylistAsTagged(playlist_uri: string): void {
  const stored_value = Spicetify.LocalStorage.get('tags:taggedPlaylistURIs');
  const tagged_playlists = stored_value ? JSON.parse(stored_value) : [];

  if (!tagged_playlists.includes(playlist_uri)) {
    tagged_playlists.push(playlist_uri);
  }

  try {
    Spicetify.LocalStorage.set('tags:taggedPlaylistURIs', JSON.stringify(tagged_playlists));
  } catch (DOMExcpection) {
    Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.', true);
  }
};

/**
 * Deregisters a playlist as tagged by removing it from the taggedPlaylistURIs array.
 *
 * @param {string} playlist_uri - The URI of the playlist to deregister.
 */
function deregisterPlaylistAsTagged(playlist_uri: string): void {
  Spicetify.LocalStorage.remove('tags:' + playlist_uri);
  const stored_value = Spicetify.LocalStorage.get('tags:taggedPlaylistURIs');
  const tagged_playlists = stored_value ? JSON.parse(stored_value) : [];
  const filtered_playlists = tagged_playlists.filter((uri: string) => uri !== playlist_uri);

  try {
    Spicetify.LocalStorage.set('tags:taggedPlaylistURIs', JSON.stringify(filtered_playlists));
  } catch (DOMExcpection) {
    Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.', true);
  }
};

/**
 * Appends tags to all playlists in a folder.
 *
 * @param {string} folder_uri - The URI of the folder to append tags to.
 * @returns {Promise<void>} A Promise that resolves when the operation is complete.
 */
export async function appendTagsToFolderPlaylists(folder_uri: string): Promise<void> {
  const rootlist = await Spicetify.Platform.RootlistAPI.getContents();
  let folder_data = findFolder(rootlist, folder_uri);
  if (folder_data) {
    appendTag(getFolderPlaylistURIs(folder_data));
  }
};

/**
 * Appends a tag to all playlists based on the specified operation.
 * 
 * @param {MassTagOperation} operation - The operation to perform.
 * @param {string} [tag] - The tag to append (optional).
 * @returns {Promise<void>} A Promise that resolves when the operation is complete.
 */
export async function appendTagToAllPlaylists(operation: MassTagOperation, tag?: string, exclude_non_english_chars?: boolean, va_threshold?: number): Promise<void> {
  const rootlist = await Spicetify.Platform.RootlistAPI.getContents();
  for (let i = 0; i < rootlist.items.length; i++) {
    if (operation === MassTagOperation.AddArtistTag) {
      await processPlaylists(rootlist.items[i], operation, tag, exclude_non_english_chars, va_threshold);
    } else {
      await processPlaylists(rootlist.items[i], operation, tag);
    }
  }
  Spicetify.showNotification('Finished processing playlists');
};

/**
 * Removes a specified tag from all tagged playlists.
 * @param regex - The regular expression used to match the tag.
 * @param less_than_count - The minimum count the tag must be assigned to be removed. Defaults to 0.
 */
export function removeTagFromAllPlaylists(regex: RegExp, less_than_count: number = 0): void {
  const uris: string[] = JSON.parse(Spicetify.LocalStorage.get('tags:taggedPlaylistURIs') || '[]');
  const tag_counts: Record<string, number> = {};

  // Determine tag counts
  if (less_than_count > 0) {
    uris.forEach(uri => {
      const tags = JSON.parse(Spicetify.LocalStorage.get('tags:' + uri) || '[]');
      tags.forEach((tag: string) => {
        tag_counts[tag] = (tag_counts[tag] || 0) + 1;
      });
    });
  };

  // Loop through all tagged playlists
  uris.forEach(uri => {
    let tags = JSON.parse(Spicetify.LocalStorage.get('tags:' + uri) || '[]');

    // Filter the tags
    tags = tags.filter((t: string) => {
      return !regex.test(t) || (less_than_count > 0 && tag_counts[t] >= less_than_count);
    });

    // Update the tags in local storage
    try {
      Spicetify.LocalStorage.set('tags:' + uri, JSON.stringify(tags)); 
    } catch (DOMExcpection) {
      Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.', true);
    }

    // If the playlist doesn't have any tags left, deregister it as tagged
    if (tags.length === 0) {
      deregisterPlaylistAsTagged(uri);
    }
  });
};

/**
 * Handles mass tagging operations.
 *
 * @param {any} item - The item to process.
 * @param {MassTagOperation} operation - The operation to perform.
 * @param {string} [tag] - The tag to append, currently only used for the AddLocalFilesTag and AddUnplayableTag operations.
 * @param {boolean} [exclude_non_english_chars] - Whether or not to exclude artists with non-english characters from the AddArtistTag operation.
 * @param {number} [va_threshold] - The threshold for the AddArtistTag operation.
 * @todo Add type for the item object.
 */
async function processPlaylists(item: any, operation: MassTagOperation, tag?: string, exclude_non_english_chars: boolean = true, va_threshold: number = 5): Promise<void> {
  // If the item is a folder, processes each item in the folder
  if (item.type === 'folder') {
    for (let i = 0; i < item.items.length; i++) {
      await processPlaylists(item.items[i], operation, tag);
    }
  } else if (item.type === 'playlist') {
    const item_tags = JSON.parse(Spicetify.LocalStorage.get('tags:' + item.uri.replace('spotify:playlist:','')) || '[]');
    switch (operation) {
      case MassTagOperation.AddArtistTag:
        if (!item_tags.some((tag: string) => tag.startsWith('[artist:'))) {
          const playlist_contents: PlaylistContents = await Spicetify.Platform.PlaylistAPI.getContents(item.uri);
          
          // Gets the artists of all items
          let artists = playlist_contents.items
            .filter(item => item.artists && item.artists.length > 0)
            .flatMap(item => item.artists.map(artist => artist.name.trim().split(/,|;| - /).map(name => name.trim())))
            .flat()
          
          if (exclude_non_english_chars) {
            artists = artists.filter(artist => {
              const is_match = /[^\u0000-\u05C0\u2100-\u214F“”’・€]+/.test(artist);
              if (is_match) {
                console.log(`Artist "${artist}" failed the regex test.`);
              }
              return !is_match;
            });
          }
          
          // Creates a set from the artists array
          const unique_artists = new Set(artists);
          
          // Checks the size of the unique_artists set
          if (unique_artists.size <= va_threshold) {
            for (const artist_name of unique_artists) {
              let formatted_artist_name = artist_name.replace(/ /g, '-');
              if (formatted_artist_name === 'Various-Artists' || formatted_artist_name === 'Various' || formatted_artist_name === 'V.A.' || formatted_artist_name === 'V A') {
                formatted_artist_name = 'VA';
              }
              appendTag([item.uri.replace('spotify:playlist:','')], '[artist:' + formatted_artist_name + ']');
              console.log('Added "[artist:' + formatted_artist_name + ']" tag to:', item.uri);
            }
          } else {
            appendTag([item.uri.replace('spotify:playlist:','')], '[artist:VA]');
            console.log('Added "[artist:VA]" tag to:', item.uri);
          }
          break;
        }
        break;
      case MassTagOperation.AddCreatorDisplayNameTag:
        if (!item_tags.some((tag: string) => tag.startsWith('[by:'))) {
          const playlist_metadata: PlaylistMetadata = await Spicetify.Platform.PlaylistAPI.getMetadata(item.uri);
          const creator_display_name = playlist_metadata.owner.displayName.replace(/ /g, '-');
          appendTag([item.uri.replace('spotify:playlist:','')], '[by:' + creator_display_name + ']');
          console.log('Added "[by:' + creator_display_name + ']" tag to:', item.uri);
          break;
        }
        break;
      case MassTagOperation.AddLocalFilesTag:
        if (!item_tags.includes('[contains-local-files]')) {
          const playlist_contents: PlaylistContents = await Spicetify.Platform.PlaylistAPI.getContents(item.uri);
          const contains_local_files = playlist_contents.items.some(item => item.isLocal);
          if (contains_local_files) {
            appendTag([item.uri.replace('spotify:playlist:','')], tag);
            console.log('Added "' + tag + '" tag to:', item.uri);
          }
          break;
        }
        break;
      case MassTagOperation.AddUnplayableTag:
        if (!item_tags.some((tag: string) => tag.includes('[unplayable]'))) {
          const playlist_metadata: PlaylistMetadata = await Spicetify.Platform.PlaylistAPI.getMetadata(item.uri);
          const can_play = playlist_metadata.canPlay;
          if (!can_play) {
            appendTag([item.uri.replace('spotify:playlist:','')], tag);
            console.log('Added "' + tag + '" tag to:', item.uri);
            break;
          }
        }
        break;
      case MassTagOperation.AddYearTag:
        if (!item_tags.some((tag: string) => tag.startsWith('[year:'))) {
          const playlist_metadata: PlaylistMetadata = await Spicetify.Platform.PlaylistAPI.getMetadata(item.uri);
          const year = playlist_metadata.description.substring(0, 4);
          if (year.match(/^\d{4}/)) {
            appendTag([item.uri.replace('spotify:playlist:','')], '[year:' + year + ']');
            console.log('Added "[year:' + year + ']" tag to:', item.uri);
          }
        }
        break;
    }
  }
};

////////////////////////////////////// GENERAL GET FUNCTIONS ///////////////////////////////////////

/**
 * Recursively searches for a folder with the specified URI in the given root object.
 * @param {any} root - The root object to search in.
 * @param {string} folder_uri - The URI of the folder to find.
 * @returns {any} The found folder object.
 * @todo Add types for the root and folder objects.
 */
function findFolder(root: any, folder_uri: string): any {
  if (root.uri === folder_uri) {
    return root;
  }

  for (let item of root.items) {
    if (item.type === 'folder') {
      let found_folder = findFolder(item, folder_uri);
      if (found_folder) {
        return found_folder;
      }
    }
  }
};

/**
 * Gets the playlists in a folder.
 * 
 * @param {any} folder_data - The folder to get the playlists of.
 * @returns {string[]} An array of playlist URIs.
 * @todo Add type for the folder object.
 */
function getFolderPlaylistURIs(folder_data: any) {
  let playlist_uris: string[] = [];
  for (let item of folder_data.items) {
    if (item.type === 'playlist') {
      playlist_uris.push(item.uri.replace('spotify:playlist:', ''));
    } else if (item.type === 'folder') {
      playlist_uris = playlist_uris.concat(getFolderPlaylistURIs(item));
    }
  }
  return playlist_uris;
};

/**
 * Gets all unique tags from all tagged playlists.
 * 
 * @param {string} sorting_option - The sorting option to use (A-Z/Z-A).
 * @returns {string[]} An array of unique tags.
 */
export function getAllTags(sorting_option: string): string[] {
  let unique_tags: string[] = JSON.parse(Spicetify.LocalStorage.get('tags:taggedPlaylistURIs') || '[]').reduce((unique_values: string[], uri: string) => {
    const tags = JSON.parse(Spicetify.LocalStorage.get('tags:' + uri) || '[]');
    tags.forEach((tag: string) => {
      if (!unique_values.includes(tag)) {
        unique_values.push(tag);
      }
    });
    return unique_values;
  }, []);

  unique_tags = sortTags(unique_tags, sorting_option);

  return unique_tags;
};

/**
 * Gets the URI of the current page.
 * 
 * @returns {string} Everything after the second slash in the current URI (lastVisitedLocation local storage key value).
 */
export function getCurrentPageURI() {
  return Spicetify.Platform.History.location.pathname.split('/').slice(2).join('/') ?? '';;
};

/**
 * Gets playlist metadata, uses cache if enabled in settings.
 * 
 * @param {string[]} playlist_uris - The URIs of the playlists to get the metadata of.
 * @returns {Promise<PlaylistMetadata[]>} A Promise that resolves with the metadata of the playlists.
 */
export async function getPlaylistMetadata(playlist_uris: string[]): Promise<PlaylistMetadata[]> {
  const use_cache = JSON.parse(Spicetify.LocalStorage.get('playlist-tags-cache-settings.use-contents-cache') || 'false').value;
  const data = await Promise.all(playlist_uris.map(async (uri) => {
    if (use_cache) {
      let metadata_cache: PlaylistMetadata;
      const value = Spicetify.LocalStorage.get('tags:cache:metadata:' + uri)
      if (value) {
        metadata_cache = JSON.parse(value);
        metadata_cache.uri = 'spotify:playlist:' + uri;
        return metadata_cache;
      }
    }
    const playlist_metadata = await Spicetify.Platform.PlaylistAPI.getMetadata('spotify:playlist:' + uri);
    if (use_cache) {
      try {
        Spicetify.LocalStorage.set('tags:cache:metadata:' + uri, JSON.stringify(trimMetadata(playlist_metadata)));
      } catch (DOMExcpection) {
        Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.', true);
      }
    }
    playlist_metadata.desciption = playlist_metadata.description.substring(0, 36);
    return playlist_metadata;
  }));
  return data;
};

/**
 * Gets a playlist tags from local storage.
 * 
 * @param {string} playlist_uri - The URI of the playlist to get the tags of.
 * @returns {string[]} An array of tags for the playlist. If the playlist has no tags, an empty array is returned.
 */
export function getPlaylistTags(playlist_uri: string): string[] {
  const tags = Spicetify.LocalStorage.get('tags:' + playlist_uri);
  return tags ? JSON.parse(tags) : [];
};
  
/**
 * Gets playlists tagged with specified tags.
 * 
 * @param {string[]} tags - Tags to filter by.
 * @param {string} filter_option - The filter option to use (Match Any Tag (OR)/Match All Tags (AND)).
 * @returns {string[]} Array of URIs for playlists tagged with the specified tags.
 */
export function getPlaylistsTaggedAs(tags: string[], filter_option: string): string[] {
  const tagged_playlist_uris = Spicetify.LocalStorage.get('tags:taggedPlaylistURIs');
  if (tagged_playlist_uris) {
    const playlistURIs = JSON.parse(tagged_playlist_uris);
    
    const include_tags = tags.filter(tag => !/^!.+/.test(tag)).map(tag => tag.toLowerCase());
    const exclude_tags = tags.filter(tag => /^!.+/.test(tag)).map(tag => tag.slice(1).toLowerCase());

    const filtered_uris = playlistURIs.filter((uri: string) => {
      const playlist_tags = new Set(getPlaylistTags(uri).map(tag => tag.toLowerCase())); 
      
      const include_check: boolean = filter_option === 'Match Any Tag (OR)' 
        ? include_tags.some(tag => playlist_tags.has(tag))
        : include_tags.every(tag => playlist_tags.has(tag));

      return include_check && exclude_tags.every(tag => !playlist_tags.has(tag));
    });
    return filtered_uris;
  } else {
    return [];
  }
};

/** 
 * Gets all of the users playlists by recursively looping through and filtering the rootlist.
 * 
 * @returns {Promise<any[]>} A Promise that resolves with an array of playlists.
 */
async function getAllPlaylists() {
  const rootlist = await Spicetify.Platform.RootlistAPI.getContents();

  let playlists: any[] = [];

  // Recursive function to process each item
  function processItem(item: any) {
      if (item.type === "playlist") {
          playlists.push(item); // Add playlist to the result
      } else if (item.type === "folder") {
          item.items.forEach(processItem); // Recursively process items in the folder
      }
  }

  rootlist.items.forEach(processItem); // Start processing with the top-level items
  return playlists;
}

/**
 * Gets all of the users untagged playlists.
 * 
 * @returns {Promise<string[]>} A Promise that resolves with an array of URIs for untagged playlists.
 */
export async function getUntaggedPlaylistURIs(): Promise<string[]> {
  const stored_value = Spicetify.LocalStorage.get('tags:taggedPlaylistURIs');
  const tagged_playlist_uris = stored_value ? JSON.parse(stored_value) : [];

  const untagged_playlists = (await getAllPlaylists()).filter((playlist: any) => !tagged_playlist_uris.includes(playlist.uri.replace('spotify:playlist:', '')));

  const untagged_playlist_uris = untagged_playlists.map((playlist: any) => playlist.uri.replace('spotify:playlist:', '')); 
  
  return untagged_playlist_uris;
}

//////////////////////////////////////// TRIMMING FUNCTIONS ////////////////////////////////////////

/**
 * Trims the contents of a playlist to only include the URI of each track.
 * Used to save space in local storage when caching.
 * 
 * @param {PlaylistContents} playlist_contents - The contents of to trim.
 * @returns {PlaylistContents} The trimmed playlist contents.
 */
function trimContents(playlist_contents: PlaylistContents) {
  return {
    items: playlist_contents.items.map(item => ({ uri: item.uri.replace('spotify:local:', '').replace('spotify:track:', '')})),
  };
};

/**
 * Trims the metadata of a playlist to only include the URI, name, description, and the first (high-res) image.
 * Descriptions are trimmed to the first 32 characters.
 * Used to save space in local storage when caching.
 * 
 * @param {PlaylistMetadata} playlist_metadata - The metadata to trim.
 * @returns {PlaylistMetadata} The trimmed playlist metadata.
 */
function trimMetadata(playlist_metadata: PlaylistMetadata) {
  return {
    uri: playlist_metadata.uri.replace('spotify:playlist:', ''),
    name: playlist_metadata.name,
    description: playlist_metadata.description.substring(0, 36),
    images: [playlist_metadata.images[0]]
  };
};

////////////////////////////////////// LOCALSTORAGE FUNCTIONS //////////////////////////////////////

/**
 * Gets all keys in local storage that start with 'tags:'.
 * 
 * @returns {string[]} An array of all keys in local storage that start with 'tags:'.
 */
function getAllTagKeys(): string[] {
  let values = Object.keys(localStorage).filter((key)=> key.startsWith('tags:'));
  return values;
};

/**
 * Removes all keys starting with 'tags:' from local storage.
 */
export function clearAllTags(): void {
  getAllTagKeys().forEach(key => {
    if (!key.startsWith('tags:cache:')){
      Spicetify.LocalStorage.remove(key);
    }
  });
};

/**
 * Removes all keys starting with 'tags:cache:metadata:' from local storage.
 */
export function clearMetadataCache(): void {
  getAllTagKeys().forEach(key => {
    if (key.startsWith('tags:cache:metadata:')){
      Spicetify.LocalStorage.remove(key);
    }
  });
};

/**
 * Removes all keys starting with 'tags:cache:contents:' from local storage.
 */
export function clearContentsCache(): void {
  getAllTagKeys().forEach(key => {
    if (key.startsWith('tags:cache:contents:')){
      Spicetify.LocalStorage.remove(key);
    }
  });
};

/**
 * Adapted from https://stackoverflow.com/a/15720835
 * 
 * @returns {string} A string containing the size of all tag keys in local storage, and the total size of all keys.
 */
export function getLocalStorageKeySizes(): string {
  let sizes: { key: string, size: number }[] = [];
  let tag_key_total = 0, all_key_total = 0;

  for (let key in localStorage) {
    if (!localStorage.hasOwnProperty(key)) continue;

    let keySize = (localStorage[key].length + key.length) * 2;
    all_key_total += keySize;

    if (key.startsWith('tags:')) {
      tag_key_total += keySize;
      sizes.push({ key, size: keySize / 1024 });
    }
  }

  sizes.sort((a, b) => b.size - a.size);

  let result = sizes.map(x => `${x.key} = ${x.size.toFixed(2)} KB`).join("\n");
  result += `\nTotal = ${(tag_key_total / 1024).toFixed(2)} KB / ${(all_key_total / 1024).toFixed(2)} KB`;

  return result;
};

/**
 * Imports tags from a string.
 * 
 * @param {string} tags - A string containing importable tags.
 * @returns {number} The number of playlist's tags imported.
 */
export function importTags(tags: string): number {
  let tag_array = tags.split('\n');
  let error_encountered = false;
  tag_array.forEach(tag => {
    if (!error_encountered) {
      const split = tag.split(' === ');
      if (split.length === 2) {
        try {
          registerPlaylistAsTagged(split[0].split(':')[1]);
          Spicetify.LocalStorage.set(split[0], split[1]);
        } catch (DOMExcpection) {
          Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.', true);
          error_encountered = true;
        }
      }
    }
  });
  return tag_array.length;
};

/**
 * Exports all tags from local storage.
 * 
 * @param {boolean} exclude_contains_local_files_tag - Whether to exclude playlists tagged as [contains-local-files].
 * @returns {string} A string containing importable tags.
 */
export function exportTags(exclude_contains_local_files_tag: boolean): string {
  let exported_tags: string = '';
  getAllTagKeys().forEach(key => {
    if (!key.startsWith('tags:cache:') && !key.startsWith('tags:taggedPlaylistURIs')) {
      let key_value = Spicetify.LocalStorage.get(key);
      if (key_value?.includes('[contains-local-files]') && exclude_contains_local_files_tag) {
        return;
      }
      exported_tags += key + ' === ' + key_value + '\n';
    }
  });
  return exported_tags.replace(/\n$/, '');
};

/**
 * Retrieves the tag counts for tagged playlists.
 * 
 * @returns A string representation of the tag counts.
 */
export function getTagCounts(): string {
  const tagged_playlist_uris = JSON.parse(Spicetify.LocalStorage.get('tags:taggedPlaylistURIs') || '[]');
  let tag_counts: Record<string, number> = {};

  tagged_playlist_uris.forEach((uri: string) => {
    const tags = JSON.parse(Spicetify.LocalStorage.get('tags:' + uri) || '[]');
    tags.forEach((tag: string) => {
      tag_counts[tag] = (tag_counts[tag] || 0) + 1;
    });
  });

  return Object.entries(tag_counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => `${tag}: ${count}`)
    .join('\n');
};

////////////////////////////////////////// MISC FUNCTIONS //////////////////////////////////////////

/**
 * Adds an array of playlists to the queue.
 * 
 * @param {PlaylistMetadata[]} playlist_data - Playlists to add.
 * @param {boolean} shuffle - Whether to shuffle the tracks before adding them to the queue.
 * @returns {Promise<void>} A Promise that resolves when the operation is complete.
 */
export async function addPlaylistsToQueue(playlist_data: PlaylistMetadata[], shuffle: boolean): Promise<void> {
  Spicetify.showNotification('Processing ' + playlist_data.length + ' playlists...');
  const use_cache = JSON.parse(Spicetify.LocalStorage.get('playlist-tags-cache-settings.use-contents-cache') || 'false').value;
  let track_list: Spicetify.ContextTrack[] = [];
  var contents_cache: string = '';
  for (const playlist of playlist_data) {
    let playlist_contents: PlaylistContents;

    if (use_cache) {
      contents_cache = Spicetify.LocalStorage.get('tags:cache:contents:' + playlist.uri.replace('spotify:playlist:', '')) || '';
      if (contents_cache !== '') {
        playlist_contents = JSON.parse(contents_cache);
      } else {
        playlist_contents = await Spicetify.Platform.PlaylistAPI.getContents(playlist.uri);
        try {
          Spicetify.LocalStorage.set('tags:cache:contents:' + playlist.uri.replace('spotify:playlist:', ''), JSON.stringify(trimContents(playlist_contents)));
        } catch (DOMExcpection) {
          Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.', true);
        }
      }
    } else {
      playlist_contents = await Spicetify.Platform.PlaylistAPI.getContents(playlist.uri);
    }

    if (contents_cache) {
      playlist_contents.items.forEach(track => {
        if (Spicetify.URI.isLocal('spotify:local:' + track.uri)) {
          track_list.push({uri: 'spotify:local:' + track.uri});
        } else {
          track_list.push({uri: 'spotify:track:' + track.uri});
        }
      });
    } else {
      playlist_contents.items.forEach(track => {
        track_list.push({uri: track.uri});
      });
    }
  }

  if (shuffle) {
    track_list = shuffleArray(track_list);
  }

  await Spicetify.Platform.PlayerAPI.clearQueue();
  await Spicetify.addToQueue(track_list);
  Spicetify.showNotification('Added ' + track_list.length + ' tracks to queue');
  if (track_list.length !== 0) {
    Spicetify.Player.next();
    Spicetify.Player.play();
  }
};

/**
 * Removes a specific string from an array of strings and returns the modified array as a string.
 * 
 * @param source - The array of strings from which the target string will be removed.
 * @param target - The string to be removed from the source array.
 * @returns The modified array as a string, with the target string removed.
 */
export function removeStringFromStringArray(source: string[], target: string) {
  return source.filter(word => word !== target).join(' ');
};

/**
 * Escapes special characters in a string to be used in a regular expression.
 * 
 * @param string - The string to escape.
 * @returns The escaped string.
 */
export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Uses the Fisher-Yates shuffle algorithm to shuffle an array.
 * 
 * @param {any[]} array - The array to shuffle.
 * @returns {any[]} The shuffled array.
 */
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

/**
 * Sorts playlists by description, if the first four characters of the description are numbers, they are sorted numerically.
 * 
 * @param {PlaylistMetadata[]} playlist_data - Playlists to sort.
 * @param {string} order - Sorting order (ASC/DESC).
 * @returns {PlaylistMetadata[]} Sorted playlists.
 */
function sortByDescription(playlist_data: PlaylistMetadata[], order: string) {
  switch (order) {
    case 'ASC':
      playlist_data.sort((a, b) => {
        const numA = parseInt(a.description.substring(0, 4));
        const numB = parseInt(b.description.substring(0, 4));

        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        } else if (!isNaN(numA)) {
          return -1;
        } else if (!isNaN(numB)) {
          return 1;
        } else {
          return a.description.localeCompare(b.description);
        }
      });
      break;
    case 'DESC':
      playlist_data.sort((a, b) => {
        const numA = parseInt(a.description.substring(0, 4));
        const numB = parseInt(b.description.substring(0, 4));

        if (!isNaN(numA) && !isNaN(numB)) {
          return numB - numA;
        } else if (!isNaN(numA)) {
          return 1;
        } else if (!isNaN(numB)) {
          return -1;
        } else {
          return b.description.localeCompare(a.description);
        }
      });
      break;
  }
  return playlist_data;
};

/**
 * Sorts tags, places tags wrapped in square brackets at the end.
 * 
 * @param {string[]} tags - Tags to sort.
 * @param {string} sorting_option - Sorting option to use (A-Z/Z-A).
 * @returns {string[]} The sorted tags.
 */
function sortTags(tags: string[], sorting_option: string): string[] {
    // Matches tags that are wrapped in square brackets
    const regex = /\[(.*?)\]/;

    let non_matching_tags = tags.filter(tag => !regex.test(tag));
    let matching_tags = tags.filter(tag => regex.test(tag));
  
    switch (sorting_option) {
      case (sorting_option = 'A-Z'):
        non_matching_tags.sort((a, b) => a.localeCompare(b));
        matching_tags.sort((a, b) => a.localeCompare(b));
        break;
      case (sorting_option = 'Z-A'):
        non_matching_tags.sort((a, b) => b.localeCompare(a));
        matching_tags.sort((a, b) => b.localeCompare(a));
        break;
      default:
        break;
    }
  
    return [...non_matching_tags, ...matching_tags];
};

//////////////////////////////////////// DISPLAY FUNCTIONS /////////////////////////////////////////

/**
 * Handles page change events.
 * 
 * @param {Location} location - The location object to use.
 */
export function handlePageChange(location: Location): void {
  let current_playlist_uri = getCurrentPageURI();
  if (location.pathname.startsWith('/playlist/')) {
    let previous_playlist_url = current_playlist_uri;
    current_playlist_uri = getCurrentPageURI();
    if (previous_playlist_url === current_playlist_uri) {
      removePlaylistPageElements();
    }
    let tags = getPlaylistTags(current_playlist_uri);
    renderPlaylistPageElements(tags);
  } else {
    removePlaylistPageElements();
  }
};

/**
 * Renders playlists. 
 * 
 * @param {PlaylistMetadata[]} playlist_data - Playlists to render.
 * @param {string} sorting_option - Sorting option to use (Title: A-Z / Title: Z-A / Description: A-Z / Description: Z-A).
 * @param {boolean} is_loading - Whether the playlists are still loading.
 * @param {string} filter_query - The filter query to use.
 * @returns {JSX.Element} The rendered playlists.
 */
export function renderPlaylists(playlist_data: PlaylistMetadata[], sorting_option: string, is_loading: boolean, filter_query: string) {
  switch (sorting_option) {
    case 'Title: A-Z':
      playlist_data.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'Title: Z-A':
      playlist_data.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'Description: A-Z':
      playlist_data = sortByDescription(playlist_data, 'ASC');
      break;
    case 'Description: Z-A':
      playlist_data = sortByDescription(playlist_data, 'DESC');
      break;
    case 'No covers first':
      playlist_data.sort((a, b) => {
        const a_image = a.images[0];
        const b_image = b.images[0];
    
        const a_is_priority = a_image === null || a_image.url.startsWith('spotify:mosaic:');
        const b_is_priority = b_image === null || b_image.url.startsWith('spotify:mosaic:');
    
        if (a_is_priority && !b_is_priority) {
          return -1;
        } else if (!a_is_priority && b_is_priority) {
          return 1;
        } else {
          return 0;
        }
      });
      break;
    default:
      break;
  }

  return (
    <React.Fragment>
      <style>
      {`
        .card-wrapper {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          grid-gap: 20px;
          margin-left: 15px;
          margin-right: 25px;
        }
        .playlist-card {
          width: 100%;
          height: 100%;
        }
        .loading-text {
          font-size: 50px;
          text-align: center;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      `}
      </style>
      {is_loading ? (<h1 className='loading-text'>Loading...</h1>) : (
        filter_query !== '' && playlist_data.length === 0 ? (<h1 className='loading-text'>No playlists found for query</h1>) :
          <div className='card-wrapper'>
            {
              playlist_data.map((playlist: PlaylistMetadata) => (
                <SpotifyCard 
                  className = 'playlist-card'
                  type = "playlist" 
                  uri = {playlist.uri} 
                  header = {playlist.name}
                  subheader = {playlist.description}
                  imageUrl = {playlist.images[0]?.url}/>
              ))
            }
          </div>
      )}
    </React.Fragment>
  );
};

/**
 * Renders elements on playlist pages.
 * 
 * @param {string[]} tags - Tags to render.
 * @returns {Promise<void>} A Promise that resolves when the operation is complete.
 */
let isRenderingPlaylistPageElements = false;
export async function renderPlaylistPageElements(tags: string[]): Promise<void> {
  if (isRenderingPlaylistPageElements) {
    return;
  }
  isRenderingPlaylistPageElements = true;
  
  const container = document.createElement('div');
  container.className = 'tag-list';
  container.style.width = '96%';
  container.style.display = 'flex';
  container.style.flexWrap = 'wrap';
  container.style.marginTop = '4px';
  container.style.marginLeft = '25px';
  container.style.marginBottom = '16px';

  if (Spicetify.Config.current_theme == 'Comfy') {
    container.style.marginBottom = '30px';
  }

  // @ts-ignore
  const Chip: any = Spicetify.ReactComponent.Chip;
  
  const TagList = () => (
    <React.Fragment>
      <style>
        {`
          .tag-list-button {
            cursor: pointer;
            margin-top: 8px;
          }
        `}
      </style>
      {
        sortTags(tags, 'A-Z').map((tag) => (
          <Chip
            className='tag-list-tag'
            semanticColor='textBase'
            onClick={() => Spicetify.Platform.History.push('/playlist-tags/' + tag)}
            onContextMenu={() => {
              removeTag(getCurrentPageURI(), tag); 
              removePlaylistPageElements(); 
              renderPlaylistPageElements(getPlaylistTags(getCurrentPageURI()));}}
          >{tag}
          </Chip>
        ))
      }
      <Spicetify.ReactComponent.IconComponent
        className='tag-list-button'
        semanticColor="textBase"
        dangerouslySetInnerHTML={{ __html: Spicetify.SVGIcons["edit"] }}
        onClick={() => appendTag([getCurrentPageURI()])}>
      </Spicetify.ReactComponent.IconComponent>
    </React.Fragment>
  );

  renderElement(<TagList/>, container);
  // await removeTopbarButton();
  // renderTopbarButton();

  await waitForElement('div.playlist-playlist-playlistContent');

  const target = await waitForElement('#main > div > div.Root__top-container > div.Root__main-view > div.main-view-container > div.main-view-container__scroll-node > div:nth-child(2) > div.main-view-container__scroll-node-child > main > div > section > div.playlist-playlist-playlistContent > div:nth-child(2) > div:nth-child(2) > div');
  if (target !== null) {
    target.parentNode?.insertBefore(container, target.nextSibling);
    isRenderingPlaylistPageElements = false;
  }
};
  
/**
 * Removes elements from playlist pages.
 * 
 * @returns {Promise<void>} A Promise that resolves when the operation is complete.
 */
async function removePlaylistPageElements(): Promise<void> {
  // await removeTopbarButton();
  const tagListElements = document.getElementsByClassName('tag-list');
  Array.from(tagListElements).forEach(element => {
    element.remove();
  });
};

///////////////////////////////////////////// SCRAPPED /////////////////////////////////////////////

/**
 * Renders a topbar button with with the same functionality as the add tags button near tags.
 * Scrapped due to the button not being removed when the page changes (could probably fix by assigning an ID to the button, or maybe by changing to async) 
 * Leaving it scrapped cause it's not really needed, don't want to clutter the top bar.
 */
function renderTopbarButton(): void {
  const button = new Spicetify.Topbar.Button("Tags", "edit", () => {
    appendTag([getCurrentPageURI()]);
  });

  button.tippy.setProps({
    content: "<b>Add tags</b>",
    allowHTML: true,
  });
};

/**
 * Removes a topbar button with with the same functionality as the add tags button near tags.
 * Scrapped due to the button not being removed when the page changes (could probably fix by assigning an ID to the button) 
 * Leaving it scrapped cause it's not really needed, don't want to clutter the top bar.
 * 
 * @returns {Promise<void>} A Promise that resolves when the operation is complete.
 */
async function removeTopbarButton(): Promise<void> {
  await waitForElement('div.main-topBar-historyButtons');

  const tooltip = 'Add tags'; 
  let topbarButtons = document.getElementsByClassName('main-topBar-button');
  
  Array.from(topbarButtons).forEach(button => {
    Array.from(button.attributes).forEach(attr => {
      // @ts-ignore
      if (attr.ownerElement?._tippy && attr.ownerElement._tippy.popper.innerText === tooltip) {
        button.remove();
      }
    });
  });
};