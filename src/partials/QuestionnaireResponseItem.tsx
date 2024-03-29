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
                    <Typography variant="h4">{name}</Typography>
                    <PreJson data={questionnaireResponseItem} />
                </Box>
            )}
        </>
    );
};

export default QuestionnaireResponseItem;
