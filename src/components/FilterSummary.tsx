import { Box, Chip, Paper, Typography } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

interface FilterSummaryProps {
    queryString: string;
    resourceType: string;
}

const FilterSummary = ({ queryString, resourceType }: FilterSummaryProps) => {
    if (!queryString) {
        return null;
    }

    const queryParams = new URLSearchParams(queryString);
    
    // System parameters that shouldn't be displayed as filters
    const systemParams = ['_count', '_getpagesoffset', '_format', '_metaUuid'];
    
    // Get filter label mapping
    const getFilterLabel = (key: string): string => {
        const labelMap: { [key: string]: string } = {
            '_lastUpdated': 'Last Updated',
            'date': 'Date',
            'given': 'Given Name',
            'family': 'Family Name',
            'email': 'Email',
            'identifier': 'Identifier',
            '_security': 'Security',
            'npi': 'NPI',
            'name': 'Name',
            'id': 'ID',
            '_source': 'Source',
        };
        
        // Handle :exact suffix
        const cleanKey = key.replace(':exact', '');
        return labelMap[cleanKey] || cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);
    };
    
    // Format filter value for display
    const formatFilterValue = (key: string, value: string): string => {
        // Handle date comparisons
        if (value.startsWith('ge') || value.startsWith('gt')) {
            return `≥ ${value.substring(2)}`;
        }
        if (value.startsWith('le') || value.startsWith('lt')) {
            return `≤ ${value.substring(2)}`;
        }
        return value;
    };
    
    // Collect all filters (excluding system parameters)
    const filters: Array<{ key: string; value: string; label: string; displayValue: string }> = [];
    queryParams.forEach((value, key) => {
        if (!systemParams.includes(key) && value) {
            filters.push({
                key,
                value,
                label: getFilterLabel(key),
                displayValue: formatFilterValue(key, value),
            });
        }
    });
    
    if (filters.length === 0) {
        return null;
    }
    
    return (
        <Paper
            elevation={1}
            sx={{
                p: 2,
                mb: 2,
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FilterListIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" component="div">
                    Active Filters for {resourceType} Bundle
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {filters.map((filter, index) => (
                    <Chip
                        key={`${filter.key}-${index}`}
                        label={`${filter.label}: ${filter.displayValue}`}
                        variant="outlined"
                        color="primary"
                        size="medium"
                    />
                ))}
            </Box>
        </Paper>
    );
};

export default FilterSummary;
