import { create } from 'zustand';
import type { Person } from '@/types';
import { dbPromise } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface PeopleState {
    people: Person[];
    loading: boolean;
    loadPeople: () => Promise<void>;
    addPerson: (name: string, emoji?: string) => Promise<void>;
    removePerson: (id: string) => Promise<void>;
    updatePerson: (person: Person) => Promise<void>;
}

export const usePeopleStore = create<PeopleState>((set) => ({
    people: [],
    loading: true,
    loadPeople: async () => {
        try {
            const db = await dbPromise;
            const people = await db.getAll('people');
            set({ people, loading: false });
        } catch (error) {
            console.error("Failed to load people", error);
            set({ loading: false });
        }
    },
    addPerson: async (name, emoji) => {
        const newPerson: Person = { id: uuidv4(), name, emoji };
        const db = await dbPromise;
        await db.put('people', newPerson);
        set(state => ({ people: [...state.people, newPerson] }));
    },
    removePerson: async (id) => {
        const db = await dbPromise;
        await db.delete('people', id);
        set(state => ({ people: state.people.filter(p => p.id !== id) }));
    },
    updatePerson: async (person) => {
        const db = await dbPromise;
        await db.put('people', person);
        set(state => ({
            people: state.people.map(p => (p.id === person.id ? person : p))
        }));
    }
}));
