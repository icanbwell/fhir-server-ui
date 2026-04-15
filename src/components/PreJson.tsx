import React from 'react';
import ReactJson from 'react-json-view';
import { useTheme } from '../context/ThemeContext';

const PreJson = ({ data, collapsed }: { data: Object|String|null; collapsed?: boolean | number }): React.ReactElement => {
    const { isDarkMode } = useTheme();

    return (
        <>
            {!!data && typeof data === 'object' && (
                <ReactJson
                    src={data}
                    displayDataTypes={false}
                    theme={isDarkMode ? 'colors' : 'rjv-default'}
                    style={{
                        fontSize: '13px',
                        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                    }}
                    collapsed={collapsed}
                />
            )}
        </>
    );
};

export default PreJson;
