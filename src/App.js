import React, {Component} from 'react';
// import Particles from 'react-particles-js';
import FaceRecognition from './components/FaceRecognition/FaceRecognition.js';
import Navigation from './components/Navigation/Navigation.js';
import Signin from './components/Signin/Signin.js'
import Register from './components/Register/Register.js'
import Logo from './components/Logo/Logo.js';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm.js';
import Rank from './components/Rank/Rank.js';
import Modal from './components/Modal/Modal.js'
import Profile from './components/Profile/Profile.js'
import './App.css';

// const particlesOptions = {
//   particles: {
//     number: {
//       value: 90,
//       density: {
//         enable: true,
//         value_area: 800
//       }
//     }
//   }
// }

const initialState = {
  input: '',
  imageUrl: '',
  boxes: [],    
  route: 'signin',
  isSignedIn: false,
  isProfileOpen: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: '',
    age: '',
    pet: '',
  }    
}

class App extends Component {
  constructor() {
    super();
    this.state = initialState;
    }

  componentDidMount() {
    const token = window.sessionStorage.getItem('token');
    if(token) {
      fetch('https://protected-bayou-29814.herokuapp.com/signin', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      })
        .then(resp => resp.json())
        .then(data => {
          if(data && data.id) {
            fetch(`https://protected-bayou-29814.herokuapp.com/profile/${data.id}`, {
              method: 'get',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token
              }
            })
              .then(resp => resp.json())
              .then(user => {
                if(user && user.email) {
                  this.loadUser(user);
                  this.onRouteChange('home');
                }
              })
          }
        })
        .catch(console.log)
    }
  }

  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined,
      age: data.age,
      pet: data.pet,
    }})
  }

  calculateFaceLocation = (data) => {
    if(data && data.outputs) {
      return data.outputs[0].data.regions.map(face => {
        const clarifaiFace = face.region_info.bounding_box;
        const image = document.getElementById('inputimage');
        const width = Number(image.width);
        const height = Number(image.height);
        return {
          leftCol: clarifaiFace.left_col * width,
          topRow: clarifaiFace.top_row * height,
          rightCol: width - (clarifaiFace.right_col * width),
          bottomRow: height - (clarifaiFace.bottom_row * height)
        }
      });
    }
    return;
  }

  displayFaceBox = (boxArray) => {
    if (boxArray) {
      this.setState({boxes: boxArray})
    }    
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input});
      fetch('https://protected-bayou-29814.herokuapp.com/imageurl', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': window.sessionStorage.getItem('token')
        },
        body: JSON.stringify({
          input: this.state.input
        })
      })
      .then(response => response.json())
      .then(response => {
          if (response) {
            fetch('https://protected-bayou-29814.herokuapp.com/image', {
              method: 'put',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': window.sessionStorage.getItem('token')            
              },
              body: JSON.stringify({
                id: this.state.user.id
              })
            }) 
            .then(response => response.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, { entries: count }))
            }) 
            .catch(console.log)
          }
        
        this.displayFaceBox(this.calculateFaceLocation(response))
        })
        .catch(err => console.log(err));  
  }
      
  removeSessionToken = () => {
    window.sessionStorage.removeItem('token')
  }     

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.removeSessionToken()
      return this.setState(initialState);
    } else if (route === 'home') {
      this.setState({isSignedIn: true});
    }
    this.setState({route: route});
  }

  toggleModal = () => {
    this.setState(prevState => ({
      ...prevState,
      isProfileOpen: !prevState.isProfileOpen
    }))
  }

  render() {
    const { isSignedIn, imageUrl, route, boxes, isProfileOpen, user } = this.state;
    return (
      <div className="App">
        {/* <Particles className='particles'
          params={particlesOptions} 
        /> */}
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange}
          toggleModal={this.toggleModal} />
        { isProfileOpen && 
          <Modal>
            <Profile 
              isProfileOpen={isProfileOpen} 
              toggleModal={this.toggleModal}
              loadUser={this.loadUser}
              user={user} 
            />
          </Modal>
        }
        { route === 'home' 
          ? <div>
              <Logo />
              <Rank name={this.state.user.name} entries={this.state.user.entries} />
              <ImageLinkForm 
                onInputChange={this.onInputChange} 
                onButtonSubmit={this.onButtonSubmit} 
              />
              <FaceRecognition boxes={boxes} imageUrl={imageUrl} />
            </div>
          : (
            this.state.route === 'signin' 
            ? <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
            : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
          ) 
        }
      </div>
    );
    }
}

export default App;
