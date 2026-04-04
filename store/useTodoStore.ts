import { create } from 'zustand';

type Category = 'assignment' | 'revision' | 'quiz' | 'lab' | null;

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: Category;
  createdAt: number;
}

interface TodoStore {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  cycleCategory: (id: string) => void;
}

const CATEGORIES: Category[] = [null, 'assignment', 'revision', 'quiz', 'lab'];

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [
    { id: '1', text: 'Complete OS Assignment 3', completed: true, category: 'assignment', createdAt: Date.now() - 3000 },
    { id: '2', text: 'Review OS lecture slides', completed: false, category: 'revision', createdAt: Date.now() - 2000 },
    { id: '3', text: 'Prepare for Networks quiz', completed: false, category: 'quiz', createdAt: Date.now() - 1000 },
  ],

  addTodo: (text) => set((state) => ({
    todos: [...state.todos, {
      id: Date.now().toString(),
      text,
      completed: false,
      category: null,
      createdAt: Date.now(),
    }],
  })),

  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ),
  })),

  deleteTodo: (id) => set((state) => ({
    todos: state.todos.filter((t) => t.id !== id),
  })),

  cycleCategory: (id) => set((state) => ({
    todos: state.todos.map((t) => {
      if (t.id !== id) return t;
      const currentIndex = CATEGORIES.indexOf(t.category);
      const nextCategory = CATEGORIES[(currentIndex + 1) % CATEGORIES.length];
      return { ...t, category: nextCategory };
    }),
  })),
}));
