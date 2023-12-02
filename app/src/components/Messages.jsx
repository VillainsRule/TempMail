import styles from '@styles/messages.module.css';
import React from 'react';
import sanitizeHtml from 'sanitize-html';

export default function Email({ states }) {
    let [ messages, setMessages ] = states[0];
    let [ cachedMessages, setCachedMessages ] = states[1];
    let refs = [];
    let msg_id_cache = {};
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
                                        let c = cachedMessages[message.id];
                                        if (c) {
                                            document.getElementById("content-" + message.id).innerHTML = sanitizeHtml(c, {
                                                allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'style' ]),
                                                allowVulnerableTags: true
                                            });
                                        } else {
                                            fetch("/api/content?id=" + message.id).then(r => r.text()).then(r => {
                                                msg_id_cache[message.id] = r;
                                                setCachedMessages(msg_id_cache);
                                                document.getElementById("content-" + message.id).innerHTML = sanitizeHtml(r, {
                                                    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'style' ]),
                                                    allowVulnerableTags: true
                                                });
                                            });
                                        }
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