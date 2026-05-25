// AccessDenied.js
import { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AccessDenied = () => {
    useEffect(() => { document.title = 'FHIR Server'; }, []);
    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <div id="access-denied-page" style={{ padding: '0 10px' }}>
                    <h2>Access Denied</h2>
                    <p>You do not have permission to view this page.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AccessDenied;
