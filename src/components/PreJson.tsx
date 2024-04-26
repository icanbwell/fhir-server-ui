import React from 'react';
import ReactJson from 'react-json-view';

const PreJson = ({ data }: { data: Object|String|null }): React.ReactElement => {
    return <>{!!data && <ReactJson src={data} displayDataTypes={false} />}</>;
};

export default PreJson;
