import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Link,
} from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCodeableConcept } from '../types/partials/CodeableConcept';
import { TCoding } from '../types/partials/Coding';

type TCodeableConceptProps = TBaseResourceProps & {
  codeableConcept: TCodeableConcept|TCodeableConcept[]|undefined;
};

function CodeableConcept({
  codeableConcept: codeableConcepts,
  name,
  resourceType,
  searchParameter,
}: TCodeableConceptProps) {
  if (codeableConcepts && !Array.isArray(codeableConcepts)) {
    codeableConcepts = [codeableConcepts];
  }

  const getLink = (system: String|undefined, code: String|undefined) => {
    let link;
    switch (system) {
      case 'http://www.ama-assn.org/go/cpt':
        link = `https://vsac.nlm.nih.gov/context/cs/codesystem/CPT/version/2022/code/${code}/info`;
        break;
      case 'http://snomed.info/sct':
        link = `https://vsac.nlm.nih.gov/context/cs/codesystem/SNOMEDCT/version/2022-03/code/${code}/info`;
        break;
      case 'http://hl7.org/fhir/sid/cvx':
        link = `https://vsac.nlm.nih.gov/context/cs/codesystem/CVX/version/2022-08-17/code/${code}/info`;
        break;
      case 'http://hl7.org/fhir/sid/icd-10-cm':
      case 'http://hl7.org/fhir/sid/icd-10':
        let formattedCode =
          code && (code.includes('.') || code.length < 4
            ? code
            : code.substr(0, 3) + '.' + code.substr(3, 10));
        link = `https://vsac.nlm.nih.gov/context/cs/codesystem/ICD10CM/version/2023/code/${formattedCode}/info`;
        break;
      case 'http://www.nlm.nih.gov/research/umls/rxnorm':
        link = `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${code}`;
        break;
      case 'http://loinc.org':
        link = `https://loinc.org/${code}`;
        break;
      default:
        link = '';
    }
    return link;
  };

  if (codeableConcepts && codeableConcepts.length > 0 && codeableConcepts[0]) {
    return (
      <React.Fragment>
        <Typography variant="h4">{name}</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Id</TableCell>
                <TableCell>Text/Display</TableCell>
                <TableCell>Code System</TableCell>
                <TableCell>Code</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {codeableConcepts.flatMap((codeableConcept: TCodeableConcept, index: Number) => (
                <>
                  {codeableConcept.coding &&
                    codeableConcept.coding.map((coding: TCoding, index2: Number) => (
                      <TableRow key={`${index}.${index2}`}>
                        <TableCell>{coding.id}</TableCell>
                        <TableCell>
                          {codeableConcept.text || coding.display}
                        </TableCell>
                        {searchParameter ? (
                          <>
                            <TableCell>
                              <Link
                                href={`/4_0_0/${resourceType}?${searchParameter}=${coding.system}|`}
                              >
                                {coding.system}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {coding.system && coding.code ? (
                                <Link
                                  href={getLink(coding.system, coding.code)}
                                >
                                  {coding.code}
                                </Link>
                              ) : (
                                <>{coding.code}</>
                              )}
                              [
                              <Link
                                href={`/4_0_0/${resourceType}?${searchParameter}=${
                                  coding.system || ''
                                }|${coding.code}`}
                              >
                                Search
                              </Link>
                              ]
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{coding.system}</TableCell>
                            <TableCell>
                              <Link href={getLink(coding.system, coding.code)}>
                                {coding.code}
                              </Link>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  {codeableConcept.text && (
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>{codeableConcept.text}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </React.Fragment>
    );
  } else {
    return <></>;
  }
}

export default CodeableConcept;
