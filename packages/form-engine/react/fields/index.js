import { TextAnswer } from './TextAnswer.jsx';
import { ChoiceAnswer } from './ChoiceAnswer.jsx';
import { MultiChoiceAnswer } from './MultiChoiceAnswer.jsx';
import { ConsentAnswer } from './ConsentAnswer.jsx';

/**
 * Which component answers which kind of question.
 *
 * A registry rather than a chain of conditionals, so adding a field type is
 * one entry here and one schema rule in the contracts package.
 */
const FIELD_COMPONENTS = {
  text: TextAnswer,
  longText: TextAnswer,
  phone: TextAnswer,
  email: TextAnswer,
  url: TextAnswer,
  choice: ChoiceAnswer,
  identityRoute: ChoiceAnswer,
  yesNo: ChoiceAnswer,
  multiChoice: MultiChoiceAnswer,
  consent: ConsentAnswer,
};

export function getFieldComponent(type) {
  return FIELD_COMPONENTS[type] ?? TextAnswer;
}
