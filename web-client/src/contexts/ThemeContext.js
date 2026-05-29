/* eslint-disable react/prop-types */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const storedTheme = globalThis.localStorage?.getItem('techstore-theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
        }
        const prefersLight = globalThis.matchMedia?.('(prefers-color-scheme: light)')?.matches ?? false;
        return prefersLight ? 'light' : 'dark';
    });

    const [followSystem, setFollowSystem] = useState(() => !globalThis.localStorage?.getItem('techstore-theme'));

    useEffect(() => {
        if (followSystem) {
            globalThis.localStorage?.removeItem('techstore-theme');
        } else {
            globalThis.localStorage?.setItem('techstore-theme', theme);
        }
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
    }, [theme, followSystem]);

    useEffect(() => {
        if (!followSystem || !globalThis.matchMedia) return undefined;

        const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: light)');
        const handleChange = (event) => setTheme(event.matches ? 'light' : 'dark');

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [followSystem]);

    const value = useMemo(() => ({
        theme,
        isLight: theme === 'light',
        toggleTheme: () => {
            setFollowSystem(false);
            setTheme((current) => (current === 'light' ? 'dark' : 'light'));
        },
        useSystemTheme: () => {
            const prefersLight = globalThis.matchMedia?.('(prefers-color-scheme: light)')?.matches ?? false;
            setFollowSystem(true);
            setTheme(prefersLight ? 'light' : 'dark');
        },
        setTheme,
        followSystem,
    }), [theme, followSystem]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}