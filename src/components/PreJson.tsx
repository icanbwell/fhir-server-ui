import React from 'react';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import 'react18-json-view/src/dark.css';
import { useTheme } from '../context/ThemeContext';

const PreJson = ({ data, collapsed }: { data: Object|String|null; collapsed?: boolean | number }): React.ReactElement => {
    const { isDarkMode } = useTheme();

    return (
        <>
            {!!data && typeof data === 'object' && (
                <JsonView
                    src={data}
                    theme="vscode"
                    dark={isDarkMode}
                    collapsed={collapsed}
                    style={{ fontSize: '13px' }}
                />
            )}
        </>
    );
};

export default PreJson;
