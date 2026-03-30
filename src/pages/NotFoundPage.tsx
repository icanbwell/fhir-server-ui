// NotFoundPage.js
import Header from '../components/Header';
import Footer from '../components/Footer';

const NotFoundPage = () => {
    document.title = 'FHIR Server';
    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <div id="not-found-page" style={{ padding: '0 10px' }}>
                    <h2>Oops!</h2>
                    <p>You seem to have entered an incorrect path.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default NotFoundPage;
