import { LuisRecognizer } from "botbuilder-ai";
import {
    Choice, ChoiceFactory, ChoicePrompt, ComponentDialog, DialogTurnResult, ListStyle, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from "botbuilder-dialogs";
import { CommonPromptValidatorModel } from "../../../models/commonPromptValidatorModel";
import { LUISAlwaysOnBotSetup } from "../alwaysOnBotRecognizer";

import i18n from "../../locales/i18nConfig";
import { COMMON_CHOICE_CHECK_STEP } from "../UpdateProfile/UpdateAddress/commonChoiceCheckStep";
import { UpdateProfileStep, UPDATE_PROFILE_STEP } from "../UpdateProfile/updateProfileStep";
import { FeedBackStep, FEED_BACK_STEP } from "./feedBackStep";
import { AddressDetails } from "../UpdateProfile/UpdateAddress/addressDetails";
import { UPDATE_ADDRESS_STEP } from "../UpdateProfile/UpdateAddress/updateAddressStep";

const TEXT_PROMPT = "TEXT_PROMPT";
const CHOICE_PROMPT = "CHOICE_PROMPT";
let isFeedBackStepPassed:Boolean = false;
export const CONTINUE_AND_FEEDBACK_STEP = "CONTINUE_AND_FEEDBACK_STEP";
const CONTINUE_AND_FEEDBACK_WATERFALL_STEP = "CONTINUE_AND_FEEDBACK_WATERFALL_STEP";

export class ContinueAndFeedbackStep extends ComponentDialog {
    constructor() {
        super(CONTINUE_AND_FEEDBACK_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new FeedBackStep())
            .addDialog(new WaterfallDialog(CONTINUE_AND_FEEDBACK_WATERFALL_STEP, [
                this.continueStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)

            ]));

        this.initialDialogId = CONTINUE_AND_FEEDBACK_WATERFALL_STEP;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
   /**
   * Initial step in the waterfall. This will prompts Yes and No to the User like confirmation step.
   *
   * This is the end of the process,either user will go to the main flow or will end the process if there are no action required by the user.
   */
    async continueStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult> {

        let commonPromptValidatorModel = new CommonPromptValidatorModel(
            ["promptConfirmYes", "promptConfirmNo"],
            Number(i18n.__("MaxRetryCount")),
            "continueAndFeed",i18n.__("continueAndFeedPromptMessage")
        );
        //call dialog
        return await stepContext.beginDialog(COMMON_CHOICE_CHECK_STEP, commonPromptValidatorModel);
    }

   /**
   * Confirmation step in the waterfall.bot chooses the different flows depends on user's input
   * If users selects 'Yes' then bot will navigate to the main workflow
   * If users selects 'No' then bot will navigate to the feedback flow
   */
    async confirmStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult> {
        const recognizer = LUISAlwaysOnBotSetup(stepContext);
        const recognizerResult = await recognizer.recognize(stepContext.context);
        const intent = LuisRecognizer.topIntent(recognizerResult, "None", 0.5);
        switch (intent) {
            case "promptConfirmYes":
                let commonPromptValidatorModel = new CommonPromptValidatorModel(
                    ["UpdateMyAddress"],
                    Number(i18n.__("MaxRetryCount")),
                    "UpdateMyProfile",i18n.__("UpdateMyProfilePromptMessage")
                );
                //call dialog 'COMMON_CHOICE_CHECK_DIALOG'
                return await stepContext.beginDialog(COMMON_CHOICE_CHECK_STEP, commonPromptValidatorModel);
            case "promptConfirmNo":
                return await stepContext.replaceDialog(FEED_BACK_STEP,FeedBackStep);
            default:
                isFeedBackStepPassed =  true;
                return stepContext.replaceDialog(FEED_BACK_STEP, FeedBackStep);
        }
    }
   /**
   * This is the final step in waterfall.bot displays the main workflow prompt suggestions to the user only if users select the 'Yes' in above step.
   */
    async finalStep(stepContext) {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;
        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status) {
            switch (commonPromptValidatorModel.result) {
                case "UpdateMyAddress":
                    const addressDetails = new AddressDetails;
                    return await stepContext.replaceDialog(UPDATE_ADDRESS_STEP, addressDetails);
            }
        }
        else {
            if(!isFeedBackStepPassed){
                return stepContext.replaceDialog(FEED_BACK_STEP, FeedBackStep);
            }
        }
    }
}
