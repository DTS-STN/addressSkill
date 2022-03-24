import {
    Choice, ChoicePrompt, ComponentDialog, PromptValidatorContext, TextPrompt,
    WaterfallDialog
} from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../../../models/commonPromptValidatorModel';
import { ContinueAndFeedbackStep } from '../../Common/continueAndFeedbackStep';
import i18n from '../../../locales/i18nConfig';
import { AddressDetails } from './addressDetails';
import { COMMON_CALL_BACK_STEP,CommonCallBackStep } from '../commonCallBackStep';

const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

export const VALIDATE_NUMBER_STEP = 'VALIDATE_NUMBER_STEP';
const VALIDATE_NUMBER_STEP_WATERFALL_STEP = 'VALIDATE_NUMBER_STEP_WATERFALL_STEP';
// Define the main dialog and its related components.
export class ValidateNumberStep extends ComponentDialog {
    constructor() {
        super(VALIDATE_NUMBER_STEP);
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new ContinueAndFeedbackStep())
            .addDialog(new CommonCallBackStep())
            .addDialog(new WaterfallDialog(VALIDATE_NUMBER_STEP_WATERFALL_STEP, [
                this.initPrompt.bind(this),
                this.checkNumberStep.bind(this)
            ]));

        this.initialDialogId = VALIDATE_NUMBER_STEP_WATERFALL_STEP;
    }
    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    // First step in the waterfall dialog. Prompts the user for a command.
    async initPrompt(stepContext) {
        const addressDetails = stepContext.options as AddressDetails;
        if(addressDetails.errorCount.numberValidationStep === 0){
          // call dialog
          return await stepContext.prompt(TEXT_PROMPT, addressDetails.promptMessage);
        }else{
          return await stepContext.prompt(TEXT_PROMPT, addressDetails.promptRetryMessage);
        }
    }
    async checkNumberStep(stepContext) {

         const addressDetails = stepContext.options as AddressDetails;
         let isValidNumber:boolean;
         isValidNumber = this.validateNumber(stepContext.context.activity.text);
         if(!isValidNumber){
            addressDetails.errorCount.numberValidationStep++;
            if (addressDetails.errorCount.numberValidationStep >= Number(i18n.__('MaxRetryCount'))) {

                const commonPromptValidatorModel = new CommonPromptValidatorModel(
                    ['YesIWantToRequestCall', 'NoNotForNow'],
                    Number(i18n.__('MaxRetryCount')),
                    'ServiceRepresentative',i18n.__('ServiceRepresentativePromptMessage')
                );
                return await stepContext.replaceDialog(COMMON_CALL_BACK_STEP, commonPromptValidatorModel);
            }
            else{
                return await stepContext.replaceDialog(VALIDATE_NUMBER_STEP, addressDetails);
            }
         }
         else{
            return await stepContext.next();
         }
     }

     private validateNumber(response:string)
     {
         let reg = /^[0-9]*$/
         let validNumber:boolean = false;
         reg = new RegExp(reg);
         if(response.match(reg))
         {
             validNumber = true;
         }
         return validNumber;
     }

}