import React from 'react'

class App extends React.Component {
  componentDidMount() {
    Spicetify.Platform.History.push('/history');
  }

  render() {
    return null;
  } 
}

export default App;