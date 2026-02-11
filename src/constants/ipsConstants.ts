/* eslint-disable no-unused-vars */
export enum IPSSections {
  ALLERGIES = 'Allergies and Intolerances',
  MEDICATIONS = 'Medication Summary',
  PROBLEMS = 'Problem List',
  PATIENT = 'Patient summary Document',
  IMMUNIZATIONS = 'Immunizations',
  DIAGNOSTIC_REPORTS = 'Results Summary',
  PROCEDURES = 'History of Procedures',
  MEDICAL_DEVICES = 'History of Medical Devices',
  VITAL_SIGNS = 'Vital Signs',
  ADVANCE_DIRECTIVES = 'Advance Directives',
  FUNCTIONAL_STATUS = 'Functional Status',
  PREGNANCY_HISTORY = 'History of Pregnancies',
  CARE_PLAN = 'Plan of Care',
  MEDICAL_HISTORY = 'History of Past Illness',
  SOCIAL_HISTORY = 'Social History',
}

export const IPSMissingMandatorySectionContent: Record<
  string,
  string
> = {
  [IPSSections.PROBLEMS]:
    "There is no information available about the subject's health problems or disabilities.",
  [IPSSections.ALLERGIES]:
    "There is no information available regarding the subject's allergy conditions.",
  [IPSSections.MEDICATIONS]:
    "There is no information available about the subject's medication use or administration.",
};

export const isMandatoryIPSSection = (title: string): boolean => {
  return Object.values(IPSSections).includes(title as IPSSections);
};

export const getMandatorySectionContent = (title: string): string | null => {
    console.log('Getting mandatory section content for title:', title);
  if (isMandatoryIPSSection(title)) {
    return IPSMissingMandatorySectionContent[title as IPSSections] || null;
  }
  return null;
};
