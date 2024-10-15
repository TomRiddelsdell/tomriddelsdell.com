import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import './css/auth.css'
import './css/font.css'
import './css/main.css'
import profileImage from './images/IMG_20210604_134717~2.jpg';

const client = generateClient<Schema>();

  
function deleteTodo(id: string) {
  client.models.Todo.delete({ id })
}

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  return (
    <div className="page-home">

      <header className="site-header">
        <h1 className="title">tomriddelsdell.com</h1>
        <img className="profile-image" src={profileImage} alt="Thomas Riddelsdell"  />
        <nav className="site-nav">
          <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="todo.html">Todo's</a></li>
          </ul>
        </nav>
        <button type="button" className="btn-menu"><span>Menu</span></button>
      </header>

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
              <h1>{user?.signInDetails?.loginId}'s todos</h1>
              <h1>My todos</h1>
              <button onClick={createTodo}>+ new</button>
              <ul>
                {todos.map((todo) => (
                  <li 
                    onClick={() => deleteTodo(todo.id)}
                    key={todo.id}>{todo.content}</li>
                ))}
              </ul>
              <div>
                🥳 App successfully hosted. Try creating a new todo.
                <br />
                <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
                  Review next step of this tutorial.
                </a>
              </div>
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
