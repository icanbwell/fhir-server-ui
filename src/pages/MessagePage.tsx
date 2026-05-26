// MessagePage.js
import { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const MessagePage = ({ message }: { message: string }) => {
    useEffect(() => { document.title = 'FHIR Server'; }, []);
    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <div id="message-page" style={{ padding: '0 10px' }}>
                    <p>{message}</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default MessagePage;
