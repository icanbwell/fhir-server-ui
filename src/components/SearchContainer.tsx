import { useState } from 'react';
import { TextField, Button, Box, Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchFormQuery from '../utils/searchFormQuery';
import { getAdvSearchFormData, getFormData } from '../utils/searchForm.utils';
import { getStartAndEndDate } from '../utils/auditEventDateFilter';
import { TFieldInfo } from '../types/baseTypes';

export default function SearchContainer({
    onSearch,
    resourceType,
}: {
    onSearch: any;
    resourceType: string;
}) {
    const formData = getFormData(resourceType);
    const advSearchFormData = getAdvSearchFormData(resourceType);
    const { startDate, endDate } = getStartAndEndDate();

    const buildDefaultValues = () => {
        const defaults: any = resourceType === 'AuditEvent' ?
            ({ start: startDate, end: endDate, resourceType }) :
            ({ start: null, end: null, resourceType });
        formData.forEach((data) => {
            defaults[`${data.name}`] = '';
        });
        advSearchFormData.forEach((data) => {
            defaults[`${data.name}`] = '';
        });
        return defaults;
    };

    const [searchParams, setSearchParams] = useState(buildDefaultValues);

    const resetFields = () => {
        setSearchParams(buildDefaultValues());
    };

    const handleSearch = (e: any) => {
        e.preventDefault();

        onSearch(new SearchFormQuery(searchParams));
    };

    const handleChange = (e: any) => {
        e.preventDefault();

        setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
    };

    return (
        <Box
            component="form"
            sx={{
                '& .MuiTextField-root': {
                    ml: 1,
                    mr: 1,
                    mb: 1,
                    width: { xs: 'calc(100% - 16px)', sm: '25ch' },
                    minWidth: { sm: '200px' }
                },
                '& .MuiButton-root': {
                    ml: 1,
                    mr: 1,
                    mb: 1,
                    width: { xs: 'calc(50% - 16px)', sm: 'auto' },
                    minWidth: { sm: '120px' }
                },
                '& .MuiFormControl-root': {
                    ml: 1,
                    mr: 1,
                    mb: 1,
                    width: { xs: 'calc(100% - 16px)', sm: '25ch' },
                    minWidth: { sm: '200px' }
                }
            }}
            noValidate
            autoComplete="on"
            onSubmit={handleSearch}
        >
            <Grid container spacing={1}>
                <Grid size={12}>
                    <DatePicker
                        label="Last Updated After"
                        value={searchParams.start}
                        slotProps={{
                            field: {
                                clearable: true,
                            },
                            textField: {
                                size: 'small',
                                sx: {
                                    ml: 1,
                                    mr: 1,
                                    mb: 1,
                                    width: { xs: 'calc(100% - 16px)', sm: '25ch' },
                                    minWidth: { sm: '200px' }
                                }
                            }
                        }}
                        onChange={(newValue) => setSearchParams({ ...searchParams, start: newValue })}
                    />
                    <DatePicker
                        label="Last Updated Before"
                        value={searchParams.end}
                        slotProps={{
                            field: {
                                clearable: true,
                            },
                            textField: {
                                size: 'small',
                                sx: {
                                    ml: 1,
                                    mr: 1,
                                    mb: 1,
                                    width: { xs: 'calc(100% - 16px)', sm: '25ch' },
                                    minWidth: { sm: '200px' }
                                }
                            }
                        }}
                        onChange={(newValue) => setSearchParams({ ...searchParams, end: newValue })}
                    />
                    {formData.map((data: TFieldInfo) => (
                        <TextField
                            key={data.name}
                            name={data.name}
                            label={data.label}
                            type="text"
                            size="small"
                            value={searchParams[`${data.name}`]}
                            onChange={handleChange}
                        />
                    ))}
                    {advSearchFormData.map((data: TFieldInfo) => (
                        <TextField
                            key={data.name}
                            name={data.name}
                            label={data.label}
                            type="text"
                            size="small"
                            value={searchParams[`${data.name}`]}
                            onChange={handleChange}
                        />
                    ))}
                </Grid>
                <Grid size={12}>
                    <Button variant="outlined" color="secondary" onClick={resetFields}>
                        Reset
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        onClick={handleSearch}
                    >
                        Search
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
