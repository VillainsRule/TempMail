import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

import styles from '@styles/header.module.css';

export default function Header() {
    return (
        <>
            <div className={styles.headerRow}>
                <div className={styles.siteName}>
                    <span className={styles.whiteText}>Temp</span>
                    <span className={styles.blueText}>Mail</span>
                </div>

                <div className={styles.buttonRow}>
                    <FontAwesomeIcon icon={faGithub} className={styles.button} onClick={() => open('https://github.com/VillainsRule/TempMail')} />
                </div>
            </div>
        </>
    );
}