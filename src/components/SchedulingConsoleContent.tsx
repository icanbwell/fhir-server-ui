import { useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Box, FormControl, InputLabel, MenuItem, Select, Tab, Tabs, Typography } from '@mui/material';
import FhirRequestConsole, { SendRequestParams } from './FhirRequestConsole';
import SchedulingApi from '../api/schedulingApi';
import UserContext from '../context/UserContext';
import { SCHEDULING_DESTINATIONS } from '../constants/schedulingDestinations';
import {
    SCHEDULING_STEPS,
    SchedulingStepKey,
    buildSchedulingRequestTemplate,
} from '../utils/schedulingRequestTemplates';
import { HttpMethod } from '../context/LastRequestContext';

interface SchedulingConsoleContentProps {
    personId: string;
}

type StepState = { method: HttpMethod; urlSuffix: string; resourceJson: string };

const buildInitialStepState = (destinationSlug: string, personId: string): Record<SchedulingStepKey, StepState> => {
    const destination = SCHEDULING_DESTINATIONS.find((d) => d.slug === destinationSlug) ?? SCHEDULING_DESTINATIONS[0];
    // SCHEDULING_DESTINATIONS is a file deployers are expected to edit and could be emptied —
    // fall back to an empty step state (rendered as no steps, same as the `destination: null`
    // case handled below) rather than dereferencing `destination` below and throwing.
    if (!destination) {
        return {} as Record<SchedulingStepKey, StepState>;
    }
    const entries = SCHEDULING_STEPS.map((step) => {
        const seeded = buildSchedulingRequestTemplate(step.key, destination, personId);
        return [step.key, { method: step.method, urlSuffix: step.urlPath, resourceJson: seeded }] as const;
    });
    return Object.fromEntries(entries) as Record<SchedulingStepKey, StepState>;
};

const SchedulingConsoleContent = ({ personId }: SchedulingConsoleContentProps) => {
    const { setUserDetails } = useContext(UserContext);
    const schedulingServiceUrl = import.meta.env.REACT_APP_SCHEDULING_SERVICE_URL;

    const [destinationSlug, setDestinationSlug] = useState<string>(SCHEDULING_DESTINATIONS[0]?.slug ?? '');
    const [activeStep, setActiveStep] = useState<SchedulingStepKey>(SCHEDULING_STEPS[0].key);
    const [stepState, setStepState] = useState<Record<SchedulingStepKey, StepState>>(() =>
        buildInitialStepState(destinationSlug, personId)
    );

    const destination = useMemo(
        () => SCHEDULING_DESTINATIONS.find((d) => d.slug === destinationSlug) ?? null,
        [destinationSlug]
    );

    // SCHEDULING_DESTINATIONS could be emptied out (see buildInitialStepState's guard above),
    // in which case stepState has no entries — skip rendering the step tabs/console rather
    // than indexing into an empty Record below.
    const hasStepState = Object.keys(stepState).length > 0;

    const handleDestinationChange = (slug: string) => {
        setDestinationSlug(slug);
        // Re-seeds every step's template for the new destination. Any step whose body was
        // hand-edited away from its last-seeded template loses that edit here — accepted as the
        // simpler v1 behavior (see design doc's Open Questions).
        setStepState(buildInitialStepState(slug, personId));
    };

    const updateStep = (key: SchedulingStepKey, patch: Partial<StepState>) => {
        setStepState((prev) => ({
            ...prev,
            // key is typed SchedulingStepKey, a closed string-literal union defined in
            // schedulingRequestTemplates.ts — not attacker-controlled — so this isn't a real
            // object-injection sink.
            // eslint-disable-next-line security/detect-object-injection
            [key]: { ...prev[key], ...patch },
        }));
    };

    const sendRequest = useCallback(
        (params: SendRequestParams) =>
            new SchedulingApi({ fhirUrl: schedulingServiceUrl, setUserDetails }).sendRequest(params),
        [schedulingServiceUrl, setUserDetails]
    );

    if (!schedulingServiceUrl) {
        return (
            <Typography color="error">
                Scheduling Service is not configured (missing REACT_APP_SCHEDULING_SERVICE_URL).
            </Typography>
        );
    }

    return (
        <>
            <Alert severity="info" sx={{ mb: 2 }}>
                Testing scheduling for Person {personId}
            </Alert>

            <FormControl size="small" sx={{ minWidth: 280, mb: 2 }}>
                <InputLabel>Destination</InputLabel>
                <Select
                    value={destinationSlug}
                    label="Destination"
                    onChange={(e) => handleDestinationChange(e.target.value)}
                >
                    {SCHEDULING_DESTINATIONS.map((d) => (
                        <MenuItem key={d.slug} value={d.slug}>
                            {d.label}
                            {!d.organizationReference ? ' (not configured for this environment)' : ''}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {!destination?.organizationReference && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    This destination has no Organization reference configured for this environment
                    yet — requests will fail server-side resolution. See
                    src/constants/schedulingDestinations.ts.
                </Alert>
            )}

            {hasStepState && (
                <>
                    <Tabs value={activeStep} onChange={(_, val) => setActiveStep(val)} sx={{ mb: 2 }}>
                        {SCHEDULING_STEPS.map((step) => (
                            <Tab key={step.key} value={step.key} label={step.label} />
                        ))}
                    </Tabs>

                    {SCHEDULING_STEPS.map(
                        (step) =>
                            step.key === activeStep && (
                                <Box key={step.key}>
                                    <FhirRequestConsole
                                        method={stepState[step.key].method}
                                        onMethodChange={(method) => updateStep(step.key, { method })}
                                        urlSuffix={stepState[step.key].urlSuffix}
                                        onUrlSuffixChange={(urlSuffix) => updateStep(step.key, { urlSuffix })}
                                        resourceJson={stepState[step.key].resourceJson}
                                        onResourceJsonChange={(resourceJson) => updateStep(step.key, { resourceJson })}
                                        requestPathPlaceholder={step.urlPath}
                                        baseUrlForDisplay={schedulingServiceUrl}
                                        sendRequest={sendRequest}
                                        splitPaneHeight="calc(100vh - 380px)"
                                    />
                                </Box>
                            )
                    )}
                </>
            )}
        </>
    );
};

export default SchedulingConsoleContent;
