import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import './css/font.css'
import './css/main.css'
import profileImage from './images/IMG_20210604_134717~2.jpg';
import { availableApps } from './AppConfig';
import { Route, Routes } from 'react-router-dom';
import AppStore from './AppStore';
import React from 'react';
import { Menu, MenuItem} from '@aws-amplify/ui-react';
  
        /*<nav className="site-nav">
          <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="/AppStore">Todo's</a></li>
          </ul>
        </nav>
        <button type="button" className="btn-menu"><span>Menu</span></button>*/
function App() {
  return (
    <div className="page-home">

      <header className="site-header">
        <h1 className="title">tomriddelsdell.com</h1>
        <img className="profile-image" src={profileImage} alt="Thomas Riddelsdell"  />
      </header>

      <>
        <Routes>
          <Route path="*" element={<App/>} />
          <Route path="/appstore" element={<AppStore/>} />
          {availableApps.map((app) => {
            const Component = React.lazy(() => import(`./apps/${app.id.charAt(0).toUpperCase() + app.id.slice(1)}.tsx`));
            return <Route key={app.id} path={app.link} element={<Component/>} />;
          })}
          {/* Add more routes as needed */}
        </Routes>
      </>

        <Menu className = "btn-menu">
            <MenuItem onSelect={() => alert("Download")}>Download</MenuItem>
            <MenuItem onSelect={() => alert("Copy")}>Create a Copy</MenuItem>
            <MenuItem onSelect={() => alert("Mark as Draft")}>
              Mark as Draft
            </MenuItem>
            <MenuItem onSelect={() => alert("Delete")}>Delete</MenuItem>
        </Menu>
      <section className="home-about">
        <div className="row column large-9 xlarge-6 xxlarge-4">
          <h1 className="section-title">Tom Riddelsdell</h1>
          <p className="content">
            <br/>
          </p>
        </div>
      </section>

      <section className="home-sign-up">
        <div className="row column">
          <Authenticator>
            {({signOut, user}) => (
            <main>
              <h1>Welcome back {user?.signInDetails?.loginId}. You're logged in</h1>
              <ul>
                {availableApps.map((app) => (
                  <li key={app.id}><a href={app.link}>{app.description}</a></li>
                ))}
              </ul>
              <button onClick={signOut}>Sign Out</button>
            </main>
            )}
          </Authenticator>

          <p className="content">More apps coming soon. For now, please just enjoy the view.</p>

          <div className="apps">
            <a className="app-icon" href=""><img src="src/images/wr-home-apple.png"/></a>
            <a className="app-icon" href=""><img src="src/images/wr-home-google.png"/></a>
          </div>

          <div className="social">
            <a className="icon-fb" href="">Facebook</a>
            <a className="icon-tw" href="">Twitter</a>
            <a className="icon-ig" href="">Instagram</a>
          </div>
        </div>
      </section>

      <section className="home-quote">
        <div className="row column medium-8 xxlarge-6">
          <div className="quote-wrap">
            <div className="quote">
              "Without data, you’re just another person with an opinion." 
            </div>
            <div className="quoter">- W. Edwards Deming</div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="row column">
          <nav className="footer-nav">
            <ul>
              <li><a href="index.html">Home</a></li>
            </ul>
          </nav>
        </div>

        <div className="row column">
          <div className="footer-legal">
            &copy;Tom Riddelsdell<br/>
            All Rights Reserved
          </div>
        </div>
      </footer>

      <script src="js/vendor.js"></script>

      <script src="js/main.js"></script>
    </div>
  );
}

export default App;
