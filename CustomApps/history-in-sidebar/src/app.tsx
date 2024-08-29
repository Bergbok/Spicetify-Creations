import React from 'react'

class App extends React.Component {
  componentDidMount() {
    Spicetify.Platform.LocalStorageAPI.setItem('queue-view', 'history');

    // Opens the right sidebar if it's closed
    const queue_button = document.querySelector('button[data-restore-focus-key="queue"][data-active="false"]') as HTMLButtonElement;
    if (queue_button) {
      queue_button.click();
    }
    
    // Removes the custom app from the history stack
    for (let i = 0; i < Spicetify.Platform.History.entries.length; i++) {
      if (Spicetify.Platform.History.entries[i]?.pathname === '/history-in-sidebar') {
        Spicetify.Platform.History.entries.splice(i, 1);
      }
    }

    Spicetify.Platform.History.goBack();
  }

  render() {
    return null;
  }
}

export default App;