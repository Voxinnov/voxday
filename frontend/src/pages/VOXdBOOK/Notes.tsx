import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MicOff, Trash2, Palette, Pin } from 'lucide-react';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';

interface Note {
    id: number;
    title: string;
    content: string;
    color: string;
    is_pinned: boolean;
    updated_at: string;
}

const COLORS = ['#ffffff', '#f28b82', '#fbbc04', '#fff475', '#ccff90', '#a7ffeb', '#cbf0f8', '#aecbfa', '#d7aefb', '#fdcfe8', '#e6c9a8', '#e8eaed'];

// Basic Masonry Layout helper given equal width items
const MasonryLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {children}
        </div>
    );
};

// Use SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const Notes: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [activeNote, setActiveNote] = useState<Note | null>(null);

    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [noteColor, setNoteColor] = useState('#ffffff');
    const [isPinned, setIsPinned] = useState(false);

    const [isListening, setIsListening] = useState(false);
    const isListeningRef = useRef(false);
    const lastProcessedIndexRef = useRef(0);
    const recognitionRef = useRef<any>(null);
    const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        fetchNotes();
        setupSpeechRecognition();
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const fetchNotes = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/notes');
            setNotes(response.data.data);
        } catch (error) {
            console.error('Error fetching notes:', error);
            toast.error('Failed to load notes');
        } finally {
            setIsLoading(false);
        }
    };

    const setupSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                lastProcessedIndexRef.current = 0;
            };

            recognition.onresult = (event: any) => {
                let finalTranscript = '';

                for (let i = lastProcessedIndexRef.current; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                        lastProcessedIndexRef.current = i + 1;
                    }
                }

                if (finalTranscript !== '') {
                    setNoteContent((prev) => {
                        const newContent = prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript;
                        return newContent;
                    });
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    toast.error("Microphone access blocked.");
                    isListeningRef.current = false;
                    setIsListening(false);
                } else if (event.error !== 'no-speech') {
                    // on non-trivial errors, we toggle off
                    isListeningRef.current = false;
                    setIsListening(false);
                }
            };

            recognition.onend = () => {
                // Keep listening if manually toggled on, otherwise button stops it
                if (isListeningRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error("Failed to restart recognition:", e);
                    }
                } else {
                    setIsListening(false);
                }
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Speech recognition not supported in this browser.");
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error('Speech recognition is not supported in this browser.');
            return;
        }

        if (isListeningRef.current) {
            isListeningRef.current = false;
            setIsListening(false);
            try {
                recognitionRef.current.stop();
            } catch (e) { }
        } else {
            isListeningRef.current = true;
            setIsListening(true);
            try {
                recognitionRef.current.start();
            } catch (err) {
                console.error(err);
                isListeningRef.current = false;
                setIsListening(false);
            }
        }
    };

    const resetForm = () => {
        setNoteTitle('');
        setNoteContent('');
        setNoteColor('#ffffff');
        setIsPinned(false);
        setActiveNote(null);
        setIsCreating(false);
        if (isListeningRef.current && recognitionRef.current) {
            isListeningRef.current = false;
            setIsListening(false);
            try {
                recognitionRef.current.stop();
            } catch (e) { }
        }
    };

    const handleSave = async () => {
        if (!noteTitle.trim() && !noteContent.trim()) {
            resetForm();
            return;
        }

        try {
            if (activeNote) {
                await api.put(`/notes/${activeNote.id}`, {
                    title: noteTitle,
                    content: noteContent,
                    color: noteColor,
                    is_pinned: isPinned
                });
                toast.success('Note updated');
            } else {
                await api.post('/notes', {
                    title: noteTitle,
                    content: noteContent,
                    color: noteColor,
                    is_pinned: isPinned
                });
                toast.success('Note created');
            }
            fetchNotes();
            resetForm();
        } catch (error) {
            console.error('Error saving note:', error);
            toast.error('Failed to save note');
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.delete(`/notes/${id}`);
            toast.success('Note deleted');
            if (activeNote?.id === id) resetForm();
            fetchNotes();
        } catch (error) {
            toast.error('Failed to delete note');
        }
    };

    const handleTogglePin = async (note: Note, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.put(`/notes/${note.id}`, { ...note, is_pinned: !note.is_pinned });
            fetchNotes();
            if (activeNote?.id === note.id) setIsPinned(!isPinned);
        } catch (error) {
            toast.error('Failed to pin note');
        }
    };

    const handleNoteClick = (note: Note) => {
        setActiveNote(note);
        setNoteTitle(note.title);
        setNoteContent(note.content);
        setNoteColor(note.color);
        setIsPinned(note.is_pinned);
        setIsCreating(true);
    };

    const openCreator = () => {
        resetForm();
        setIsCreating(true);
        setTimeout(() => contentTextareaRef.current?.focus(), 50);
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
    const otherNotes = filteredNotes.filter(n => !n.is_pinned);

    // Dynamic textarea resize helper
    const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
        setNoteContent(e.target.value);
    };

    const NoteCard = ({ note }: { note: Note }) => (
        <div
            onClick={() => handleNoteClick(note)}
            style={{ backgroundColor: note.color }}
            className={`group break-inside-avoid shadow-sm hover:shadow-md transition-shadow duration-200 border rounded-xl overflow-hidden cursor-pointer relative ${note.color === '#ffffff' ? 'border-gray-200' : 'border-transparent'}`}
        >
            <div className="p-4">
                {(note.title || note.is_pinned) && (
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="font-semibold text-gray-800 text-sm break-words whitespace-pre-wrap">{note.title}</h3>
                        <button
                            onClick={(e) => handleTogglePin(note, e)}
                            className={`p-1.5 rounded-full hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100 ${note.is_pinned ? 'opacity-100' : ''}`}
                        >
                            <Pin size={16} className={`transform ${note.is_pinned ? 'fill-gray-700 text-gray-700' : 'text-gray-500'}`} />
                        </button>
                    </div>
                )}
                <div className="text-gray-700 text-sm whitespace-pre-wrap break-words" style={{ maxHeight: '30vh', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {note.content || <span className="text-gray-400 italic">Empty note</span>}
                </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex gap-2 p-2 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/5 to-transparent transition-opacity">
                <button
                    onClick={(e) => handleDelete(note.id, e)}
                    className="p-1.5 rounded-full hover:bg-black/10 text-gray-600 ml-auto"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white">
            <header className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-gray-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-600 p-1.5 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </span>
                        Notes
                    </h1>
                </div>
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent rounded-xl text-sm focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8f9fa] relative">

                {/* Note Creator UI */}
                {!isCreating ? (
                    <div className="max-w-xl mx-auto mb-10">
                        <div
                            onClick={openCreator}
                            className="bg-white rounded-xl shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] p-4 flex items-center text-gray-500 cursor-text hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] transition-shadow duration-300"
                        >
                            <span className="flex-1 font-medium">Take a note...</span>
                            <div className="flex gap-4 px-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openCreator(); toggleListening(); }}
                                    className="text-gray-500 hover:text-gray-800"
                                    title="Voice note"
                                >
                                    <Mic size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Editor Modal Overlay */}
                {isCreating && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={handleSave} />
                        <div
                            style={{ backgroundColor: noteColor }}
                            className="relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden transition-all border border-gray-200"
                        >
                            <div className="p-5 space-y-3">
                                <div className="flex justify-between items-start">
                                    <input
                                        type="text"
                                        placeholder="Title"
                                        style={{ backgroundColor: 'transparent' }}
                                        className="w-full text-lg font-semibold text-gray-800 outline-none placeholder-gray-500"
                                        value={noteTitle}
                                        onChange={e => setNoteTitle(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setIsPinned(!isPinned)}
                                        className="p-2 text-gray-500 hover:bg-black/5 rounded-full transition-colors"
                                    >
                                        <Pin size={20} className={isPinned ? 'fill-current' : ''} />
                                    </button>
                                </div>
                                <textarea
                                    ref={contentTextareaRef}
                                    placeholder="Take a note..."
                                    style={{ backgroundColor: 'transparent' }}
                                    className="w-full text-sm text-gray-700 outline-none resize-none min-h-[120px] max-h-[60vh] overflow-y-auto"
                                    value={noteContent}
                                    onChange={handleInputResize}
                                />
                                {isListening && (
                                    <div className="flex items-center gap-2 text-xs text-red-500 animate-pulse bg-red-50 w-fit px-2 py-1 rounded-md">
                                        <Mic size={14} /> Listening...
                                    </div>
                                )}
                            </div>

                            {/* Editor Toolbar */}
                            <div className="px-4 py-2 flex items-center justify-between border-t border-black/5 bg-black/5">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={toggleListening}
                                        className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'text-gray-600 hover:bg-black/10'}`}
                                        title={isListening ? "Stop dictation" : "Start dictation"}
                                    >
                                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                    </button>

                                    <div className="relative group">
                                        <button className="p-2 rounded-full text-gray-600 hover:bg-black/10 transition-colors" title="Background options">
                                            <Palette size={18} />
                                        </button>
                                        <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-xl border border-gray-100 flex flex-wrap gap-1.5 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none group-hover:pointer-events-auto">
                                            {COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={(e) => { e.stopPropagation(); setNoteColor(c); }}
                                                    className={`w-8 h-8 rounded-full border ${noteColor === c ? 'border-amber-500 border-2' : 'border-gray-200'} hover:scale-110 transition-transform`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    className="px-5 py-1.5 bg-gray-800 text-white font-medium text-sm rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes Display */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20 text-gray-400">Loading notes...</div>
                ) : notes.length === 0 && !searchTerm ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-30">
                        <svg className="w-24 h-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="text-xl font-medium tracking-wide">Notes you add appear here</p>
                    </div>
                ) : (
                    <div className="max-w-screen-2xl mx-auto">
                        {pinnedNotes.length > 0 && (
                            <div className="mb-8">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-2 mb-4">PINNED</p>
                                <MasonryLayout>
                                    {pinnedNotes.map(note => <NoteCard key={note.id} note={note} />)}
                                </MasonryLayout>
                            </div>
                        )}

                        {(pinnedNotes.length > 0 && otherNotes.length > 0) && (
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-2 mb-4 mt-8">OTHERS</p>
                        )}

                        {otherNotes.length > 0 && (
                            <MasonryLayout>
                                {otherNotes.map(note => <NoteCard key={note.id} note={note} />)}
                            </MasonryLayout>
                        )}

                        {filteredNotes.length === 0 && searchTerm && (
                            <div className="text-center py-10 text-gray-500">
                                No matching notes found.
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Notes;
