import React from 'react'

class App extends React.Component {
  componentDidMount() {
    const current_view: string = Spicetify.Platform.LocalStorageAPI.getItem('queue-view');
    const queue_button_selector = current_view === 'history' 
      ? 'button[data-restore-focus-key="queue"]' 
      : 'button[data-restore-focus-key="queue"][data-active="false"]';
    
    if (current_view !== 'history') {
      Spicetify.Platform.LocalStorageAPI.setItem('queue-view', 'history');
    }
    
    const queue_button = document.querySelector(queue_button_selector) as HTMLButtonElement;
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