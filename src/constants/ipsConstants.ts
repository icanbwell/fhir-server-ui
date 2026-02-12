/* eslint-disable no-unused-vars */
export enum IPSMandatorySections {
  ALLERGIES = 'Allergies and Intolerances',
  MEDICATIONS = 'Medication Summary',
  PROBLEMS = 'Problem List',
}

export const IPSMissingMandatorySectionContent: Record<
  string,
  string
> = {
  [IPSMandatorySections.PROBLEMS]:
    "There is no information available about the subject's health problems or disabilities.",
  [IPSMandatorySections.ALLERGIES]:
    "There is no information available regarding the subject's allergy conditions.",
  [IPSMandatorySections.MEDICATIONS]:
    "There is no information available about the subject's medication use or administration.",
};

export const isMandatoryIPSSection = (title: string): boolean => {
  return Object.values(IPSMandatorySections).includes(title as IPSMandatorySections);
};

export const getMandatorySectionContent = (title: string): string | null => {
  if (isMandatoryIPSSection(title)) {
    return IPSMissingMandatorySectionContent[title as IPSMandatorySections] || null;
  }
  return null;
};
