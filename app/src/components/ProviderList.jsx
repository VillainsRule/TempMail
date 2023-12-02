import styles from '@styles/providerList.module.css';

function range(max) {
    let arr = [];
    for (let i = 0; i < max; i++) arr.push(i);
    return arr;
}

export default function ProviderList({ visibleStates, providerStates, funcs }) {
    let [ showingProviders, setShowingProviders ] = visibleStates;
    let [ provider, setProvider ] = providerStates;
    let [ toExpiry ] = funcs;

    return (
        <>
            <div className={styles.filteredBackground} />
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>Email Providers</div>
                    <div className={styles.modalClose} onClick={() => setShowingProviders(false)}>X</div>
                </div>
                <div className={styles.modalBody}>
                    <p style={{color: "gray"}}>Are your other emails blocked? You may switch providers with this menu.</p>
                    {range(4).map(i => (
                        <div className={styles.provider} key={i}>
                            <div className={styles.providerName}>Server {i}</div>
                            <div className={styles.providerButton} onClick={() => {
                                setProvider(i);
                                setShowingProviders(false);
                                toExpiry();
                            }}>Use</div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}