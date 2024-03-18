import { SettingsSection } from 'spcr-settings';

/**
 * Registers the settings for Auto Skip Tracks by Duration using spcr-settings.
 */
function registerSettings() {
  const settings = new SettingsSection('Auto Skip Tracks by Duration Settings', 'auto-skip-tracks-by-length');

  settings.addInput('min-track-length', 'Minimum track duration (in seconds)', '10');
  settings.addInput('max-track-length', 'Maximum track duration (in seconds)', '720');
  settings.addToggle('skip-tracks-over-max-length', 'Skip tracks over maximum length', true);

  settings.pushSettings();
};

/**
 * Initializes the extension by registering settings and adding a ontrackchange event listener.
 */
async function main() {
  registerSettings();

  while (!Spicetify?.Player?.addEventListener) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  Spicetify.Player.addEventListener('songchange', (event) => {
    if (event?.data?.duration) {
      const min_track_length_ms = parseInt(JSON.parse(Spicetify.LocalStorage.get('auto-skip-tracks-by-length.min-track-length') || '5').value) * 1000;
      const max_track_length_ms = parseInt(JSON.parse(Spicetify.LocalStorage.get('auto-skip-tracks-by-length.max-track-length') || '720').value) * 1000;
      const skip_tracks_over_max_length = JSON.parse(Spicetify.LocalStorage.get('auto-skip-tracks-by-length.skip-tracks-over-max-length') || 'false').value;

      if (event.data.duration < min_track_length_ms || (skip_tracks_over_max_length && event.data.duration > max_track_length_ms)) {
        Spicetify.Player.next();
      } 
    }
  });
};

export default main;
