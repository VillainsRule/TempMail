import { useNavigate } from 'react-router-dom';

import styles from '@styles/error.module.css';

export default function Error({ title, description, link }) {
    let navigate;
    if (link) navigate = useNavigate();
    
    return (
        <>
            <div className={styles.blurb}>
                <img src='/favicon.ico' className={styles.logo} draggable='false' />
                <div className={styles.textColumn}>
                    <div className={styles.title}>{title}</div>
                    <div className={styles.description}>{description}</div>
                    { link ? <div className={styles.link} onClick={() => navigate(link)}>go home</div> : ''}
                </div>
            </div>
        </>
    )
}