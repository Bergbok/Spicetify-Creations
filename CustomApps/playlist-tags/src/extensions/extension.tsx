import { handlePageChange, getCurrentPageURI, getPlaylistTags, renderPlaylistPageElements, clearMetadataCache, clearAllTags, importTags, exportTags, appendTagsToFolderPlaylists, clearContentsCache, getLocalStorageKeySizes, removeTagFromAllPlaylists, appendTagToAllPlaylists, getTagCounts } from '../funcs';
import { MassTagOperation } from '../types/mass_tag_operations';
import { SettingsSection } from 'spcr-settings';
import { version as CURRENT_VERSION } from '../../package.json';
import { waitForSpicetify, waitForPlatformApi } from '@shared/utils/spicetify-utils';

/**
 * Checks for updates for Playlist Tags.
 * Fetches the current version from the GitHub repository and compares it to the installed version.
 * If an update is available, a notification is displayed.
 */
function checkForUpdate() {
  const url = 'https://raw.githubusercontent.com/Bergbok/Spicetify-Creations/main/CustomApps/playlist-tags/package.json';
  fetch(url)
    .then(response => response.json())
    .then(package_JSON => {
        if (package_JSON.version !== CURRENT_VERSION) {
          Spicetify.showNotification('An update is available for Playlist Tags');
        }
    })
    .catch(error => {
        console.error(error);
    });
};

/**
 * Registers the settings for Playlist Tags using spcr-settings.
 */
async function registerSettings() {
  let settings = new SettingsSection('Playlist Tags Settings', 'playlist-tags-settings');
  await settings.pushSettings();

  const import_export_settings = new SettingsSection('Import / Export', 'playlist-tags-import-export-settings');
    import_export_settings.addButton('button-import-tags', 'Import tags from clipboard', 'Import', async () => {
      const imported_tag_count = importTags(await Spicetify.Platform.ClipboardAPI.paste());
      Spicetify.showNotification('Imported ' + imported_tag_count + ' playlist\'s tags!');
    });
    import_export_settings.addButton('button-export-tags', 'Export playlist tags to clipboard', 'Export', async () => {
      await Spicetify.Platform.ClipboardAPI.copy(exportTags(import_export_settings.getFieldValue('exclude-contains-local-files-tag')));
      Spicetify.showNotification('Tags copied to clipboard!');
    });
    import_export_settings.addToggle('exclude-contains-local-files-tag', 'Exclude [contains-local-files] from export', true);
  await import_export_settings.pushSettings();

  settings = new SettingsSection('Navigation Bar', 'playlist-tags-navbar-settings');
    settings.addToggle('navbar-all-tags-page', '• All Tags', true);
    settings.addToggle('navbar-all-tagged-playlists-page', '• All Tagged Playlists', true);
    settings.addToggle('navbar-all-untagged-playlists-page', '• All Untagged Playlists', true);
    settings.addToggle('navbar-README', '• README', true);
  await settings.pushSettings();

  settings = new SettingsSection('Cache', 'playlist-tags-cache-settings');
    settings.addToggle('use-contents-cache', 'Use tracklist cache', true);
    settings.addToggle('use-metadata-cache', 'Use metadata cache', true);
    settings.addButton('button-clear-contents-cache', 'Remove tracklist cache', 'Remove', () => {
      clearContentsCache();
      Spicetify.showNotification('Tracklist cache cleared');
    });
    settings.addButton('button-clear-metadata-cache', 'Remove metadata cache', 'Remove', () => {
      clearMetadataCache();
      Spicetify.showNotification('Metadata cache cleared');
    });
  await settings.pushSettings();

  const add_settings = new SettingsSection('Mass Tagging', 'playlist-tags-add-settings');
    add_settings.addButton('button-add-year-tags', 'Add [year:<year>] tag to playlists containing year in description', 'Add', async () => {
      appendTagToAllPlaylists(MassTagOperation.AddYearTag);
      Spicetify.showNotification('Processing playlists');
    });
    add_settings.addButton('button-add-contains-local-files-tags', 'Add [contains-local-files] tag to playlists containing local files', 'Add', async () => {
      appendTagToAllPlaylists(MassTagOperation.AddLocalFilesTag, '[contains-local-files]');
      Spicetify.showNotification('Processing playlists');
    });
    add_settings.addButton('button-add-unplayable-tags', 'Add [unplayable] tag to unplayable playlists', 'Add', async () => {
      appendTagToAllPlaylists(MassTagOperation.AddUnplayableTag, '[unplayable]');
      Spicetify.showNotification('Processing playlists');
    });
    add_settings.addButton('button-add-creator-displayname-tags', 'Add [by:<username>] tag to all playlists', 'Add', async () => {
      appendTagToAllPlaylists(MassTagOperation.AddCreatorDisplayNameTag);
      Spicetify.showNotification('Processing playlists');
    });
    add_settings.addButton('button-add-artist-tags', 'Add [artist:<artist>] tags to all playlists', 'Add', async () => {
      appendTagToAllPlaylists(MassTagOperation.AddArtistTag, undefined, add_settings.getFieldValue('ignore-non-english-characters'), parseInt(add_settings.getFieldValue('va-cutoff-count')));
      Spicetify.showNotification('Processing playlists');
    });
    add_settings.addToggle('ignore-non-english-characters', '↳ Exclude non-english characters', true);
    add_settings.addInput('va-cutoff-count', '↳ Threshold for [artist:VA] tag', '5', () => {
      if (!Number.isInteger(parseInt(add_settings.getFieldValue('va-cutoff-count')))) {
        Spicetify.showNotification('Invalid input, should be a positive integer', true, 1500);
        add_settings.setFieldValue('va-cutoff-count', '5');
        add_settings.rerender();
      }
    });
  await add_settings.pushSettings();

  const removal_settings = new SettingsSection('Mass Removal', 'playlist-tags-removal-settings');
    removal_settings.addButton('button-mass-removal', 'Remove all tags that match:', 'Remove', () => {
      const regex = new RegExp(removal_settings.getFieldValue('mass-removal-regex'));
      const less_than_count = parseInt(removal_settings.getFieldValue('mass-removal-less-than-count'));
      removeTagFromAllPlaylists(regex, less_than_count);
      Spicetify.showNotification('Removed tags!');
    });
    removal_settings.addInput('mass-removal-regex', '↳ Regular Expression', '');
    removal_settings.addInput('mass-removal-less-than-count', '↳ That appear less than x times', '', () => {
      if (!Number.isInteger(parseInt(removal_settings.getFieldValue('mass-removal-less-than-count')))) {
        Spicetify.showNotification('Invalid input, should be a positive integer', true, 1500);
        removal_settings.setFieldValue('mass-removal-less-than-count', '0');
        removal_settings.rerender();
      }
    });
    removal_settings.addButton('button-remove-all-tags', 'CAUTION: Remove ALL tags', 'Remove', () => {
      clearAllTags();
      Spicetify.showNotification('All tags removed');
    });
  await removal_settings.pushSettings();

  settings = new SettingsSection('Miscellaneous', 'playlist-tags-misc-settings');
    settings.addButton('button-copy-tag-counts', 'Copy tag counts', 'Copy', async () => {
      await Spicetify.Platform.ClipboardAPI.copy(getTagCounts()); 
      Spicetify.showNotification('Copied to clipboard!');
    });
    settings.addButton('button-copy-localstorage-key-sizes', 'Copy local storage key sizes', 'Copy', async () => {
      await Spicetify.Platform.ClipboardAPI.copy(getLocalStorageKeySizes()); 
      Spicetify.showNotification('Copied to clipboard!');
    });
  await settings.pushSettings();
};

/**
 * Registers a context menu item for folders.
 * Adds an "Add Tags" option to the context menu for folders.
 * The option is used to append tags to all playlists in the folder.
 * @todo Update to ContextMenuV2
 */
function registerFolderContextMenuItem() {
  if (!Spicetify.ContextMenu) {
      setTimeout(registerFolderContextMenuItem, 1000);
      return;
  }

  const folder_menu_item = new Spicetify.ContextMenu.Item(
      'Add Tags',
      uris => appendTagsToFolderPlaylists(uris[0]),
      uris => Spicetify.URI.isFolder(uris[0]),
      'plus-alt'
  );

  folder_menu_item.register();
};

/**
 * Main function for the Playlist Tags extension.
 * Waits for Spicetify and the Platform API to be ready, then checks for updates, registers settings, and registers the folder context menu item.
 * If the current page is a playlist page, it renders the playlist page elements.
 * It also sets up a listener for page changes.
 */
(async () => {
  await waitForSpicetify();
  await waitForPlatformApi('History');
  await registerSettings();
  
  checkForUpdate();

  registerFolderContextMenuItem();

  if (Spicetify.Platform.History.location.pathname.startsWith('/playlist/')) {
    renderPlaylistPageElements(getPlaylistTags(getCurrentPageURI()));
  }

  Spicetify.Platform.History.listen(async (location: Location) => {
    await handlePageChange(location);
  });
})();