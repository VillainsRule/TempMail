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

    useEffect(() => {
        setEmail('loading...');
        fetch('/api/shuffle/' + provider).then(r => r.json()).then(r => {
            console.log(r);
            setEmail(r.email);
        });
    }, [ provider ]);

    return (
        <>
            <div className={styles.background} />

            <Header />
            <Email states={[ email, setShowingProviders ]}/>
            <Messages />

            { showingProviders ? <ProviderList /> : ''}
        </>
    );
};