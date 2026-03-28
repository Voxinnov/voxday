import React, { useState, useEffect, useRef } from 'react';
import { BellRing, Clock, BellOff, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../services/smartApi';

interface Reminder {
    id: number;
    title: string;
    description?: string;
    event_date: string;
    event_time?: string;
    status: 'pending' | 'completed';
}

const GlobalReminder: React.FC = () => {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [activeAlarm, setActiveAlarm] = useState<Reminder | null>(null);
    const [turningOff, setTurningOff] = useState(false);
    const notifiedRemindersRef = useRef<Set<number>>(new Set());
    const audioCtxRef = useRef<AudioContext | null>(null);
    const beepIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const location = useLocation();

    const fetchReminders = async () => {
        try {
            const response = await api.get('/reminders');
            setReminders(response.data);
        } catch (error) {
            console.error('Error fetching reminders:', error);
        }
    };

    useEffect(() => {
        fetchReminders();
        // Poll every 10 seconds to catch newly added reminders
        const fetchIntervalId = setInterval(fetchReminders, 10000);
        return () => clearInterval(fetchIntervalId);
    }, [location.pathname]);

    const startContinuousBeep = () => {
        if (beepIntervalRef.current) return;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioContextClass();
            }
            const audioCtx = audioCtxRef.current;

            const playDoubleBeep = () => {
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }

                const createTone = (startTime: number) => {
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);

                    oscillator.type = 'sine';
                    oscillator.frequency.value = 880;

                    gainNode.gain.setValueAtTime(0, startTime);
                    gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

                    oscillator.start(startTime);
                    oscillator.stop(startTime + 0.2);
                };

                const now = audioCtx.currentTime;
                createTone(now);
                createTone(now + 0.3);
            };

            playDoubleBeep();
            beepIntervalRef.current = setInterval(playDoubleBeep, 1000);
        } catch (e) {
            console.error('Audio playback failed', e);
        }
    };

    const stopContinuousBeep = () => {
        if (beepIntervalRef.current) {
            clearInterval(beepIntervalRef.current);
            beepIntervalRef.current = null;
        }
    };

    // Dismiss: hides for this session only — reminder stays pending
    const dismissAlarm = () => {
        setActiveAlarm(null);
        stopContinuousBeep();
    };

    // Turn OFF: marks reminder as completed permanently — won't show again as popup
    // But it will still appear in the calendar (with muted/strikethrough style)
    const turnOffReminder = async () => {
        if (!activeAlarm) return;
        setTurningOff(true);
        try {
            await api.patch(`/reminders/${activeAlarm.id}/status`, { status: 'completed' });
            // Update local state so the popup won't re-trigger
            setReminders(prev =>
                prev.map(r => r.id === activeAlarm.id ? { ...r, status: 'completed' } : r)
            );
            setActiveAlarm(null);
            stopContinuousBeep();
        } catch (error) {
            console.error('Error turning off reminder:', error);
        } finally {
            setTurningOff(false);
        }
    };

    useEffect(() => {
        const checkReminders = () => {
            if (!reminders.length) return;

            const now = new Date();

            const triggered = reminders.find(r => {
                if (r.status !== 'pending') return false;

                const rDate = new Date(r.event_date);
                if (r.event_time) {
                    const [hours, minutes] = r.event_time.split(':').map(Number);
                    rDate.setHours(hours, minutes, 0, 0);
                } else {
                    rDate.setHours(0, 0, 0, 0);
                }

                if (rDate > now) return false;
                if (notifiedRemindersRef.current.has(r.id)) return false;
                return true;
            });

            if (triggered && !activeAlarm) {
                notifiedRemindersRef.current.add(triggered.id);
                setActiveAlarm(triggered);
                startContinuousBeep();
            }
        };

        const intervalId = setInterval(checkReminders, 10000);
        checkReminders();

        return () => clearInterval(intervalId);
    }, [reminders, activeAlarm]);

    if (!activeAlarm) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={dismissAlarm} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all border border-pink-100 animate-fade-in-up">

                {/* Header */}
                <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                    <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center mx-auto mb-5 relative z-10 border-4 border-pink-400">
                        <BellRing size={36} className="text-pink-600 animate-[bounce_1s_infinite]" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white relative z-10 tracking-tight">Reminder Alert</h2>
                </div>

                {/* Content */}
                <div className="px-6 py-6 text-center space-y-4 bg-white">
                    <h3 className="text-2xl font-bold text-gray-800 break-words leading-tight">{activeAlarm.title}</h3>
                    {activeAlarm.description && (
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{activeAlarm.description}</p>
                    )}
                    {activeAlarm.event_time && (
                        <div className="flex items-center justify-center gap-2 text-pink-700 font-bold bg-pink-50 py-2.5 px-5 rounded-xl inline-flex mx-auto border border-pink-100 shadow-sm">
                            <Clock size={18} />
                            {activeAlarm.event_time.slice(0, 5)}
                        </div>
                    )}

                    {/* OFF hint */}
                    <p className="text-xs text-gray-400 mt-1">
                        Click <strong>Turn OFF</strong> to permanently silence this reminder. It will still appear in the calendar.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-6 pt-2 flex flex-col gap-3 bg-white">
                    {/* Turn OFF button — prominent, red-accented */}
                    <button
                        onClick={turnOffReminder}
                        disabled={turningOff}
                        className="w-full flex items-center justify-center gap-2.5 bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 font-bold text-base py-3 px-4 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <BellOff size={20} />
                        {turningOff ? 'Turning Off...' : 'Turn OFF'}
                        <span className="text-xs font-normal text-red-400 ml-1">(Don't show again)</span>
                    </button>

                    {/* Dismiss button — session only */}
                    <button
                        onClick={dismissAlarm}
                        className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-base py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        <X size={18} />
                        Dismiss
                        <span className="text-xs font-normal text-pink-200 ml-1">(Hide for now)</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalReminder;
