import { useState, useEffect } from 'react';
import { usePeopleStore } from '@/store/usePeopleStore';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Plus, User } from 'lucide-react';

export function PeopleManager() {
    const { people, addPerson, removePerson, loadPeople } = usePeopleStore();
    const [isOpen, setIsOpen] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        loadPeople();
    }, [loadPeople]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        await addPerson(newName.trim());
        setNewName('');
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm font-semibold"
            >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Manage People</span>
            </button>

            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-background p-6 text-left align-middle shadow-xl transition-all border border-border">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-foreground flex justify-between items-center"
                                    >
                                        Manage People
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </Dialog.Title>

                                    <div className="mt-4">
                                        <form onSubmit={handleAdd} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                placeholder="Enter name (e.g. Alice)"
                                                className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                            <button
                                                type="submit"
                                                className="p-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 hover:scale-105 transition-all duration-200"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </form>
                                    </div>

                                    <div className="mt-6 space-y-2 max-h-[60vh] overflow-y-auto">
                                        {people.length === 0 ? (
                                            <p className="text-center text-sm text-muted-foreground py-4">No people added yet.</p>
                                        ) : (
                                            people.map((person) => (
                                                <div
                                                    key={person.id}
                                                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                            {person.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-medium">{person.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removePerson(person.id)}
                                                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 p-3 rounded-md hover:scale-110 transition-all duration-200"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}
