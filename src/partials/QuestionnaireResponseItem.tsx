import { Typography, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TQuestionnaireResponseItem } from '../types/partials/QuestionnaireResponseItem';
import PreJson from '../components/PreJson';


type TQuestionnaireResponseItemProps = TBaseResourceProps & {
    questionnaireResponseItem?: TQuestionnaireResponseItem[];
};

const QuestionnaireResponseItem = ({ name, questionnaireResponseItem }: TQuestionnaireResponseItemProps) => {
    return (
        <>
            {questionnaireResponseItem && questionnaireResponseItem.length > 0 && (
                <Box>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
                    <PreJson data={questionnaireResponseItem} filename="questionnaire-response-items.json" />
                </Box>
            )}
        </>
    );
};

export default QuestionnaireResponseItem;
