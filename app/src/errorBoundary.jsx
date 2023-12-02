import React from 'react';
import Error from '@components/Error';

export class ErrorBoundary extends React.Component {
    state = {
        error: ''
    };

    constructor(props) {
        super(props);
    };

    static getDerivedStateFromError(error) {
        return { error };
    };

    componentDidCatch(error, errorInfo) {
        this.setState({ error });
        console.error(error, errorInfo);
    };

    render() {
        if (this.state.error !== '') return ( <Error title='ultra rare error' description={'there was a very rare error showing tempmail to you. reload the page, and if this error persists, please contact developers.'} link={false} /> );
        return this.props.children;
    };
};