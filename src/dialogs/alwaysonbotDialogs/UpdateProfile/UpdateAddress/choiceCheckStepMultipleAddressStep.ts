import { LuisRecognizer } from "botbuilder-ai";
import {
    Choice, ChoiceFactory,
    ChoicePrompt, ComponentDialog, ListStyle, PromptValidatorContext, WaterfallDialog,
    WaterfallStepContext
} from "botbuilder-dialogs";
import { adaptiveCard } from "../../../../cards";
import { callbackCard } from "../../../../cards/callbackCard";
import { CommonPromptValidatorModel } from "../../../../models/commonPromptValidatorModel";
import i18n from "../../../locales/i18nConfig";
import { LUISAlwaysOnBotSetup } from "../../alwaysOnBotRecognizer";
import { COMMON_CALL_BACK_STEP,CommonCallBackStep } from "../commonCallBackStep";
const CHOICE_PROMPT = "CHOICE_PROMPT";
export const COMMON_CHOICE_CHECK_MULTIPLE_ADDRESSES_STEP = "COMMON_CHOICE_CHECK_MULTIPLE_ADDRESSES_STEP";
const COMMON_CHOICE_CHECK_MULTIPLE_ADDRESSES_WATERFALL_STEP = "COMMON_CHOICE_CHECK_WATERFALL_STEP";
export class CommonChoiceCheckStepMultipleAddresses extends ComponentDialog {
    constructor() {
        super(COMMON_CHOICE_CHECK_MULTIPLE_ADDRESSES_STEP);
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new WaterfallDialog(COMMON_CHOICE_CHECK_MULTIPLE_ADDRESSES_WATERFALL_STEP, [
                this.promptStep.bind(this),
                this.finalStep.bind(this)
            ]));
        this.initialDialogId = COMMON_CHOICE_CHECK_MULTIPLE_ADDRESSES_WATERFALL_STEP;
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
           if(!(commonPromptValidatorModel.initialPrompt === "")){
            let promptMessage = commonPromptValidatorModel.initialPrompt;
            const promptOptions = commonPromptValidatorModel.intents;
            return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: promptMessage,
            choices: ChoiceFactory.toChoices(promptOptions),
            style: ListStyle.heroCard
        });
          }
        }
        // shows the Master error message when user reaches max retry attempts
        else if (commonPromptValidatorModel.retryCount === commonPromptValidatorModel.maxRetryCount) {
            commonPromptValidatorModel.status = false;
            const exceededRetryMessage = i18n.__(`MasterRetryExceededMessage`);
            let commonPromptValidatorModelNew = new CommonPromptValidatorModel(
                ["YesIWantToRequestCall", "NoNotForNow"],
                Number(i18n.__("MaxRetryCount")),
                "ServiceRepresentative",i18n.__("ServiceRepresentativePromptMessage")
            );
            return stepContext.replaceDialog(COMMON_CALL_BACK_STEP, commonPromptValidatorModelNew);
        }
        // on every rerty attempt made by the user
        else {
            promptMessage = i18n.__(`${commonPromptValidatorModel.promptCode}RetryPromptMessage`);
        }
        // displays prompt options to the user
        const promptOptions = commonPromptValidatorModel.intents;
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: promptMessage,
            choices: ChoiceFactory.toChoices(promptOptions),
            style: ListStyle.heroCard
        });
    }
    // storing the intent value to the result and passing it to the common prompt validator class
    async finalStep(stepContext: WaterfallStepContext) {
        const commonPromptValidatorModel = stepContext.options as CommonPromptValidatorModel;
        const matchFound = commonPromptValidatorModel.intents.includes(stepContext.context.activity.text);
        if (matchFound)
        {
            commonPromptValidatorModel.result = stepContext.context.activity.text;
            commonPromptValidatorModel.status = true;
            return await stepContext.endDialog(commonPromptValidatorModel);
        }
        commonPromptValidatorModel.result = stepContext.context.activity.text;
        commonPromptValidatorModel.retryCount++;
        return await stepContext.replaceDialog(COMMON_CHOICE_CHECK_MULTIPLE_ADDRESSES_STEP, commonPromptValidatorModel);
   }
}