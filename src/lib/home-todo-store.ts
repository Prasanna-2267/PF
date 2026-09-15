import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type HomeTodo = { id: string; title: string; completed: boolean };
type HomeTodoState = {
  dateKey: string;
  todos: HomeTodo[];
  syncToday: (dateKey: string) => void;
  addTodo: (title: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  clearCompleted: () => void;
};

export function homeTodoDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
const starterTodos = (dateKey: string): HomeTodo[] => [
  { id: `${dateKey}-review`, title: 'Review one important concept', completed: false },
  { id: `${dateKey}-practice`, title: 'Complete a focused practice set', completed: false },
  { id: `${dateKey}-revision`, title: 'Revise yesterday’s notes', completed: false },
];

export const useHomeTodoStore = create<HomeTodoState>()(persist((set) => ({
  dateKey: homeTodoDateKey(),
  todos: starterTodos(homeTodoDateKey()),
  syncToday: (dateKey) => set((state) => state.dateKey === dateKey ? state : { dateKey, todos: starterTodos(dateKey) }),
  addTodo: (title) => set((state) => ({ todos: [...state.todos, { id: `todo-${Date.now()}`, title: title.trim(), completed: false }] })),
  toggleTodo: (id) => set((state) => ({ todos: state.todos.map((todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo) })),
  removeTodo: (id) => set((state) => ({ todos: state.todos.filter((todo) => todo.id !== id) })),
  clearCompleted: () => set((state) => ({ todos: state.todos.filter((todo) => !todo.completed) })),
}), {
  name: 'pf-home-todos',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ dateKey: state.dateKey, todos: state.todos }),
  onRehydrateStorage: () => (state) => state?.syncToday(homeTodoDateKey()),
}));
