import styles from '@styles/messages.module.css';

export default function Email({ states }) {
    let [ messages, setMessages ] = states[0];
    return (
        <>
            <div className={styles.messageList}>
                {messages.map((message, i) => (
                    <div className={styles.email} key={i + 1}>
                        <div className={styles.infoColumn}>
                            <div className={styles.author}>{message.from}</div>
                            <div className={styles.subject} onClick={() => {
                                fetch("/api/content?id=" + message.id).then(r => r.text()).then(r => {
                                    document.getElementById("content-" + message.id).innerHTML = r;
                                });
                            }}>{message.title.full}</div>
                            <div id={"content-" + message.id}></div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
};