import { waitForSpicetify, waitForPlatformApi } from '@shared/utils/spicetify-utils';

(async () => {
    await waitForSpicetify();
    await waitForPlatformApi('History');

    // If lastVisitedLocation is /history-in-sidebar when the app starts everything breaks
    // Shouldn't ever happen under normal circumstances, but when the app crashes at the wrong time it can softlock the app
    if (Spicetify.Platform.LocalStorageAPI.getItem('lastVisitedLocation') === '/history-in-sidebar') {
        Spicetify.Platform.LocalStorageAPI.setItem('lastVisitedLocation', '/');
    }
})();