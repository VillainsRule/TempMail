import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Main from '@components/Main';
import Error from '@components/Error';

import { ErrorBoundary } from './errorBoundary';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Main />} />
                <Route path='*' element={<Error title='404' description={'well, you\'re lost.'} link='/' />} />
            </Routes>
        </BrowserRouter>
    );
};

createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);