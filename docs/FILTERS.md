# FHIR Bundle Filters Documentation

This document explains all the filters that are used to create FHIR bundles in the fhir-server-ui application.

## Overview

When searching for FHIR resources, various filters can be applied to narrow down the results. These filters are converted into query parameters that are sent to the FHIR server to create a Bundle response containing the matching resources.

## Filter Display

As of the latest update, the UI now displays all active filters in a **FilterSummary** component that appears below the search form. This component shows:
- A clear heading indicating which resource type is being filtered
- Individual filter chips showing each active filter with its value
- Human-readable labels for filter names
- Formatted values (e.g., date comparisons with ≥ and ≤ symbols)

## Types of Filters

### 1. Date/Time Filters

#### Last Updated Filter (`_lastUpdated`)
- **Description**: Filters resources based on when they were last modified
- **Format**: 
  - `_lastUpdated=gt{date}` - Resources updated after a specific date
  - `_lastUpdated=lt{date}` - Resources updated before a specific date
- **Example**: `_lastUpdated=gt2024-01-01` returns resources updated after January 1, 2024
- **Applies to**: All resource types except AuditEvent

#### Date Filter (`date`)
- **Description**: Filters resources based on their date field
- **Format**: 
  - `date=gt{date}` - Resources dated after a specific date
  - `date=lt{date}` - Resources dated before a specific date
- **Example**: `date=ge2024-01-01&date=le2024-12-31` returns resources within 2024
- **Applies to**: AuditEvent, Encounter
- **Special Note**: For AuditEvent resources, if no date filter is provided, the system automatically applies a default date range of the last 30 days

### 2. Resource-Specific Search Parameters

#### Patient/Person Resource Filters
- **given**: Given name (first name)
  - Searches using exact match when submitted from the search form
  - Example: `given:exact=John`
- **family**: Family name (last name)
  - Searches using exact match when submitted from the search form
  - Example: `family:exact=Doe`
- **email**: Email address
  - Example: `email=john.doe@example.com`
- **_security**: Security label/tag
  - Example: `_security=https://www.icanbwell.com/owner|client1`

#### Practitioner Resource Filters
- **given**: Given name (first name)
- **family**: Family name (last name)
- **npi**: National Provider Identifier
  - Example: `npi=1234567890`
- **_security**: Security label/tag

#### Organization Resource Filters
- **name**: Organization name
  - Example: `name=General Hospital`
- **_security**: Security label/tag

#### Encounter Resource Filters
- **date**: Date of the encounter (searches the period field)
  - Example: `date=2024-01-15`

### 3. Common Filters (Available for All Resources)

#### Identifier Filter (`identifier`)
- **Description**: Searches by resource identifier
- **Format**: `identifier={system}|{value}` or `identifier={value}`
- **Example**: `identifier=http://hospital.org/mrn|12345`

#### ID Filter (`id`)
- **Description**: Searches by the resource's unique ID
- **Format**: `id={resource-id}`
- **Example**: `id=patient-123`
- **Note**: Uses exact match

#### Source Filter (`_source`)
- **Description**: Filters by the source system that created the resource
- **Format**: `_source={source-url}`
- **Example**: `_source=https://source-system.com`

### 4. System Parameters (Not Displayed as Filters)

These parameters are automatically added by the system and control how results are returned:

#### Count (`_count`)
- **Description**: Number of results per page
- **Default**: 10
- **Format**: `_count=25`
- **User Control**: Can be changed via the "Rows" dropdown in the footer

#### Get Pages Offset (`_getpagesoffset`)
- **Description**: Pagination offset (which page to retrieve)
- **Default**: 0 (first page)
- **Format**: `_getpagesoffset=2` (third page)
- **User Control**: Navigated via Previous/Next buttons in the footer

#### Meta UUID (`_metaUuid`)
- **Description**: Internal system parameter
- **Default**: Always set to 1
- **Format**: `_metaUuid=1`

#### Format (`_format`)
- **Description**: Specifies the response format
- **Format**: `_format=json` or `_format=xml`
- **Note**: When set to JSON, displays raw JSON response instead of formatted cards

## Advanced Search Parameters

For each resource type, additional search parameters are available based on the FHIR specification. These are loaded from `search-parameters.json` and displayed in the Advanced Search section.

The system automatically discovers and displays all string-type search parameters that:
1. Are defined for the specific resource type
2. Are not already included in the basic search form
3. Have a type of "string" in the FHIR search parameters definition

## Filter Processing Flow

1. **User Input**: User fills out the search form with desired filter values
2. **Query Construction**: The `SearchFormQuery` class converts form inputs into query parameters
   - Date fields are converted to ISO format
   - Empty fields are excluded
   - Special handling for `given` and `family` fields (adds `:exact` modifier)
3. **URL Generation**: The `FhirApi` class constructs the complete URL
   - Adds base path: `/4_0_0/{resourceType}`
   - Appends user-provided query parameters
   - Adds missing required parameters (`_count`, `_metaUuid`)
   - For AuditEvent without date filter, adds default 30-day range
4. **Bundle Creation**: The FHIR server processes the query and returns a Bundle
5. **Filter Display**: The `FilterSummary` component parses the URL and displays active filters

## Implementation Details

### Key Files

- **`src/components/FilterSummary.tsx`**: Component that displays active filters
- **`src/components/SearchContainer.tsx`**: Search form component
- **`src/utils/searchFormQuery.ts`**: Converts form data to query parameters
- **`src/utils/searchForm.utils.ts`**: Defines available search fields per resource type
- **`src/api/fhirApi.ts`**: Handles API calls and adds required parameters
- **`src/pages/IndexPage.tsx`**: Main page that integrates the FilterSummary component

### Filter Label Mapping

The FilterSummary component maps technical parameter names to user-friendly labels:
- `_lastUpdated` → "Last Updated"
- `given` → "Given Name"
- `family` → "Family Name"
- `_security` → "Security"
- etc.

### Date Comparison Formatting

Date comparison operators are formatted for better readability:
- `ge` (greater than or equal) → `≥`
- `gt` (greater than) → `>`
- `le` (less than or equal) → `≤`
- `lt` (less than) → `<`

## Examples

### Example 1: Patient Search with Multiple Filters

**URL**: `/4_0_0/Patient?given:exact=John&family:exact=Doe&_lastUpdated=gt2024-01-01&_count=10`

**Active Filters Displayed**:
- Given Name: John
- Family Name: Doe
- Last Updated: ≥ 2024-01-01

### Example 2: AuditEvent with Date Range

**URL**: `/4_0_0/AuditEvent?date=ge2024-01-01&date=le2024-01-31&_count=25`

**Active Filters Displayed**:
- Date: ≥ 2024-01-01
- Date: ≤ 2024-01-31

### Example 3: Organization by Name and Security

**URL**: `/4_0_0/Organization?name=General+Hospital&_security=https://www.icanbwell.com/owner|client1`

**Active Filters Displayed**:
- Name: General Hospital
- Security: https://www.icanbwell.com/owner|client1

## Notes

- Filters are case-sensitive unless otherwise specified
- Multiple values for the same parameter are supported (e.g., multiple date filters for ranges)
- The FilterSummary component only appears when there are active filters (excluding system parameters)
- Empty or null filter values are automatically excluded from the query
