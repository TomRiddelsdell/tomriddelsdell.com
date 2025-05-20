import { AppAccessScope } from './AppAccessScope'

export const availableApps = [
  {
    id: 'to-do',
    name: 'To Do List',
    description: 'app for managing your to do list',
    link: '/apps/to-do',
    path: '/apps/to-do/to-do.tsx',
    css: './css/to-do-1.css',
    className: 'to-do',
    access: AppAccessScope.byUser,
  },
  {
    id: 'dummy-public',
    name: 'Dummy Publically Accessible App',
    description: 'This is App Two',
    link: '/apps/dummy-public',
    path: '/apps/dummy-public/dummy-public.tsx',
    css: './css/dummy-public-1.css',
    className: 'dummy-public',
    access: AppAccessScope.public,
  },
  // Add more apps as needed
];

const config = {
  homeCss: './css/home-1.css',
  homeClassName: 'home',
  loginCss: './css/login-1.css',
  loginClassName: 'login',
  siteNavCss: './css/siteNav-1.css',
  siteNavClassName: 'siteNav'
}

export function appConfig(appId: string) {
  return availableApps.find((app) => app.id === appId);
} 

export function importCss() {
  return [ ...availableApps.map((app) => import(`${app.css}`)), config.loginCss, config.homeCss];
}