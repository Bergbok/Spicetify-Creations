import { PlaylistContents } from './types/playlist_contents.d';
import { PlaylistMetadata } from './types/playlist_metadata.d';
import { renderElement } from '@shared/utils/react-utils';
import { waitForElement } from '@shared/utils/dom-utils';
import React from 'react';
import SpotifyCard from './components/spotify_card';
import TextInputDialog from "./components/text_input_dialog";

//////////////////////////////////////// TAGGING FUNCTIONS /////////////////////////////////////////

enum MassTagOperation {
  AddLocalFilesTag,
  AddCreatorDisplayNameTag
}

export async function appendTagsToFolderPlaylists(folder_uri: string) {
  const rootlist = await Spicetify.Platform.RootlistAPI.getContents();
  let folder_data = findFolder(rootlist, folder_uri);
  if (folder_data) {
    appendTag(getFolderPlaylistURIs(folder_data));
  }
};

export async function appendCreatorDisplayNameTagToAllPlaylists() {
  const rootlist = await Spicetify.Platform.RootlistAPI.getContents();
  for (let i = 0; i < rootlist.items.length; i++) {
    await processItem(rootlist.items[i], '', MassTagOperation.AddCreatorDisplayNameTag);
  }
  Spicetify.showNotification('Finished processing playlists');
};

export async function appendTagToAllPlaylistsContainingLocalFiles(tag: string) {
  const rootlist = await Spicetify.Platform.RootlistAPI.getContents();
  for (let i = 0; i < rootlist.items.length; i++) {
    await processItem(rootlist.items[i], tag, MassTagOperation.AddLocalFilesTag);
  }
  Spicetify.showNotification('Finished processing playlists');
};

export function removeTagFromAllPlaylists(tag_to_remove: string) {
  let keys: string[] = [];
  
  JSON.parse(Spicetify.LocalStorage.get('tags:taggedPlaylistURIs') || '[]').forEach((uri: string) => {
    keys.push('tags:' + uri);
  });

  // Loop through all keys
  keys.forEach(key => {
    // Get the tags for the playlist
    let tags = JSON.parse(Spicetify.LocalStorage.get(key) || '[]');

    // Loop through each tag
    for (let i = 0; i < tags.length; i++) {
      // Check if the tag is the one to remove
      if (tags[i] === tag_to_remove) {
        // Remove the tag from the playlist
        tags = tags.filter((t: string) => t !== tag_to_remove);

        // Update the tags in local storage
        try {
          Spicetify.LocalStorage.set(key, JSON.stringify(tags)); 
        } catch (DOMExcpection) {
          Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.');
        }

        // Break the loop as the tag has been found and removed
        break;
      }
    }
  });
};

function appendTag(playlist_uris: string[], tag?: string) {
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
        Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.');
      }

      if (current_value === null) {
        registerPlaylistAsTagged(playlist_uri);
      }
    });
    if (Spicetify.Platform.History.location.pathname.startsWith('/playlist/')) {
      removePlaylistPageElements();
      renderPlaylistPageElements(getPlaylistTags(getCurrentURI()));
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

function removeTag(playlist_uri: string, tag: string) {
  let current_value = Spicetify.LocalStorage.get('tags:' + playlist_uri);
  let current_tags = current_value ? JSON.parse(current_value) : [];
  let new_tags = current_tags.filter((t: string) => t !== tag);

  try {
    Spicetify.LocalStorage.set('tags:' + playlist_uri, JSON.stringify(new_tags));  
  } catch (DOMExcpection) {
    Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.');
  }
  
  if (new_tags.length === 0) {
    deregisterPlaylistAsTagged(playlist_uri);
  }
};

function registerPlaylistAsTagged(playlist_uri: string) {
  const stored_value = Spicetify.LocalStorage.get('tags:taggedPlaylistURIs');
  const tagged_playlists = stored_value ? JSON.parse(stored_value) : [];

  if (!tagged_playlists.includes(playlist_uri)) {
    tagged_playlists.push(playlist_uri);
  }

  try {
    Spicetify.LocalStorage.set('tags:taggedPlaylistURIs', JSON.stringify(tagged_playlists));
  } catch (DOMExcpection) {
    Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.');
  }
};

function deregisterPlaylistAsTagged(playlist_uri: string) {
  Spicetify.LocalStorage.remove('tags:' + playlist_uri);
  const stored_value = Spicetify.LocalStorage.get('tags:taggedPlaylistURIs');
  const tagged_playlists = stored_value ? JSON.parse(stored_value) : [];
  const filtered_playlists = tagged_playlists.filter((uri: string) => uri !== playlist_uri);

  try {
    Spicetify.LocalStorage.set('tags:taggedPlaylistURIs', JSON.stringify(filtered_playlists));
  } catch (DOMExcpection) {
    Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.');
  }
};

async function processItem(item: any, tag: string, operation: MassTagOperation) {
  if (item.type === 'folder') {
    for (let i = 0; i < item.items.length; i++) {
      await processItem(item.items[i], tag, operation);
    }
  } else if (item.type === 'playlist') {
    const item_tags = JSON.parse(Spicetify.LocalStorage.get('tags:' + item.uri.replace('spotify:playlist:','')) || '[]');
    switch (operation) {
      case MassTagOperation.AddLocalFilesTag:
        if (!item_tags.includes('[contains-local-files]')) {
          const playlist_contents: PlaylistContents = await Spicetify.Platform.PlaylistAPI.getContents(item.uri);
          const contains_local_files = playlist_contents.items.some(item => item.isLocal);
          if (contains_local_files) {
            appendTag([item.uri.replace('spotify:playlist:','')], tag);
            console.log('Added "' + tag + '" tag to', item.uri);
          }
          break;
        }
        break;
      case MassTagOperation.AddCreatorDisplayNameTag:
        if (!item_tags.some((tag: string) => tag.startsWith('[by:'))) {
          const playlist_metadata: PlaylistMetadata = await Spicetify.Platform.PlaylistAPI.getMetadata(item.uri);
          // Multiple .replace() calls are used because one seemingly doesn't cut it for playlists owned by The Sounds of Spotify. 
          // Try it yourself with: spotify:playlist:7vppw6zi3RPkuHAOleV5VU
          const creator_display_name = playlist_metadata.owner.displayName.replace(' ', '-').replace(' ','-').replace(' ','-');
          appendTag([item.uri.replace('spotify:playlist:','')], '[by:' + creator_display_name + ']');
          console.log('Added "[by:' + creator_display_name + ']" tag to', item.uri);
          break;
        }
        break;
    }
  }
};

function findFolder(root: any, folder_uri: string): any {
  if (root.uri === folder_uri) {
    return root;
  }

  for (let item of root.items) {
    if (item.type === 'folder') {
      let found: boolean = findFolder(item, folder_uri);
      if (found) {
        return found;
      }
    }
  }
};

////////////////////////////////////// GENERAL GET FUNCTIONS ///////////////////////////////////////

export function getAllTags(sorting_option: string) {
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

export function getCurrentURI() {
  return Spicetify.Platform.History.location.pathname.split('/')[2] ?? '';
};

export async function getPlaylistMetadata(playlist_uris: string[]) {
  const use_cache = JSON.parse(Spicetify.LocalStorage.get('playlist-tags-settings.use-metadata-cache') || 'false').value;
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
        Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.');
      }
    }
    return playlist_metadata;
  }));
  return data;
};

export function getPlaylistTags(playlist_uri: string): string[] {
  const tags = Spicetify.LocalStorage.get('tags:' + playlist_uri);
  return tags ? JSON.parse(tags) : [];
};
  
export function getPlaylistsTaggedAs(tags: string[]) {
  const tagged_playlist_uris = Spicetify.LocalStorage.get('tags:taggedPlaylistURIs');
  if (tagged_playlist_uris) {
    const playlistURIs = JSON.parse(tagged_playlist_uris);
    
    const includeTags = tags.filter(tag => !/^!.+/.test(tag));
    const excludeTags = tags.filter(tag => /^!.+/.test(tag)).map(tag => tag.slice(1));

    const filtered_uris = playlistURIs.filter((uri: string) => {
      const playlist_tags = new Set(getPlaylistTags(uri)); 
      return includeTags.every(tag => playlist_tags.has(tag)) &&
             excludeTags.every(tag => !playlist_tags.has(tag));
    });
    
    return filtered_uris;
  } else {
    return [];
  }
};

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

//////////////////////////////////////// TRIMMING FUNCTIONS ////////////////////////////////////////

function trimContents(playlist_contents: PlaylistContents) {
  return {
    items: playlist_contents.items.map(item => ({ uri: item.uri.replace('spotify:local:', '').replace('spotify:track:', '')})),
  };
};

function trimMetadata(playlist_metadata: PlaylistMetadata) {
  return {
    uri: playlist_metadata.uri.replace('spotify:playlist:', ''),
    name: playlist_metadata.name,
    description: playlist_metadata.description,
    images: [playlist_metadata.images[0]]
  };
};

////////////////////////////////////// LOCALSTORAGE FUNCTIONS //////////////////////////////////////

export function clearAllTags() {
  getAllTagKeys().forEach(key => {
    if (!key.startsWith('tags:cache:')){
      Spicetify.LocalStorage.remove(key);
    }
  });
};

export function clearMetadataCache() {
  getAllTagKeys().forEach(key => {
    if (key.startsWith('tags:cache:')){
      Spicetify.LocalStorage.remove(key);
    }
  });
};

export function clearContentsCache() {
  getAllTagKeys().forEach(key => {
    if (key.startsWith('tags:cache:contents:')){
      Spicetify.LocalStorage.remove(key);
    }
  });
};

export function getLocalStorageKeySizes() {
  let sizes: { key: string, size: number }[] = [];
  let tagKeyTotal = 0, allKeyTotal = 0;

  for (let key in localStorage) {
    if (!localStorage.hasOwnProperty(key)) continue;

    let keySize = (localStorage[key].length + key.length) * 2;
    allKeyTotal += keySize;

    if (key.startsWith('tags:')) {
      tagKeyTotal += keySize;
      sizes.push({ key, size: keySize / 1024 });
    }
  }

  sizes.sort((a, b) => b.size - a.size);

  let result = sizes.map(x => `${x.key} = ${x.size.toFixed(2)} KB`).join("\n");
  result += `\nTotal = ${(tagKeyTotal / 1024).toFixed(2)} KB / ${(allKeyTotal / 1024).toFixed(2)} KB`;

  return result;
};

export function importTags(tags: string) {
  let tag_array = tags.split('\n');
  let error_encountered = false;
  tag_array.forEach(tag => {
    if (!error_encountered) {
      const split = tag.split(' === ');
      if (split.length === 2) {
        try {
          Spicetify.LocalStorage.set(split[0], split[1]);
        } catch (DOMExcpection) {
          Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.');
          error_encountered = true;
        }
      }
    }
  });
  return tag_array.length;
};

export function exportTags(exclude_contains_local_files_tag?: boolean) {
  let exported_tags: string = '';
  getAllTagKeys().forEach(key => {
    if (!key.startsWith('tags:cache:')){
      let key_value = Spicetify.LocalStorage.get(key);
      if (key_value?.includes('[contains-local-files]') && exclude_contains_local_files_tag) {
        return;
      }
      exported_tags += key + ' === ' + key_value + '\n';
    }
  });
  return exported_tags.replace(/\n$/, '');
};

function getAllTagKeys() {
  let values = Object.keys(localStorage).filter((key)=> key.startsWith('tags:'));
  return values;
};

////////////////////////////////////////// MISC FUNCTIONS //////////////////////////////////////////

export async function addPlaylistsToQueue(playlists: PlaylistMetadata[], shuffle: boolean) {
  Spicetify.showNotification('Processing ' + playlists.length + ' playlists...');
  const use_cache = JSON.parse(Spicetify.LocalStorage.get('playlist-tags-settings.use-contents-cache') || 'false').value;
  let track_list: Spicetify.ContextTrack[] = [];
  var contents_cache: string = '';
  for (const playlist of playlists) {
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
          Spicetify.showNotification('Maximum local storage qouta reached! Clear your cache in settings.');
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
  }
};

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

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

function sortTags(tags: string[], sorting_option: string) {
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

export function handlePageChange(location: Location) {
  let current_playlist_uri = getCurrentURI();
    if (location.pathname.startsWith('/playlist/')) {
      let previous_playlist_url = current_playlist_uri;
      current_playlist_uri = getCurrentURI();
      if (previous_playlist_url === current_playlist_uri) {
        removePlaylistPageElements();
      }
      let tags = getPlaylistTags(current_playlist_uri);
      renderPlaylistPageElements(tags);
    } else {
      removePlaylistPageElements();
    }
};

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

export async function renderPlaylistPageElements(tags: string[]) {
  const container = document.createElement('div');
  container.className = 'tag-list';
  container.style.width = '96%';
  container.style.display = 'flex';
  container.style.flexWrap = 'wrap';
  container.style.marginLeft = '30px';

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
              removeTag(getCurrentURI(), tag); 
              removePlaylistPageElements(); 
              renderPlaylistPageElements(getPlaylistTags(getCurrentURI()));}}
          >{tag}
          </Chip>
        ))
      }
      <Spicetify.ReactComponent.IconComponent
        className='tag-list-button'
        semanticColor="textBase"
        dangerouslySetInnerHTML={{ __html: Spicetify.SVGIcons["edit"] }}
        onClick={() => appendTag([getCurrentURI()])}>
      </Spicetify.ReactComponent.IconComponent>
    </React.Fragment>
  );

  renderElement(<TagList/>, container);
  // await removeTopbarButton();
  // renderTopbarButton();

  await waitForElement('div.playlist-playlist-playlistContent');

  const target = await waitForElement('div.contentSpacing.main-entityHeader-container.main-entityHeader-nonWrapped');
  if (target !== null) {
    target.parentNode?.insertBefore(container, target.nextSibling);
  }
};
  
async function removePlaylistPageElements() {
  // await removeTopbarButton();
  const tagListElements = document.getElementsByClassName('tag-list');
  Array.from(tagListElements).forEach(element => {
    element.remove();
  });
};

function renderTopbarButton() {
  const button = new Spicetify.Topbar.Button("Tags", "edit", () => {
    appendTag([getCurrentURI()]);
  });

  button.tippy.setProps({
    content: "<b>Add tags</b>",
    allowHTML: true,
  });
};

async function removeTopbarButton() {
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