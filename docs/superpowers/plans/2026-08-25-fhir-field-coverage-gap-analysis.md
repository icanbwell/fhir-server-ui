# FHIR Field Coverage Gap Analysis

**Status:** Draft for review — no code changes yet. This is an analysis document only.
**Scope:** All 143 auto-generated resource pages (`src/pages/resources/*.tsx`).

## Why this exists

This app auto-generates a page per FHIR resource type from the R4 XML schema
(`src/generator/generate_components.py` + `template.javascript.component.jinja2`). The
template only renders a field if its FHIR type has a registered display component:

- **Simple/common types** → `available_partial_resources` (`src/generator/partialsResources.py`)
- **Resource-specific backbone elements** → `partials_mapping` (`src/generator/partials_mapping_for_fields.py`)
- **A handful of one-off fields** → hardcoded `{% elif %}` branches in the jinja template (this is
  exactly the mechanism PR #269 used to add `Subscription.reason/criteria/error` and
  `SubscriptionTopic.version/title/publisher/approvalDate/lastReviewDate`)

**Anything not covered by one of those three is silently dropped — not rendered at all, not even
as raw JSON.** That silent-drop behavior is the gap this document maps out.

## Methodology

1. Wrote a one-off script (`src/generator/analyze_field_coverage.py`, not part of the generator
   pipeline — safe to delete) that replicates the template's own coverage logic against the live
   FHIR schema parser output. For every resource, it classifies each property as: rendered via a
   generic partial, rendered via a mapped/hardcoded partial, or **dropped**.
2. This produced an exact, deterministic list — **681 dropped fields across 143 resources**
   (after excluding `id` and `contained`, which are dropped almost everywhere and already
   surfaced elsewhere in the UI — `id` via the page's own URL/breadcrumb).
3. Ten parallel research passes (one per ~15 resources) then applied FHIR domain judgment to that
   list: which of the dropped fields would an engineer, product manager, or clinical reviewer
   actually want to see, versus which are genuinely obscure/administrative noise not worth adding.
   Each recommendation below is tagged with a primary audience and priority.

This means the per-resource lists below are **not** a manual spec-vs-UI reading — they're
grounded in the exact fields this codebase's own generator currently produces nothing for.

## Top finding: one systemic bug, 37 fields, 24 resources

**`available_partial_resources` registers `DateTime` but not the bare FHIR `date` type.**
Since `get_component_name('date')` → `"Date"`, and `"Date"` isn't in that list, **every
field whose FHIR type is exactly `date` (not `dateTime`) is silently dropped, everywhere in the
app**, unless a resource happens to have a hardcoded special-case (as `SubscriptionTopic.approvalDate`/
`lastReviewDate` now do, since this PR added those two by hand).

This single fix — registering a `Date` partial (near-identical to the existing `DateTime` one,
just without the time-of-day) — would immediately surface 37 currently-invisible fields across 24
resources, including:

- **`Patient.birthDate` and `Person.birthDate`** — date of birth, missing from the two most-viewed
  resources in this entire app. *High priority, Clinical.*
- `Practitioner.birthDate`, `RelatedPerson.birthDate`
- `Goal.statusDate` / `startDate`, `Immunization.expirationDate`
- `PaymentNotice.paymentDate`, `PaymentReconciliation.paymentDate`, `VerificationResult.nextScheduled`
- `CoverageEligibilityRequest.servicedDate`
- `PlanDefinition.approvalDate`, `Questionnaire.approvalDate`/`lastReviewDate`, `ResearchDefinition`/`ResearchElementDefinition` versioning dates
- `ActivityDefinition`, `Basic`, `ChargeItemDefinition`, `Citation`, `EventDefinition`, `Evidence`,
  `FamilyMemberHistory`, `Library`, `Measure` each have at least one dropped `date` field too

**Recommendation:** fix this first, before any of the per-resource work below — it's the highest
leverage-per-effort item in this entire analysis.

## Per-resource findings

Organized alphabetically. Resources with no significant gaps are omitted entirely (see the
Appendix for the full list of what was reviewed). Each entry: **`field`** (type) — rationale.
*Audience* · *Priority*.

### Account
- **`name`** (String) — the human-readable label for the account is essential for identifying what an account represents at a glance, rather than showing only its opaque ID. *PM|Engineer* · *Medium*
- **`description`** (String) — free-text context on what the account tracks helps engineers/PMs debugging billing or ledger data quickly understand its purpose. *PM|Engineer* · *Low*

### ActivityDefinition
- **`participant`** (backbone, repeating) — defines who is expected to perform the activity (role/type), core to understanding what the definition actually orders. *Clinical|Engineer* · *High*
- **`dynamicValue`** (backbone, repeating) — encodes the computed-logic rules (e.g., dose based on weight) that drive how the activity gets instantiated; without it the definition looks static when it's actually dynamic. *Engineer* · *Medium*
- **`title`** (String) — the user-friendly title is the main way anyone would identify this definition among many. *PM|Engineer* · *Medium*
- **`version`** (String) — needed to tell which revision of a definition is in play when debugging discrepancies between environments. *Engineer* · *Low*

### AdministrableProductDefinition
- **`routeOfAdministration`** (backbone, repeating) — captures how the product is actually given to the patient (route, dose form, max dose), central clinical information for a medicinal product record. *Clinical* · *High*
- **`property`** (backbone, repeating) — characteristics like onset/duration of action add clinically meaningful detail beyond the bare identifiers currently shown. *Clinical* · *Medium*

### AllergyIntolerance
- **`reaction`** (backbone, repeating) — the actual manifestation, severity, and exposure route of the reaction; without this the resource shows only that an allergy exists, not what happens or how bad it is — the most clinically critical part of the record. *Clinical* · *High*

### Appointment
- **`participant`** (backbone, repeating) — lists who/what (practitioner, patient, location, device) is involved; this is the core content of the resource, and its absence makes the appointment page essentially empty of "who." *Clinical|PM* · *High*
- **`description`** (String) — the subject-line summary of the appointment is the quickest way to understand its purpose. *PM|Clinical* · *Medium*
- **`patientInstruction`** (String) — patient-facing prep instructions (e.g., "bring your referral") useful for reviewers checking whether patients were properly informed. *Clinical* · *Medium*
- **`minutesDuration`** (Int) — expected visit length, useful for scheduling/utilization analysis. *PM* · *Low*

### AppointmentResponse
- **`comment`** (String) — free-text reasoning behind a participant's accept/decline/tentative response. *Clinical|PM* · *Medium*

### AuditEvent
- **`agent`** (backbone, repeating) — identifies who/what actor performed the audited action; the core "who" of an audit trail. *Engineer* · *High*
- **`entity`** (backbone, repeating) — identifies which specific data/resources were accessed or modified; the core "what," essential for security/access investigations. *Engineer* · *High*
- **`outcomeDesc`** (String) — free-text explanation of the outcome, valuable when debugging why an audited action failed or succeeded unexpectedly. *Engineer* · *Medium*

### BiologicallyDerivedProduct
- **`collection`** (backbone) — how/when/from whom the product was collected — key traceability for blood/tissue product safety and chain-of-custody review. *Clinical|Engineer* · *High*
- **`storage`** (backbone, repeating) — storage conditions (temperature, duration) directly affect product viability/safety, commonly the first thing checked in an incident review. *Clinical|Engineer* · *High*
- **`processing`** (backbone, repeating) — processing steps (e.g., anti-coagulant addition) that affect product characteristics and traceability. *Clinical* · *Medium*

### BodyStructure
- **`description`** (String) — plain-language summary of the body structure, useful when the coded `location`/`morphology` fields alone are ambiguous. *Clinical* · *Medium*

### Bundle
- **`entry`** (backbone, repeating) — the actual resources (or search/history metadata) contained in the bundle; the entire payload of the resource. *Engineer* · *High*
- **`link`** (backbone, repeating) — pagination/navigation links (self, next, previous), essential for debugging search-result paging. *Engineer* · *Medium*
- **`total`** (unsignedInt) — the total match count for search bundles, useful for verifying paging/result-count correctness. *Engineer* · *Low*

### CapabilityStatement
- **`rest`** (backbone, repeating) — defines exactly which resource types, interactions, and search parameters the server supports; the primary reason anyone looks at a CapabilityStatement. *Engineer* · *High*
- **`software`** (backbone) — server software name/version, critical for diagnosing version-specific behavior. *Engineer* · *High*
- **`implementation`** (backbone) — points to the specific deployed instance (URL, description). *Engineer* · *Medium*
- **`title`** (String) — friendly title for identifying a specific statement among several. *Engineer* · *Low*

### CarePlan
- **`activity`** (backbone, repeating) — the planned actions themselves (medications, labs, education, self-monitoring); the substantive content of a care plan. *Clinical|PM* · *High*
- **`title`** (String) — human-friendly name to distinguish one care plan from another at a glance. *Clinical|PM* · *Medium*
- **`description`** (String) — free-text scope/nature of the plan for quick context. *Clinical* · *Medium*

### CareTeam
- **`participant`** (backbone, repeating) — the actual roster of people/organizations and their roles on the care team. *Clinical* · *High*
- **`name`** (String) — a human label (e.g. "red team" vs "green trauma team") distinguishing concurrent teams for the same patient. *Clinical* · *Low*

### ChargeItem
- **`overrideReason`** (String) — free-text explanation for why the standard price/factor was overridden, exactly what a PM/biller needs auditing an unusual charge. *PM* · *Medium*

### ChargeItemDefinition
- **`propertyGroup`** (backbone, repeating) — the actual price components/factors making up the billing rule. *PM* · *High*
- **`applicability`** (backbone, repeating) — conditions/expressions determining when a price rule applies. *Engineer|PM* · *Medium*
- **`title`** (String) — user-friendly name for the definition. *PM* · *Low*

### Citation
- **`citedArtifact`** (backbone) — the actual article/artifact being described (authors, publication details, abstracts); the substantive payload. *Engineer|PM* · *High*
- **`summary`** (backbone, repeating) — human-readable rollup for quick-glance display. *PM* · *Medium*
- **`classification`** (backbone, repeating) — how the citation is categorized, useful for filtering/grouping. *Engineer* · *Low*

### Claim
- **`item`** (backbone, repeating) — the actual line items being billed; core substance of a claim, currently invisible entirely. *PM* · *High*
- **`diagnosis`** (backbone, repeating) — diagnoses justifying billed services, essential for reviewing medical necessity/coding accuracy. *PM|Clinical* · *High*
- **`procedure`** (backbone, repeating) — procedures performed, needed alongside diagnosis. *PM|Clinical* · *Medium*
- **`payee`** (backbone) — who is to be reimbursed, important for tracing payment routing. *PM* · *Medium*

### ClaimResponse
- **`item`** (backbone, repeating) — the line-level adjudication decisions (approved/denied, amounts). *PM* · *High*
- **`adjudication`** (backbone, repeating) — header-level adjudication results (approved amount, copay, deductible). *PM* · *High*
- **`total`** (backbone, repeating) — categorized monetary totals, the headline dollar figures. *PM* · *High*
- **`payment`** (backbone) — actual payment details, critical for reconciliation. *PM* · *High*
- **`error`** (backbone, repeating) — specific errors encountered while processing the claim, high diagnostic value. *Engineer* · *Medium*

### ClinicalImpression
- **`finding`** (backbone, repeating) — the specific findings/diagnoses considered likely or relevant; the clinical conclusion. *Clinical* · *High*
- **`summary`** (String) — plain-text summary of investigations and diagnosis. *Clinical* · *High*
- **`investigation`** (backbone, repeating) — signs/symptoms/tests reviewed as part of the assessment. *Clinical* · *Medium*
- **`description`** (String) — narrative context for why/where the assessment was performed. *Clinical* · *Medium*

### ClinicalUseDefinition
- **`contraindication`** (backbone) — when this product/procedure must not be used; a core patient-safety fact. *Clinical* · *High*
- **`interaction`** (backbone) — drug-drug or drug-substance interactions, critical safety information. *Clinical* · *High*
- **`warning`** (backbone) — critical cautionary text. *Clinical* · *High*
- **`undesirableEffect`** (backbone) — possible adverse effects/side effects of use. *Clinical* · *Medium*
- **`indication`** (backbone) — conditions/circumstances under which use is indicated. *Clinical* · *Medium*

### CodeSystem
- **`concept`** (backbone, repeating) — the actual codes/concepts defined by the system. *Engineer* · *High*
- **`property`** (backbone, repeating) — additional structured attributes attached to concepts. *Engineer* · *Medium*
- **`filter`** (backbone, repeating) — filters usable when composing ValueSets from this system. *Engineer* · *Medium*
- **`count`** (unsignedInt) — total number of concepts defined, a quick completeness sanity-check. *Engineer|PM* · *Low*

### Communication
- **`payload`** (backbone, repeating) — the actual text, attachment, or resource that was communicated; the entire substance of the message. *Clinical* · *High*

### CommunicationRequest
- **`payload`** (backbone, repeating) — the actual text/attachment/resource to be communicated once fulfilled. *Clinical* · *High*

### CompartmentDefinition
- **`resource`** (backbone, repeating) — defines exactly how each resource type relates to the compartment; essential for debugging compartment-based access/search. *Engineer* · *High*

### Composition
- **`section`** (backbone, repeating) — the actual document sections/content. *Clinical|Engineer* · *High*
- **`title`** (String) — the human-readable document title (e.g. "Discharge Summary"). *Clinical* · *High*
- **`attester`** (backbone, repeating) — who attested to the accuracy of the document. *Clinical* · *Medium*
- **`event`** (backbone, repeating) — the clinical service being documented. *Clinical* · *Medium*

### ConceptMap
- **`group`** (backbone, repeating) — the actual source-to-target concept mappings; the entire purpose of a ConceptMap. *Engineer* · *High*

### Condition
- **`stage`** (backbone, repeating) — clinical staging/grading (e.g. cancer stage), core diagnostic detail completely invisible today. *Clinical* · *High*
- **`onsetString` / `onsetRange`** (String / Range) — non-numeric onset representations; currently blank if a clinician entered onset as text or a range. *Clinical* · *Medium*
- **`abatementString` / `abatementRange`** (String / Range) — same gap for when/how a condition resolved. *Clinical* · *Medium*

### Consent
- **`provision`** (backbone) — the actual permit/deny rules, actors, purposes, and scoped data; without it the page shows category/date but not what was agreed to. *Clinical|PM* · *High*
- **`policy`** (backbone, repeating) — links to the specific legal/regulatory policy, needed for compliance review. *PM* · *Medium*
- **`verification`** (backbone, repeating) — whether consent was verified directly with the patient/family. *Clinical* · *Medium*

### Contract
- **`name` / `title`** (String) — without either, a reviewer has no way to tell what a given Contract represents. *PM* · *High*
- **`term`** (backbone, repeating) — the substantive provisions being agreed to. *PM* · *High*
- **`legal`** (backbone, repeating) — legal expressions/representations of the contract. *PM* · *Medium*

### CoverageEligibilityRequest
- **`item`** (backbone, repeating) — the specific service categories being checked for eligibility/prior-auth. *PM* · *High*
- **`servicedDate`** (date) — date-of-service (same systemic `date`-type gap as the Top Finding above). *PM* · *Low*

### CoverageEligibilityResponse
- **`disposition`** (String) — human-readable explanation of the adjudication outcome. *PM* · *High*
- **`error`** (backbone, repeating) — errors encountered while processing the request, critical for engineers. *Engineer* · *High*
- **`preAuthRef`** (String) — the insurer's prior-authorization reference number. *PM* · *Medium*

### DetectedIssue
- **`detail`** (String) — the actual textual explanation of the issue; without it, a code and a patient but not the substance of the alert. *Clinical* · *High*
- **`mitigation`** (backbone, repeating) — what action was taken to address the issue. *Clinical* · *High*
- **`evidence`** (backbone, repeating) — supporting evidence/manifestations underlying the issue. *Clinical* · *Medium*

### Device
- **`udiCarrier`** (backbone, repeating) — Unique Device Identifier barcode/data, essential for device tracking, recalls, and regulatory traceability. *Engineer|PM* · *High*
- **`deviceName`** (backbone, repeating) — the human-readable name(s); without it only a type code shows. *Engineer* · *High*
- **`manufacturer` / `serialNumber` / `lotNumber` / `modelNumber`** (String) — needed to trace a specific physical device instance for recalls/data-quality investigations. *Engineer* · *Medium*

### DeviceDefinition
- **`udiDeviceIdentifier`** (backbone, repeating) — catalog-level UDI-DI, critical for regulatory/recall matching. *Engineer|PM* · *High*
- **`deviceName` / `modelNumber`** — human-readable product name/model. *PM|Engineer* · *Medium*

### DeviceMetric
- **`calibration`** (backbone, repeating) — whether/when the sensor was calibrated, a key data-quality signal. *Engineer* · *Medium*

### DeviceRequest
- **`parameter`** (backbone, repeating) — specific ordering parameters (e.g. lens prism value). *Engineer|PM* · *Medium*

### DiagnosticReport
- **`conclusion`** (String) — the clinician's narrative interpretation/impression; often the single most clinically important sentence on the resource, entirely invisible today. *Clinical* · *High*

### DocumentManifest
- **`description`** (String) — the human-readable title/description of the document set. *Clinical|Engineer* · *High*

### Encounter
No significant gaps identified.

### Endpoint
- **`address`** (url) — the actual connection URI; without it the resource is nearly useless for troubleshooting connectivity. *Engineer* · *High*
- **`name`** (String) — friendly label to identify which endpoint is being viewed. *Engineer* · *Medium*
- **`header`** (String, repeating) — headers sent with notifications, often the source of auth/config bugs in subscription delivery. *Engineer* · *Low*

### EnrollmentResponse
- **`disposition`** (String) — human-readable adjudication summary. *PM* · *Medium*

### EpisodeOfCare
- **`statusHistory`** (backbone, repeating) — the full timeline of status transitions. *Clinical|Engineer* · *Medium*

### EventDefinition
- **`trigger`** (TriggerDefinition, repeating) — the actual condition(s) that fire the event; the operative logic of the resource. *Engineer* · *High*
- **`name`/`title`** (String) — human-readable identifying label. *Engineer* · *Medium*
- **`relatedArtifact`** (repeating) — links to supporting documentation for the trigger logic. *Engineer* · *Low*

### Evidence
- **`variableDefinition`** (backbone, repeating) — the population/exposure/outcome variables the evidence is about. *Engineer* · *High*
- **`statistic`** (backbone, repeating) — the actual statistical results being reported; the core payload. *Engineer* · *High*
- **`certainty`** (backbone, repeating) — GRADE-style certainty rating, critical context for interpretation. *Engineer* · *Medium*
- **`title`** (String) — human-readable label. *Engineer* · *Low*

### EvidenceReport
- **`section`** (backbone, repeating) — the actual body/content of the report. *Engineer* · *High*
- **`subject`** (backbone) — what the report is actually about. *Engineer* · *Medium*
- **`relatesTo`** (backbone, repeating) — relationships to prior/superseded report versions. *Engineer* · *Low*

### EvidenceVariable
- **`characteristic`** (backbone, repeating) — the actual inclusion/exclusion criteria. *Engineer* · *High*
- **`name`/`title`** (String) — human-readable label. *Engineer* · *Medium*
- **`category`** (backbone, repeating) — groupings/strata used to define subgroups. *Engineer* · *Low*

### ExampleScenario
- **`process`** (backbone, repeating) — the step-by-step workflow being illustrated; the entire point of the resource. *Engineer* · *High*
- **`actor`** (backbone, repeating) — systems/people participating in the scenario. *Engineer* · *Medium*
- **`instance`** (backbone, repeating) — concrete example resources/versions referenced. *Engineer* · *Medium*

### ExplanationOfBenefit
- **`item`** (backbone, repeating) — the individual claim line items; core substance of an EOB. *PM* · *High*
- **`total`** (backbone, repeating) — categorized monetary totals. *PM* · *High*
- **`adjudication`** (backbone, repeating) — header-level adjudication results. *PM* · *High*
- **`payment`** (backbone) — actual payment amount/date/method. *PM* · *High*
- **`diagnosis`** (backbone, repeating) — diagnoses tied to the claim, clinical context for medical necessity. *Clinical|PM* · *Medium*
- **`payee`** (backbone) — who actually received payment. *PM* · *Medium*
- **`benefitBalance`** (backbone, repeating) — remaining/used benefit amounts by category. *PM* · *Medium*
- **`processNote`** (backbone, repeating) — human-readable explanations of adjudication decisions. *PM* · *Medium*

### FamilyMemberHistory
- **`name`** (String) — free-text identifier for which family member is being described; `relationship` alone can be ambiguous. *Clinical* · *High*
- **`condition`** (backbone, repeating) — the actual family conditions/diagnoses; the entire clinical point of this resource. *Clinical* · *High*
- **`deceasedBoolean`/`deceasedDate`/`deceasedAge`** — whether/when/at-what-age the relative died, important genetic/family-risk context. *Clinical* · *Medium*
- **`bornDate`/`ageRange`/`ageAge`** — helps assess relevance of family conditions (e.g. early-onset disease). *Clinical* · *Low*

### Goal
- **`target`** (backbone, repeating) — the measurable target and due date (e.g. "HbA1c < 7% by 2026-12-01"); the operative clinical content. *Clinical* · *High*
- **`statusDate`** (date) — when the goal's current status took effect. *Clinical* · *Medium*
- **`statusReason`** (String) — why a goal was cancelled/put on hold/achieved. *Clinical* · *Medium*
- **`startDate`** (date) — when the goal was initiated. *Clinical* · *Low*

### GraphDefinition
- **`link`** (backbone, repeating) — the actual traversal rules the definition defines. *Engineer* · *High*
- **`name`** (String) — machine-usable identifier. *Engineer* · *Medium*
- **`version`** (String) — confirms which revision of graph rules is deployed. *Engineer* · *Low*

### Group
- **`characteristic`** (backbone, repeating) — the actual trait(s) determining membership; the whole point of the resource. *Engineer* · *High*
- **`name`** (String) — human-readable label for the group. *PM|Engineer* · *Medium*
- **`quantity`** (unsignedInt) — expected member count, useful for a completeness check. *Engineer* · *Medium*

### GuidanceResponse
- **`dataRequirement`** (repeating) — what data was missing/needed for a more accurate CDS/CQL evaluation. *Engineer* · *Medium*

### HealthcareService
- **`name`** (String) — the consumer-facing name of the service. *PM* · *High*
- **`eligibility`** (backbone, repeating) — who qualifies for the service. *PM* · *Medium*
- **`availableTime`** (backbone, repeating) — operating hours. *PM* · *Medium*

### ImagingStudy
- **`series`** (backbone, repeating) — series/instance breakdown (modality, body site, image counts); the core clinical content. *Clinical* · *High*
- **`numberOfSeries` / `numberOfInstances`** (unsignedInt) — quick sanity-check counts (e.g. detecting partial DICOM ingestion). *Clinical|Engineer* · *Medium*
- **`description`** (String) — the institution's own description of the study. *Clinical* · *Medium*

### Immunization
- **`reaction`** (backbone, repeating) — adverse events tied to the vaccination; safety-critical, currently completely invisible. *Clinical* · *High*
- **`protocolApplied`** (backbone, repeating) — dose number/series completeness (e.g. "dose 2 of 2"). *Clinical* · *High*
- **`lotNumber` / `expirationDate`** (String / date) — needed for vaccine safety tracing and recall investigations. *Clinical* · *Medium*

### ImmunizationEvaluation
- **`doseNumberPositiveInt`/`doseNumberString`, `seriesDosesPositiveInt`/`seriesDosesString`** — "this was dose N of M in the series"; the actual substance of the evaluation. *Clinical* · *High*
- **`series`** (String) — the vaccination series/protocol being evaluated against. *Clinical* · *Medium*

### ImmunizationRecommendation
- **`recommendation`** (backbone, repeating) — the entire clinical payload (vaccine, target disease, due date, forecast status). *Clinical* · *High*

### ImplementationGuide
- **`definition`** (backbone) — the actual pages, resources, and grouping that make up the guide. *Engineer* · *High*
- **`dependsOn`** (backbone, repeating) — other IGs this one depends on. *Engineer* · *High*
- **`manifest`** (backbone) — what was actually produced by publication tooling. *Engineer* · *Medium*
- **`name`/`title`** (String) — basic human identification. *Engineer* · *Medium*

### Ingredient
- **`substance`** (backbone) — the actual substance the ingredient represents (with strength/concentration). *Clinical|Engineer* · *High*
- **`manufacturer`** (backbone, repeating) — which manufacturer(s) supply the ingredient. *Engineer* · *Medium*

### InsurancePlan
- **`plan`** (backbone, repeating) — the actual benefit plan details (cost-sharing, plan type, network). *PM* · *High*
- **`coverage`** (backbone, repeating) — what's covered under the product. *PM* · *High*
- **`name`** (String) — the official product name. *PM* · *High*

### Invoice
- **`cancelledReason`** (String) — why a cancelled invoice was voided. *PM|Engineer* · *Medium*

### Library
- **`parameter`** (repeating) — the library's expected inputs/outputs. *Engineer* · *High*
- **`dataRequirement`** (repeating) — what FHIR data the library needs to execute correctly. *Engineer* · *High*
- **`name`** (String) — machine-identifiable name matched against `libraryId` elsewhere in CQL tooling. *Engineer* · *Medium*
- **`relatedArtifact`** (repeating) — dependent libraries/value sets/documentation. *Engineer* · *Medium*

### List
- **`title`** (String) — the author-assigned label, distinguishing multiple lists on the same subject. *Engineer|PM* · *Medium*

### Location
- **`name`** (String) — the human-readable name of the facility/room/unit; nearly unidentifiable without it. *Clinical|Engineer* · *High*
- **`position`** (backbone) — lat/long/altitude for map-based display or distance calcs. *PM|Engineer* · *Medium*
- **`hoursOfOperation`** (backbone, repeating) — when the location is actually open. *Clinical|PM* · *Medium*
- **`description`** (String) — disambiguates similarly-named locations. *Clinical|PM* · *Low*

### Measure
- **`group`** (backbone, repeating) — the actual population criteria (initial population, denominator, numerator, exclusions). *PM|Clinical* · *High*
- **`title`** (String) — human-friendly title, currently only raw canonical url/identifier shown. *PM* · *High*
- **`version`** (String) — distinguishes revisions of the same measure logic. *Engineer|PM* · *Medium*
- **`supplementalData`** (backbone, repeating) — extra data elements (e.g. race/ethnicity stratifiers). *PM* · *Medium*

### MeasureReport
- **`group`** (backbone, repeating) — the actual calculated results (population counts, numerator/denominator, measure score); the entire payload. *PM|Clinical* · *High*

### Media
- **`deviceName`** (String) — device/manufacturer that captured the image. *Clinical|Engineer* · *Medium*
- **`height` / `width`** (Int) — image pixel dimensions, helpful debugging malformed uploads. *Engineer* · *Low*

### Medication
- **`ingredient`** (backbone, repeating) — active/inactive constituents and their strength. *Clinical* · *High*
- **`batch`** (backbone) — lot number and expiration date, essential for recall tracking. *Clinical|Engineer* · *Medium*

### MedicationAdministration
- **`dosage`** (backbone) — the actual dose, rate, route, and site administered; the core clinical fact. *Clinical* · *High*

### MedicationDispense
- **`substitution`** (backbone) — whether a generic/therapeutic substitution was made and why. *Clinical* · *Medium*

### MedicationKnowledge
- **`ingredient`** (backbone, repeating) — the reference-data ingredient/strength list. *Clinical* · *High*
- **`administrationGuidelines`** (backbone, repeating) — dosing guidance to sanity-check prescribed dosages. *Clinical* · *Medium*
- **`drugCharacteristic`** (backbone, repeating) — color, shape, imprint — useful for pill identification. *Clinical* · *Medium*

### MedicationRequest
- **`dispenseRequest`** (backbone) — quantity, days' supply, refill count, dispensing pharmacy. *Clinical|PM* · *High*
- **`substitution`** (backbone) — the prescriber's instruction on whether generic substitution is allowed. *Clinical* · *Medium*

### MedicinalProductDefinition
- **`name`** (backbone, repeating) — the product's actual name; without it there's no human-readable identification. *Engineer|Clinical* · *High*
- **`characteristic`** (backbone, repeating) — features like "sugar free" or "modified release." *Clinical* · *Medium*

### MessageDefinition
- **`title`/`name`** (String) — human-readable identifiers, currently only raw canonical url shown. *Engineer* · *Medium*
- **`focus`** (backbone, repeating) — which resource type(s) the message event carries. *Engineer* · *Medium*

### MessageHeader
- **`source`** (backbone) — the originating system (endpoint, software, version); critical for tracing which integration produced a message. *Engineer* · *High*
- **`destination`** (backbone, repeating) — where the message was routed to. *Engineer* · *High*
- **`response`** (backbone) — ack/error/ok status and details. *Engineer* · *High*

### MolecularSequence
- **`variant`** (backbone, repeating) — the actual genomic variants identified; the clinically meaningful payload. *Clinical* · *High*
- **`referenceSeq`** (backbone) — reference genome/chromosome/window coordinates needed to interpret variant positions. *Clinical|Engineer* · *High*
- **`quality`** (backbone, repeating) — sequencing quality metrics. *Clinical|Engineer* · *Medium*
- **`structureVariant`** (backbone, repeating) — structural/copy-number variant data. *Clinical* · *Medium*

### NutritionOrder
- **`oralDiet`** (backbone) — diet type, texture/consistency modifications, fluid restrictions; the core clinical content. *Clinical* · *High*
- **`enteralFormula`** (backbone) — tube-feeding formula, rate, and administration details. *Clinical* · *High*
- **`supplement`** (backbone, repeating) — oral nutritional supplements ordered and their schedule. *Clinical* · *Medium*

### NutritionProduct
- **`knownAllergen`** (repeating) — allergen flags, directly safety-relevant against a patient's allergy list. *Clinical* · *High*
- **`nutrient`** (backbone, repeating) — actual nutritional content (calories, macronutrients). *Clinical* · *Medium*
- **`ingredient`** (backbone, repeating) — full ingredient list. *Clinical* · *Low*

### Observation
- **`component`** (backbone, repeating) — many of the most common clinical observations (blood pressure, multi-analyte panels) rely entirely on components to carry their values; without this, panel-style Observations show no results at all. *Clinical* · *High*
- **`valueString`/`valueInteger`/`valueRange`/`valueSampledData`** — alternate branches of `value[x]`; leaving them dropped means free-text results, waveform tracings, and count-based results silently show no value. *Clinical* · *Medium*

### OperationDefinition
- **`parameter`** (backbone, repeating) — the actual input/output contract of the operation; without it the resource is a shell with no usable API contract. *Engineer* · *High*

### Organization
- **`contact`** (backbone, repeating) — named contact persons/departments, operationally useful for reaching a partner org. *PM* · *Medium*
- **`alias`** (String, repeating) — alternate/former names, helps resolve why the same org appears under different labels. *PM* · *Low*

### PackagedProductDefinition
- **`package`** (backbone) — the actual packaging structure (containers, quantities, contained items). *Engineer* · *Medium*
- **`name`** (String) — human-readable formulary/catalog name. *PM* · *Medium*

### Parameters
- **`parameter`** (backbone, repeating) — the entire payload of a Parameters resource; without it every instance renders as completely empty. *Engineer* · *High*

### Patient
- **`birthDate`** (date — see Top Finding) — one of the most basic and heavily relied-upon demographic facts, used for age calculation, identity verification, and clinical context. *Clinical* · *High*
- **`communication`** (backbone, repeating) — the patient's preferred language(s), directly affects how staff should interact (interpreter needs) — a real safety/quality-of-care concern when missing. *Clinical* · *High*
- **`multipleBirthInteger`** (Int) — birth order among multiples. *Clinical* · *Low*

### PaymentNotice
- **`paymentDate`** (date — Top Finding) — the single most important fact on a payment notice for reconciliation. *PM* · *High*

### PaymentReconciliation
- **`detail`** (backbone, repeating) — line-item breakdown of how the total payment was distributed. *PM* · *High*
- **`paymentDate`** (date — Top Finding) — needed to reconcile against bank/statement records. *PM* · *Medium*
- **`disposition`** (String) — human-readable status explanation. *PM* · *Medium*
- **`processNote`** (backbone, repeating) — free-text notes explaining processing decisions. *PM* · *Low*

### Person
- **`birthDate`** (date — Top Finding) — core identity information used to match/verify a Person against linked Patient records. *Clinical* · *High*

### PlanDefinition
- **`title`** (String) — human-readable label; engineers/PMs can currently only tell plans apart by opaque id/url. *PM|Engineer* · *High*
- **`goal`** (backbone, repeating) — the actual clinical/business outcomes the plan is intended to achieve. *Clinical|PM* · *High*
- **`action`** (backbone, repeating) — the concrete steps/activities that make up the plan. *Engineer|PM* · *High*
- **`version`** (String) — which revision is deployed/referenced. *Engineer* · *Medium*
- **`approvalDate`** (date — Top Finding) — whether/when this plan was officially approved. *PM* · *Low*

### Practitioner
- **`qualification`** (backbone, repeating) — board certifications, licenses, training authorizing this practitioner's care; central to provider-credential and directory data quality. *Clinical* · *High*
- **`birthDate`** (date — Top Finding) — used for identity matching/deduplication across source systems. *Engineer* · *Low*

### PractitionerRole
- **`availableTime`** (backbone, repeating) — the schedule of when this practitioner is available at a location/service. *Clinical* · *Medium*

### Procedure
- **`performedString` / `performedRange`** — `performed[x]` variants; since `performedDateTime`/`performedPeriod`/`performedAge` already render, a record using these instead currently shows no timing at all. *Clinical|Engineer* · *High/Medium*

### Questionnaire
- **`item`** (backbone, repeating) — the actual questions/groupings that make up the questionnaire; the entire substantive content. *Clinical|PM* · *High*
- **`title`** (String) — friendly display name (vs. machine-oriented `name`). *PM* · *High*
- **`version`** (String) — which revision was administered. *Engineer* · *Medium*
- **`approvalDate`/`lastReviewDate`** (date — Top Finding) — governance dates for auditing form content. *PM* · *Low*

### RegulatedAuthorization
- **`case`** (backbone) — the regulatory case/procedure behind the authorization. *PM|Engineer* · *High*
- **`indication`** (CodeableReference) — the condition/use for which the product is authorized. *PM* · *Medium*

### RelatedPerson
- **`communication`** (backbone, repeating) — language(s) this related person can use, relevant for coordinating with caregivers/interpreters. *Clinical* · *Medium*
- **`birthDate`** (date — Top Finding) — helps judge relationship context and identity verification. *Clinical* · *Low*

### RequestGroup
- **`action`** (backbone, repeating) — the entire operational content of the resource; without it, only envelope metadata shows. *Engineer|PM* · *High*

### ResearchElementDefinition
- **`characteristic`** (backbone, repeating) — the actual inclusion criteria (population/exposure/outcome logic). *Engineer|PM* · *High*

### ResearchStudy
- **`title`** (String) — primary human-readable label. *PM* · *High*
- **`arm`** (backbone, repeating) — the study's treatment/comparison arms — the experimental design itself. *PM|Engineer* · *High*
- **`objective`** (backbone, repeating) — the scientific question(s) the study answers. *PM* · *Medium*

### ResearchSubject
- **`assignedArm` / `actualArm`** (String) — intended vs. actual treatment group; important for trial-data review and protocol-deviation checks. *PM|Engineer* · *Medium*

### RiskAssessment
- **`prediction`** (backbone, repeating) — the actual predicted outcome(s), probability/qualitative risk, and rationale. *Clinical* · *High*
- **`mitigation`** (String) — concrete steps to reduce the identified risk. *Clinical* · *Medium*

### SearchParameter
- **`expression`** (String) — the FHIRPath expression defining what the parameter actually searches; core to debugging match failures. *Engineer* · *High*
- **`component`** (backbone, repeating) — sub-parameters making up a composite search parameter. *Engineer* · *Medium*

### ServiceRequest
- **`patientInstruction`** (String) — plain-language instructions given to the patient about the ordered service. *Clinical* · *Medium*

### Specimen
- **`collection`** (backbone) — collection method, collector, collected date/time, body site, fasting status — provenance data needed to trust/interpret lab results. *Clinical|Engineer* · *High*
- **`container`** (backbone, repeating) — physical container(s) holding the specimen. *Engineer* · *Medium*

### SpecimenDefinition
- **`typeTested`** (backbone, repeating) — container/preservative/handling requirements expected by the testing lab; the operational core of the resource. *Clinical|Engineer* · *High*

### StructureDefinition
- **`snapshot`** (backbone) — the fully expanded element list; the primary artifact engineers need to inspect a profile's actual constraints. *Engineer* · *High*
- **`differential`** (backbone) — the concise list of elements that differ from the base definition. *Engineer* · *High*

### StructureMap
- **`group`** (backbone, repeating) — the actual transformation rules/logic. *Engineer* · *High*
- **`structure`** (backbone, repeating) — declares the source/target StructureDefinitions used. *Engineer* · *Medium*

### Substance
- **`ingredient`** (backbone, repeating) — the constituent substances/strengths that compose this substance. *Clinical* · *High*
- **`instance`** (backbone, repeating) — specific physical instances (expiry, quantity, lot) for traceability. *Clinical|Engineer* · *Medium*

### SubstanceDefinition
- **`structure`** (backbone) — chemical structural information (molecular formula, isotopes). *Clinical|Engineer* · *High*
- **`name`** (backbone, repeating) — applicable names/synonyms, needed to actually identify the substance beyond a raw code. *Clinical* · *Medium*
- **`code`** (backbone, repeating) — classification/regulatory codes. *Engineer* · *Medium*

### SupplyDelivery
- **`suppliedItem`** (backbone) — what item/quantity was actually delivered; the entire substantive payload. *Clinical|PM* · *High*

### SupplyRequest
- **`parameter`** (backbone, repeating) — order specifics (size, color, other attributes) needed to fulfill the request correctly. *Clinical|Engineer* · *Medium*

### Task
- **`input`** (backbone, repeating) — the actual parameters the workflow engine passed in at creation time; since Task drives this app's own workflow engine, hiding this makes it impossible to debug why a task was created with the values it has. *Engineer* · *High*
- **`output`** (backbone, repeating) — the results produced when a task completes. *Engineer|Clinical* · *High*
- **`description`** (String) — human-readable summary of the task's purpose. *Engineer|Clinical* · *High*
- **`restriction`** (backbone) — limits on fulfilling the underlying request. *Engineer* · *Medium*

### TerminologyCapabilities
- **`codeSystem`** (backbone, repeating) — which code systems (versions/filters) the terminology server supports; the single most useful fact when debugging "why didn't this code validate/expand." *Engineer* · *High*
- **`software`** (backbone) — the terminology engine/version behind the statement. *Engineer* · *Medium*

### TestReport
- **`test`** (backbone, repeating) — the actual pass/fail results and assertions for each executed test action. *Engineer* · *High*
- **`setup`** (backbone) — whether required preconditions succeeded before tests ran. *Engineer* · *High*
- **`participant`** (backbone, repeating) — which client/server/engine executed the test. *Engineer* · *Medium*

### TestScript
- **`test`** (backbone, repeating) — the actual operations and assertions the script performs. *Engineer* · *High*
- **`setup`** (backbone) — required preconditions/actions run before tests. *Engineer* · *Medium*
- **`variable`** (backbone, repeating) — values extracted from responses and reused across steps. *Engineer* · *Medium*

### ValueSet
- **`compose`** (backbone) — the actual include/exclude rules; the core logical definition. *Engineer* · *High*
- **`expansion`** (backbone) — the pre-computed enumerated list of codes. *Engineer* · *High*

### VerificationResult
- **`primarySource`** (backbone, repeating) — which primary source(s) verified the data, how, and when — the crux of a compliance review. *PM* · *High*
- **`attestation`** (backbone) — who attested to the information and how. *PM* · *High*
- **`nextScheduled`** (date — Top Finding) — when the target is due for re-validation. *PM* · *Medium*

### VisionPrescription
- **`lensSpecification`** (backbone, repeating) — the actual prescription details (eye, sphere, cylinder, axis, add, prism, base curve, power, color); without it the resource shows only administrative metadata. *Clinical* · *High*

## Reviewed with no significant gaps found

AdverseEvent, Basic, Binary, Coverage, DeviceUseStatement, DocumentReference, DomainResource
(abstract), CatalogEntry, EnrollmentRequest, Flag, Linkage, ManufacturedItemDefinition,
MedicationStatement, NamingSystem, ObservationDefinition, OperationOutcome, OrganizationAffiliation,
Provenance, QuestionnaireResponse, Resource (abstract), Schedule, Slot, Subscription,
SubscriptionStatus, SubscriptionTopic (the latter three were the subject of PR #269's own
overhaul — their remaining dropped fields, e.g. `contact`, `useContext`,
`eventsSinceSubscriptionStart`, are minor/administrative).

## Suggested next steps (not yet actioned — for discussion)

1. **Fix the `date` partial gap first** (Top Finding). One generator change surfaces 37 fields
   across 24 resources, including `Patient.birthDate` / `Person.birthDate`.
2. Triage the *High* priority items above into a follow-up PR (or a few, grouped by resource
   family — clinical vs. financial/PM vs. engineering-infrastructure) using the exact same
   generator pattern this PR (#269) already established for Subscription: add entries to
   `partials_mapping_for_fields.py` for backbone-element fields, write any new partial components
   needed, run `make generate_components`.
3. *Medium*/*Low* items are good backlog candidates — the highest-leverage, lowest-effort ones
   (single scalar fields like `title`, `name`, `description`, `version` showing via the existing
   generic `NameValue`/`DateTime` partials) could likely be batched together cheaply.
4. Resources with no gaps, and the abstract `Resource`/`DomainResource` base types, need no
   further work.
