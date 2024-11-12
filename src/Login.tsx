import { availableApps } from './AppConfig';
import { useAuth } from './Auth';

function Login() {
  const { user, signOut } = useAuth();

  return user ? (
    <main>
      <h1>Welcome back {user?.signInDetails?.loginId}. You're logged in</h1>
      <ul>
        {availableApps.map((app) => (
          <li key={app.id}><a href={app.link}>{app.description}</a></li>
        ))}
      </ul>
      <button onClick={signOut}>Sign Out</button>
    </main>
  ) : (
    <div>
      <h1>Login Page</h1>
      <p>Please log in to access the application.</p>
    </div>
  );
}

export default Login;