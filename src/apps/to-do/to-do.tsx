import { useEffect, useState } from "react";
import { Authenticator } from '@aws-amplify/ui-react'
import type { Schema } from "../../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

  
function deleteTodo(id: string) {
  client.models.Todo.delete({ id })
}

function ToDoApp() {
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
    <div>
      <section>
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
            <button onClick={signOut}>Sign Out</button>
        </main>
        )}
        </Authenticator>
      </section>
    </div>
  );
}

export default ToDoApp;
