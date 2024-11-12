import { useState } from 'react'
import { NavLink} from 'react-router-dom';
import { availableApps } from '../AppConfig';

interface SiteNavProps {
  title: string;
}

const SiteNav = ({ title }: SiteNavProps) => {
  const [apps] = useState(availableApps);

  return (
    <>
      <div>
        <h1 className='h1'>{title}</h1>
      </div>
      <ul className='flex justify-center items-center gap-8'>
        <li><NavLink to='/appstore' className='navs'>App Store</NavLink></li>
        {apps.map((app) => (
          <li key={app.id} className='li'>
            <NavLink to={app.link} className='navs'>{app.name}</NavLink>
          </li>
        ))}
      </ul>
    </>
  );
}

export default SiteNav;