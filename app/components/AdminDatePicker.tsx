'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './AdminDatePicker.module.css';

interface DatePickerProps {
    value: string; // Expected format: YYYY-MM-DD
    onChange: (date: string) => void;
    placeholder?: string;
    id?: string;
}

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function AdminDatePicker({ value, onChange, placeholder = 'dd/mm/aaaa', id }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Date logic state (viewing month/year)
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth());

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync internal state if value changes externally
    useEffect(() => {
        if (value) {
            const [y, m, d] = value.split('-').map(Number);
            setYear(y);
            setMonth(m - 1); // 0-indexed
        }
    }, [value, isOpen]);

    const getDaysInMonth = (y: number, m: number) => {
        return new Date(y, m + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (y: number, m: number) => {
        return new Date(y, m, 1).getDay(); // 0 = Sunday
    };

    const handlePrevMonth = () => {
        if (month === 0) {
            setMonth(11);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 11) {
            setMonth(0);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    const handleSelectDate = (day: number) => {
        const mStr = (month + 1).toString().padStart(2, '0');
        const dStr = day.toString().padStart(2, '0');
        const dateStr = `${year}-${mStr}-${dStr}`;

        onChange(dateStr);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange('');
        setIsOpen(false);
    };

    const handleToday = () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
        const d = today.getDate();

        const mStr = (m + 1).toString().padStart(2, '0');
        const dStr = d.toString().padStart(2, '0');
        const dateStr = `${y}-${mStr}-${dStr}`;

        // Update view to today
        setYear(y);
        setMonth(m);

        onChange(dateStr);
        setIsOpen(false);
    };

    // Rendering Helpers
    const formatDateDisplay = (isoString: string) => {
        if (!isoString) return '';
        const [y, m, d] = isoString.split('-');
        return `${d}/${m}/${y}`;
    };

    const totalDays = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);

    const isSelected = (d: number) => {
        if (!value) return false;
        const [vy, vm, vd] = value.split('-').map(Number);
        return vy === year && vm === (month + 1) && vd === d;
    };

    const isToday = (d: number) => {
        const today = new Date();
        return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    };

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.inputWrapper} onClick={() => setIsOpen(!isOpen)}>
                <input
                    id={id}
                    type="text"
                    readOnly
                    className={styles.input}
                    value={formatDateDisplay(value)}
                    placeholder={placeholder}
                />
                <svg className={styles.calendarIcon} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </div>

            {isOpen && (
                <div className={styles.popup}>
                    <div className={styles.header}>
                        <div className={styles.monthTitle}>
                            {MONTHS[month]} de {year}
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </div>
                        <div className={styles.navContainer}>
                            <button type="button" className={styles.navButton} onClick={handlePrevMonth}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 19V5" />
                                    <path d="m5 12 7-7 7 7" />
                                </svg>
                            </button>
                            <button type="button" className={styles.navButton} onClick={handleNextMonth}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14" />
                                    <path d="m19 12-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className={styles.grid}>
                        {DAYS.map((day, index) => (
                            <div key={`${day}-${index}`} className={styles.dayLabel}>{day}</div>
                        ))}

                        {/* Empty cells for start day */}
                        {Array.from({ length: startDay }).map((_, i) => (
                            <div key={`empty-${i}`} className={styles.emptyDay}></div>
                        ))}

                        {/* Days */}
                        {Array.from({ length: totalDays }).map((_, i) => {
                            const day = i + 1;
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    className={`${styles.dayButton} ${isSelected(day) ? styles.selectedDay : ''} ${isToday(day) ? styles.today : ''}`}
                                    onClick={() => handleSelectDate(day)}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    <div className={styles.footer}>
                        <button type="button" className={`${styles.footerButton} ${styles.clearButton}`} onClick={handleClear}>
                            Limpar
                        </button>
                        <button type="button" className={`${styles.footerButton} ${styles.todayButton}`} onClick={handleToday}>
                            Hoje
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
