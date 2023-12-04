import { useState, useEffect } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCopy, faListOl } from '@fortawesome/free-solid-svg-icons';
import ReactCountdownClock from 'react-countdown-clock';

import styles from '@styles/email.module.css';

export default function Email({ states, funcs }) {
    let [ email, setShowingProviders ] = states;
    let [ toExpiry, getExpiry ] = funcs;
    let [expiry, setExpiry] = useState(10 * 60);
    let [copied, setCopied] = useState(false);

    const resetExpiry = () => {
        getExpiry().then(r => {
            setExpiry(r || 10 * 60);
        });
    };

    useEffect(() => {
        resetExpiry();
    }, []);

    return (
        <>
            <div className={styles.emailBox}>
                <div className={styles.emailColumn}>
                    <div className={styles.yourEmail}>Your Email Is:</div>
                    <div className={styles.email}>{email}</div>
                </div>

                <div className={styles.rightButtons}>
                    <div className={styles.rightButton}>
                        <ReactCountdownClock
                            seconds={expiry || 10 * 60}
                            color='#fff'
                            alpha={1}
                            size={50}
                            fontSize={0}
                            weight={10}
                            onComplete={() => {
                                setExpiry(10 * 60);
                                toExpiry();
                                resetExpiry();
                            }} />
                    </div>
                    <div className={styles.rightButton}>
                        <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={styles.buttonIcon} onClick={() => {
                            if (!copied) {
                                navigator.clipboard.writeText(email);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 3000);
                            };
                        }} />
                    </div>

                    <div className={styles.rightButton}>
                        <FontAwesomeIcon icon={faListOl} className={styles.buttonIcon} onClick={() => setShowingProviders(true)} />
                    </div>
                </div>
            </div>
        </>
    )
};