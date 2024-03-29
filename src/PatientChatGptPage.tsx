import './App.css';
import { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import FhirApi from './api/fhirApi';
import EnvironmentContext from './context/EnvironmentContext';
import UserContext from './context/UserContext';

function PatientChatGptPage() {
    const { id } = useParams();
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const [textInput, setTextInput] = useState('What is the age of this patient?');

    const [textResponse, setTextResponse] = useState('');

    const [apiData, setApiData] = useState<any>('');

    const handleInputChange = (event: any) => {
        setTextInput(event.target.value);
    };

    const callApi = async () => {
        try {
            setApiData({});
            setTextResponse('Running...');
            const patientId = 'john-muir-health-e.k-4ea143ZrQGvdUvf-b2y.tdyiVMBWgblY4f6y2zis3';
            const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
            const data = await fhirApi.getPatientEverythingAsync({
                patientId,
                question: textInput,
            });
            console.log(data);
            setApiData(data);
            if (data.entry && data.entry.length > 0) {
                const patient = data.entry[0].resource;
                if (patient && patient.text && patient.text.div) {
                    console.log(patient.text.div);
                    setTextResponse(patient.text.div);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="App">
            <div>{id}</div>
            <textarea value={textInput} onChange={handleInputChange} rows={4} cols={100} />
            <br />
            <button onClick={callApi}>Ask</button>
            <div>
                {textResponse ? (
                    <div dangerouslySetInnerHTML={{ __html: textResponse }} />
                ) : (
                    <p></p>
                )}
            </div>
            <hr />
            <div>
                {apiData ? (
                    <div>
                        <h2>API Response:</h2>
                        <pre>{JSON.stringify(apiData, null, 2)}</pre>
                    </div>
                ) : (
                    <p></p>
                )}
            </div>
        </div>
    );
}

export default PatientChatGptPage;
