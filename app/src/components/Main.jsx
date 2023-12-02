import { useEffect, useState } from 'react';

import Header from '@components/Header';
import Email from '@components/Email';
import Messages from '@components/Messages';
import ProviderList from '@components/ProviderList';

import styles from '@styles/main.module.css';

export default function Main() {
    let [ provider, setProvider ] = useState(1);
    let [ email, setEmail ] = useState('loading...');
    let [ messages, setMessages ] = useState([]);
    let [ showingProviders, setShowingProviders ] = useState(false);

    const toExpiry = (s = false, pr = 1) => {
        setEmail('loading...');
        if (s) {
            return fetch('/api/shuffle/' + (pr || provider)).then(r => r.json()).then(r => {
                console.log(r);
                setEmail(r.email);
                setMessages(r.mail);
            });
        }
        fetch("/api/me").then(r => r.json()).then(r => {
            if (r.error) {
                fetch('/api/shuffle/' + provider).then(r => r.json()).then(r => {
                    setEmail(r.email);
                    setMessages(r.mail);
                });
            } else {
                if (r.hasEmail) {
                    setEmail(r.email);
                    setMessages(r.messages);
                }
            }
        });
    };

    const getExpiry = async () => {
        let r = await fetch('/api/tl');
        let j = await r.json();
        return j.timeLeft / 1000;
    };

    useEffect(() => {
        toExpiry();
    }, [ provider ]);

    return (
        <>
            <div className={styles.background} />

            <Header />
            <Email states={[ email, setShowingProviders ]} funcs={[ toExpiry, getExpiry ]}/>
            <Messages states={[ [messages, setMessages] ]} />

            { showingProviders ? <ProviderList visibleStates={[ showingProviders, setShowingProviders ]} providerStates={[ provider, setProvider ]} funcs={[ toExpiry, getExpiry ]} /> : null }
        </>
    );
};