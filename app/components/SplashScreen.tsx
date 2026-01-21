'use client';

import { useEffect, useState } from 'react';
import styles from './splash.module.css';

export default function SplashScreen() {
    const [show, setShow] = useState(true);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        // Start exit animation slightly before removing
        const timer1 = setTimeout(() => setAnimate(true), 2000);
        const timer2 = setTimeout(() => setShow(false), 2500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    if (!show) return null;

    return (
        <div className={`${styles.container} ${animate ? styles.fadeOut : ''}`}>
            <div className={styles.logoWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-black.png" alt="Chama Church" className={styles.logo} />
            </div>
        </div>
    );
}
