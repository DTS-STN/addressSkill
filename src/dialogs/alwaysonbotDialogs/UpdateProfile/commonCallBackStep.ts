
import {
    Choice,
    ChoicePrompt, ComponentDialog, DialogTurnResult, PromptValidatorContext, TextPrompt, WaterfallDialog, WaterfallStepContext
} from "botbuilder-dialogs";
import { CommonPromptValidatorModel } from "../../../models/commonPromptValidatorModel";
import { ContinueAndFeedbackStep, CONTINUE_AND_FEEDBACK_STEP } from "../Common/continueAndFeedbackStep";
import { FeedBackStep, FEED_BACK_STEP } from "../Common/feedBackStep";
import { CommonChoiceCheckStep, COMMON_CHOICE_CHECK_STEP } from "../UpdateProfile/UpdateAddress/commonChoiceCheckStep";
import i18n from "../../locales/i18nConfig1";
import { CallbackBotDetails } from "../../callbackDialogs/callbackBotDetails";
import { CALLBACK_BOT_DIALOG,CallbackBotDialog } from "../../callbackDialogs/callbackBotDialog";
const CHOISE_PROMPT = "CHOISE_PROMPT";
const TEXT_PROMPT = "TEXT_PROMPT";

export const COMMON_CALL_BACK_STEP = "COMMON_CALL_BACK_STEP";
const COMMON_CALL_BACK_WATERFALL_STEP = "COMMON_CALL_BACK_WATERFALL_STEP";

// Define the main dialog and its related components.
export class CommonCallBackStep extends ComponentDialog {
    constructor() {
        super(COMMON_CALL_BACK_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOISE_PROMPT))
            .addDialog(new ContinueAndFeedbackStep())
            .addDialog(new FeedBackStep())
            .addDialog(new CallbackBotDialog())
            .addDialog(new CommonChoiceCheckStep())
            .addDialog(new WaterfallDialog(COMMON_CALL_BACK_WATERFALL_STEP, [
                this.continueStep.bind(this),
                this.selectionStep.bind(this)

            ]));

        this.initialDialogId = COMMON_CALL_BACK_WATERFALL_STEP;
    }

     private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    async continueStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const details = stepContext.options as CommonPromptValidatorModel;
        let commonPromptValidatorModel = new CommonPromptValidatorModel(
            ["YesIWantToRequestCall", "NoNotForNow"],
            Number(i18n.__("MaxRetryCount")),
            details.promptCode,details.promptCode+"PromptMessage"
        );
        //call dialog
        return await stepContext.beginDialog(COMMON_CHOICE_CHECK_STEP, commonPromptValidatorModel);
    }
    /**
    * User selection step in the waterfall.
    * User selects the "Yes" prompt to navigate to the call back flow.
    * User selects the "No" prompt to navigate to initial dialog in the flow.
    */

     private async selectionStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;

        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status)
        {
            switch (commonPromptValidatorModel.result) {
                case "YesIWantToRequestCall":
                    const callbackBotDetails  = new CallbackBotDetails();
                    return await stepContext.replaceDialog(CALLBACK_BOT_DIALOG,callbackBotDetails);
                case "NoNotForNow":
                    return await stepContext.replaceDialog(CONTINUE_AND_FEEDBACK_STEP, ContinueAndFeedbackStep);
            }
        }
        else
        {
            return stepContext.beginDialog(FEED_BACK_STEP, FeedBackStep);
        }
    }
}