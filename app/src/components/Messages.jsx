import styles from '@styles/messages.module.css';

export default function Email() {
    return (
        <>
            <div className={styles.messageList}>
                <div className={styles.email}>
                    <div className={styles.infoColumn}>
                        <div className={styles.author}>from: we-are@aclovers.lol</div>
                        <div className={styles.subject}>we love you ac</div>
                    </div>
                </div>
                <div className={styles.email}>
                    <div className={styles.infoColumn}>
                        <div className={styles.author}>from: we-are@aclovers.lol</div>
                        <div className={styles.subject}>we love you ac</div>
                    </div>
                </div>
            </div>
        </>
    )
};