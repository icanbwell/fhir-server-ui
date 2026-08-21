import React from 'react';
import { TDateTime } from '../types/simpleTypes/DateTime';
import { formatHumanDate } from '../utils/dateFormat';

const DateValue: React.FC<{ value?: TDateTime }> = ({ value }) => {
    if (!value) {
        return <>—</>;
    }
    const humanReadable = formatHumanDate(value);
    return <>{humanReadable ?? String(value)}</>;
};

export default DateValue;
