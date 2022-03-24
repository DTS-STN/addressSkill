import { LuisRecognizer } from 'botbuilder-ai';
import {
    Choice, ChoiceFactory,TextPrompt,
    ChoicePrompt, ComponentDialog, ListStyle, PromptValidatorContext, WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../../../models/commonPromptValidatorModel';

import { LUISAlwaysOnBotSetup } from '../../alwaysOnBotRecognizer';

import i18n from '../../../locales/i18nConfig';

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
export const CHOICE_CHECK_UPDATE_ADDRESS_STEP = 'CHOICE_CHECK_UPDATE_ADDRESS_STEP';
const CHOICE_CHECK_UPDATE_ADDRESS_WATERFALL_STEP = 'CHOICE_CHECK_UPDATE_ADDRESS_WATERFALL_STEP';

export class ChoiceCheckUpdateAddressStep extends ComponentDialog {
    constructor() {
        super(CHOICE_CHECK_UPDATE_ADDRESS_STEP);

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new WaterfallDialog(CHOICE_CHECK_UPDATE_ADDRESS_WATERFALL_STEP, [
                this.promptStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = CHOICE_CHECK_UPDATE_ADDRESS_WATERFALL_STEP;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    /**
     * 1. Initial step in the waterfall.
     * 2. prompt user with a message based on the step in the flow
     */
    async promptStep(stepContext: WaterfallStepContext) {
        const commonPromptValidatorModel = stepContext.options as CommonPromptValidatorModel;
        let promptMessage: string;
        // displays initial prompt message to the user
        if (commonPromptValidatorModel.retryCount === 0) {
            if(!(commonPromptValidatorModel.initialPrompt === '')){
                promptMessage = commonPromptValidatorModel.initialPrompt;
            }
        }
        // shows the Master error message when user reaches max retry attempts
        else if (commonPromptValidatorModel.retryCount === commonPromptValidatorModel.maxRetryCount) {
            commonPromptValidatorModel.status = false;
            return await stepContext.endDialog(commonPromptValidatorModel);
        }
       // on every rerty attempt made by the user
        else {
            promptMessage = i18n.__(`${commonPromptValidatorModel.promptCode}RetryPromptMessage`);
        }
        // displays prompt options to the user
        const promptOptions = i18n.__(`${commonPromptValidatorModel.promptCode}PromptOptions`);
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: promptMessage,
            choices: ChoiceFactory.toChoices(promptOptions),
            style: ListStyle.suggestedAction
        });
    }
    // storing the intent value to the result and passing it to the common prompt validator class
    async finalStep(stepContext: WaterfallStepContext) {
        const recognizer = LUISAlwaysOnBotSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);
        const commonPromptValidatorModel = stepContext.options as CommonPromptValidatorModel;

        const matchFound = commonPromptValidatorModel.intents.includes(intent);
        if (matchFound)
        {
            commonPromptValidatorModel.result = intent;
            commonPromptValidatorModel.status = true;
            return await stepContext.endDialog(commonPromptValidatorModel);
        }
        commonPromptValidatorModel.result = intent;
        commonPromptValidatorModel.retryCount++;
        return await stepContext.replaceDialog(CHOICE_CHECK_UPDATE_ADDRESS_STEP, commonPromptValidatorModel);
   }
}
