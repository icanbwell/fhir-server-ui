import React from 'react';

const PreJson = ({ data }: { data: Object|String|null }): React.ReactElement => {
    const styles = { overflow: 'scroll', display: 'block' };

    return <div>{!!data && <pre style={styles}>{JSON.stringify(data, null, 2)}</pre>}</div>;
};

export default PreJson;
