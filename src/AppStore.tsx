//import { availableApps } from './AppConfig';
//import { Link } from 'react-router-dom';
import './css/appstore.css'; // Create this CSS file for styling

const AppStore = () => {
  return (
    <div className="app-store">
      <h1>Welcome to the App Store</h1>
      <h2>Apps coming soon...</h2>
    </div>
  );
};

export default AppStore;


/*

      <div className="app-list">
        {availableApps.map((app) => (
          <div key={app.id} className="app-tile">
            <h2>{app.name}</h2>
            <p>{app.description}</p>
            <Link to={app.link}>Learn More</Link>
          </div>
        ))}
      </div>
*/