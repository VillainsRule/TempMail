import { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCopy, faListOl } from '@fortawesome/free-solid-svg-icons';

import styles from '@styles/email.module.css';

export default function Email({ states }) {
    let [ email, setShowingProviders ] = states;
    let [copied, setCopied] = useState(false);

    return (
        <>
            <div className={styles.emailBox}>
                <div className={styles.emailColumn}>
                    <div className={styles.yourEmail}>Your Email Is:</div>
                    <div className={styles.email}>{email}</div>
                </div>

                <div className={styles.rightButtons}>
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