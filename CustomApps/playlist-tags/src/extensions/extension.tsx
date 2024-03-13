import { handlePageChange, getCurrentURI, getPlaylistTags, renderPlaylistPageElements, clearMetadataCache, clearAllTags, importTags, exportTags, appendTagsToFolderPlaylists, clearContentsCache, getLocalStorageKeySizes, appendTagToAllPlaylistsContainingLocalFiles, appendCreatorDisplayNameTagToAllPlaylists } from '../funcs';
import { SettingsSection } from 'spcr-settings';
import { waitForSpicetify, waitForPlatformApi } from '@shared/utils/spicetify-utils';
import { version as CURRENT_VERSION } from '../../package.json';

function checkForUpdate() {
  const corsProxy = 'https://cors-proxy.spicetify.app/';
  const url = 'https://raw.githubusercontent.com/Bergbok/Spicetify-Creations/main/CustomApps/playlist-tags/package.json';
  fetch(corsProxy + url)
    .then(response => response.json())
    .then(package_JSON => {
        console.log(package_JSON.version);
        if (package_JSON.version !== CURRENT_VERSION) {
          Spicetify.showNotification('An update is available for Playlist Tags');
        }
    })
    .catch(error => {
        console.error(error);
    });
};

function registerSettings() {
  const settings = new SettingsSection('Playlist Tags Settings', 'playlist-tags-settings');

  settings.addToggle('navbar-all-tags-page', 'Navigation Bar: All Tags', true);
  settings.addToggle('navbar-all-tagged-playlists-page', 'Navigation Bar: All Tagged Playlists', true);
  settings.addToggle('navbar-README', 'Navigation Bar: README', true);

  settings.addToggle('use-metadata-cache', 'Use metadata cache', true);

  settings.addButton('button-clear-metadata-cache', 'Remove metadata cache', 'Clear', () => {
    clearMetadataCache();
    Spicetify.showNotification('Metadata cache cleared');
  });

  settings.addToggle('use-contents-cache', 'Use tracklist cache', false);

  settings.addButton('button-clear-contents-cache', 'Remove tracklist cache', 'Clear', () => {
    clearContentsCache();
    Spicetify.showNotification('Tracklist cache cleared');
  });

  settings.addButton('button-remove-all-tags', 'CAUTION: Remove ALL tags', 'Clear', () => {
    clearAllTags();
    Spicetify.showNotification('All tags removed');
  });

  settings.addButton('button-import-tags', 'Import tags from clipboard', 'Import', async () => {
    const imported_tag_count = importTags(await Spicetify.Platform.ClipboardAPI.paste());
    Spicetify.showNotification('Imported ' + imported_tag_count + ' tags!');
  });

  settings.addButton('button-export-tags', 'Export playlist tags to clipboard', 'Export', async () => {
    await Spicetify.Platform.ClipboardAPI.copy(exportTags());
    Spicetify.showNotification('Tags copied to clipboard!');
  });

  settings.addButton('button-export-tags-excluding-lcontains-local-files', 'Export playlist tags (excluding those tagged as [contains-local-files])', 'Export', async () => {
    await Spicetify.Platform.ClipboardAPI.copy(exportTags(true));
    Spicetify.showNotification('Tags copied to clipboard!');
  });

  settings.addButton('button-add-contains-local-files-tag-to-all-containing', 'Add "[contains-local-files]" tag to all playlists containing local files', 'Add', async () => {
    appendTagToAllPlaylistsContainingLocalFiles('[contains-local-files]');
    Spicetify.showNotification('Processing playlists');
  });

  settings.addButton('button-add-creator-displayname-tag-to-all', 'Add "[by:<username>]" tag to all playlists', 'Add', async () => {
    appendCreatorDisplayNameTagToAllPlaylists();
    Spicetify.showNotification('Processing playlists');
  });

  settings.addButton('button-get-localstorage-key-sizes', 'Copy local storage key sizes', 'Copy', async () => {
    await Spicetify.Platform.ClipboardAPI.copy(getLocalStorageKeySizes()); 
    Spicetify.showNotification('Copied to clipboard!');
  });

  settings.pushSettings();
};

// TO-DO: Update to ContextMenuV2
function registerFolderContextMenuItem() {
  if (!Spicetify.ContextMenu) {
      setTimeout(registerFolderContextMenuItem, 1000);
      return;
  }

  const folderMenuItem = new Spicetify.ContextMenu.Item(
      "Add Tags",
      (uris, uids, contextUri) => { 
        appendTagsToFolderPlaylists(uris[0]);
      },
      (uris, uids, contextUri) => {
        return uris.some(uri => uri.includes(":folder:"));
      },
      'plus-alt'
  );

  folderMenuItem.register();
};

(async () => {
  await waitForSpicetify();
  await waitForPlatformApi('History');

  checkForUpdate();

  registerSettings();

  registerFolderContextMenuItem();

  if (Spicetify.Platform.History.location.pathname.startsWith('/playlist/')) {
    renderPlaylistPageElements(getPlaylistTags(getCurrentURI()));
  }

  Spicetify.Platform.History.listen((location: Location) => {
    handlePageChange(location);
  });
})();