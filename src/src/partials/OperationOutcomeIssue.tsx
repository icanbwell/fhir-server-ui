import { Typography, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TOperationOutcomeIssue } from '../types/partials/OperationOutcomeIssue';
import Code from './Code';

type TOperationOutcomeIssueProps = TBaseResourceProps & {
  operationOutcomeIssue: TOperationOutcomeIssue|TOperationOutcomeIssue[]|undefined;
};

const OperationOutcomeIssue = ({ operationOutcomeIssue: issues }: TOperationOutcomeIssueProps) => {
  // Return null if issue is not defined
  if (issues === undefined) {
    return null;
  }

  if (!Array.isArray(issues)) {
    issues = [issues];
  }
  return (
    <>
      {issues.map((issue: TOperationOutcomeIssue) => (
        <Box>
          <Typography variant="body1" component="div">
            <Code code={issue.code} name="Code" />
            <Code code={issue.severity} name="Severity" />
            <Code code={issue.details?.text} name="Details" />
            <Code code={issue.diagnostics} name="Diagnostics" />
          </Typography>
        </Box>
      ))}
    </>
  );
};

export default OperationOutcomeIssue;

