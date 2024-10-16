import type { Schema } from "../amplify/data/resource";
import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

export default function TodoList() {
  const [todos, setTodos] = useState<Schema["Todo"]["type"][]>([]);

  useEffect(() => {
    const sub = client.models.Todo.observeQuery().subscribe({
        next: ({ items }) => {
        setTodos([...items]);
        },
    });

    return () => sub.unsubscribe();
    }, []);

    const createTodo = async () => {
    await client.models.Todo.create({
        content: window.prompt("Todo content?")
    });
    // no more manual refetchTodos required!
    // - fetchTodos()
    };

    function deleteTodo(id: string) {
        if(window.confirm("Are you sure you want to delete this todo?"))
            client.models.Todo.delete({ id })
    }

  return (
    <div>
      <button onClick={createTodo}>Add new todo</button>
      <ul>
        {todos.map(({ id, content }) => (
          <li key={id} onClick={() => deleteTodo(id)}>{content}</li>
        ))}
      </ul>
    </div>
  );
}