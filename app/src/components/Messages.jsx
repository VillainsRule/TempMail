import styles from '@styles/messages.module.css';
import React from 'react';

export default function Email({ states }) {
    let [ messages, setMessages ] = states[0];
    let refs = [];
    return (
        <>
            <div className={styles.messageList}>
                {messages.map((message, i) => {
                    refs.push(React.createRef());
                    return (<div className={styles.email} key={i + 1} ref={refs[refs.length - 1]}>
                        <div className={styles.infoColumn}>
                            <div className={styles.author}>{message.from}</div>
                            <div className={styles.subject} onClick={() => {
                                refs[i].current.toggled = !refs[i].current.toggled;
                                if (refs[i].current.toggled) {
                                    if (message.id > 0) {
                                        fetch("/api/content?id=" + message.id).then(r => r.text()).then(r => {
                                            document.getElementById("content-" + message.id).innerHTML = r;
                                        });
                                    }
                                } else {
                                    document.getElementById("content-" + message.id).innerHTML = "";
                                }
                            }}>{message.title.full}</div>
                            <div id={"content-" + message.id}></div>
                        </div>
                    </div>);
                })}
            </div>
        </>
    )
};