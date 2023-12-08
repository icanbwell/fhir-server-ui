reverse_references = {
    "HealthcareService": [
        {"reverseReferences": [{"target":'PractitionerRole', "property":'actor'}], "name": "Practitioner Role"},
        {"reverseReferences": [{"target":'Schedule', "property":'healthcareService'}], "name": "Schedule"}
    ],
    "Location": [
        {"reverseReferences": [{"target":'PractitionerRole', "property":'location'}], "name": "PractitionerRole"},
        {"reverseReferences": [{"target":'HealthcareService', "property":'location'}], "name": "HealthcareService"},
        {"reverseReferences": [{"target":'Organization', "property":'location'}], "name": "Organization"},
        {"reverseReferences": [{"target":'Schedule', "property":'location'}], "name": "Schedule"}
    ],
    "Organization": [
        {"reverseReferences": [{"target":'PractitionerRole', "property":'organization'}], "name": "Practitioner Role"},
        {"reverseReferences": [{"target":'HealthcareService', "property":'organization'}], "name": "Healthcare Service"},
        {"reverseReferences": [{"target":'Location', "property":'organization'}], "name": "Location"}
    ],
    "Patient": [
        {"reverseReferences": [{"target":'Account', "property":'patient'}], "name": "Account" },
        {"reverseReferences": [{"target":'AllergyIntolerance', "property":'patient'}], "name": "AllergyIntolerance" },
        {"reverseReferences": [{"target":'Appointment', "property":'patient'}], "name": "Appointment" },
        {"reverseReferences": [{"target":'AuditEvent', "property":'patient'}], "name": "AuditEvent" },
        {"reverseReferences": [{"target":'CareTeam', "property":'patient'}], "name": "CareTeam" },
        {"reverseReferences": [{"target":'Condition', "property":'patient'}], "name": "Condition" },
        {"reverseReferences": [{"target":'ChargeItem', "property":'patient'}], "name": "ChargeItem" },
        {"reverseReferences": [{"target":'Coverage', "property":'patient'}], "name": "Coverage" },
        {"reverseReferences": [{"target":'Encounter', "property":'patient'}], "name": "Encounter" },
        {"reverseReferences": [{"target":'Immunization', "property":'patient'}], "name": "Immunization" },
        {"reverseReferences": [{"target":'ExplanationOfBenefit', "property":'patient'}], "name": "ExplanationOfBenefit" },
        {"reverseReferences": [{"target":'MeasureReport', "property":'patient'}], "name": "MeasureReport" },
        {"reverseReferences": [{"target":'MedicationRequest', "property":'patient'}], "name": "MedicationRequest" },
        {"reverseReferences": [{"target":'MedicationStatement', "property":'patient'}], "name": "MedicationStatement" },
        {"reverseReferences": [{"target":'Observation', "property":'patient'}], "name": "Observation" },
        {"reverseReferences": [{"target":'Person', "property":'patient'}], "name": "Person" },
        {"reverseReferences": [{"target":'Procedure', "property":'patient'}], "name": "Procedure" },
        {"reverseReferences": [{"target":'Schedule', "property":'patient'}], "name": "Schedule" },
        {"reverseReferences": [{"target":'ServiceRequest', "property":'patient'}], "name": "ServiceRequest" },
        {"reverseReferences": [{"target":'Task', "property":'patient'}], "name": "Task" }
    ],
    "Person": [
        {"reverseReferences": [{"target":'AuditEvent', "property":'agent'}], "name": "Audit Event" },
        {"reverseReferences": [{"target":'Account', "property":'patient'}], "name": "Account" },
        {"reverseReferences": [{"target":'AllergyIntolerance', "property":'patient'}], "name": "AllergyIntolerance" },
        {"reverseReferences": [{"target":'Appointment', "property":'patient'}], "name": "Appointment" },
        {"reverseReferences": [{"target":'AuditEvent', "property":'patient'}], "name": "AuditEvent" },
        {"reverseReferences": [{"target":'CareTeam', "property":'patient'}], "name": "CareTeam" },
        {"reverseReferences": [{"target":'Condition', "property":'patient'}], "name": "Condition" },
        {"reverseReferences": [{"target":'ChargeItem', "property":'patient'}], "name": "ChargeItem" },
        {"reverseReferences": [{"target":'Coverage', "property":'patient'}], "name": "Coverage" },
        {"reverseReferences": [{"target":'Encounter', "property":'patient'}], "name": "Encounter" },
        {"reverseReferences": [{"target":'Immunization', "property":'patient'}], "name": "Immunization" },
        {"reverseReferences": [{"target":'ExplanationOfBenefit', "property":'patient'}], "name": "ExplanationOfBenefit" },
        {"reverseReferences": [{"target":'MeasureReport', "property":'patient'}], "name": "MeasureReport" },
        {"reverseReferences": [{"target":'MedicationDispense', "property":'patient'}], "name": "MedicationDispense" },
        {"reverseReferences": [{"target":'MedicationRequest', "property":'patient'}], "name": "MedicationRequest" },
        {"reverseReferences": [{"target":'MedicationStatement', "property":'patient'}], "name": "MedicationStatement" },
        {"reverseReferences": [{"target":'Observation', "property":'patient'}], "name": "Observation" },
        {"reverseReferences": [{"target":'Person', "property":'link'}], "name": "Person" },
        {"reverseReferences": [{"target":'Procedure', "property":'patient'}], "name": "Procedure" },
        {"reverseReferences": [{"target":'Schedule', "property":'patient'}], "name": "Schedule" },
        {"reverseReferences": [{"target":'ServiceRequest', "property":'patient'}], "name": "ServiceRequest" },
        {"reverseReferences": [{"target":'Task', "property":'patient'}], "name": "Task" }
    ],
    "Practitioner": [
        {"reverseReferences": [{"target":'PractitionerRole', "property":'practitioner'}], "name": "Practitioner Role"},
        {"reverseReferences": [{"target":'Schedule', "property":'actor'}], "name": "Schedule (also check schedules on PractitionerRole)"}
    ],
    "PractitionerRole": [
        {"reverseReferences": [{"target":'Schedule', "property":'actor'}], "name": "Schedule"}
    ],
    "Schedule": [
        {"reverseReferences": [{"target":'Slot', "property":'schedule'}], "name": "Slot"},
        {"reverseReferences": [{"target":'HealthcareService', "property":'actor'}], "name": "HealthcareService"},
        {"reverseReferences": [{"target":'Location', "property":'actor'}], "name": "Location"},
        {"reverseReferences": [{"target":'Patient', "property":'actor'}], "name": "Patient"},
        {"reverseReferences": [{"target":'PractitionerRole', "property":'actor'}], "name": "PractitionerRole"}
    ],
}
