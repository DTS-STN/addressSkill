import {
    Choice, ChoicePrompt, ComponentDialog, DialogTurnResult, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from "botbuilder-dialogs";
import { CommonPromptValidatorModel } from "../../../models/commonPromptValidatorModel";
import { ContinueAndFeedbackStep } from "../Common/continueAndFeedbackStep";
import { FeedBackStep, FEED_BACK_STEP } from "../Common/feedBackStep";
import { UpdateAddressStep, UPDATE_ADDRESS_STEP } from "./UpdateAddress/updateAddressStep";
import { CommonChoiceCheckStep, COMMON_CHOICE_CHECK_STEP } from "../UpdateProfile/UpdateAddress/commonChoiceCheckStep";
import i18n from "../../locales/i18nconfig";
import { AddressDetails } from "./UpdateAddress/addressDetails";


const TEXT_PROMPT = "TEXT_PROMPT";
const CHOICE_PROMPT = "CHOICE_PROMPT";

export const UPDATE_PROFILE_STEP = "UPDATE_PROFILE_STEP";
const UPDATE_PROFILE_WATERFALL_STEP = "UPDATE_PROFILE_WATERFALL_STEP";

// Define the main dialog and its related components.
export class UpdateProfileStep extends ComponentDialog {
    constructor() {
        super(UPDATE_PROFILE_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new UpdateAddressStep())
            .addDialog(new FeedBackStep())
            .addDialog(new CommonChoiceCheckStep())
            .addDialog(new ContinueAndFeedbackStep())
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new WaterfallDialog(UPDATE_PROFILE_WATERFALL_STEP, [
                this.checkProfileStep.bind(this),
                this.routingStep.bind(this)
            ]));

        this.initialDialogId = UPDATE_PROFILE_WATERFALL_STEP;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }

     /**
     * Passing intents list related to UpdateMyProfile dialog.
     * Passing master error count to common choice dialog.
     * Passing current dialog name to common choice dialog.
     */
    async checkProfileStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {

        let commonPromptValidatorModel = new CommonPromptValidatorModel(
            ["UpdateMyAddress"],
            Number(i18n.__("MaxRetryCount")),
            "UpdateMyProfile",i18n.__("UpdateMyProfilePromptMessage")
        );
        //call dialog
        return await stepContext.beginDialog(COMMON_CHOICE_CHECK_STEP, commonPromptValidatorModel);
    }
   /**
   * Selection step in the waterfall.bot chooses the different flows depends on user's input
   * If users selects 'Update My Address' then bot will navigate to the UpdateAddressDialog workflow
   * If users selects 'Update My Phone Number' then bot will navigate to the UpdateMyPhoneDialog workflow
   * If users selects 'Update My Email' then bot will navigate to the UpdateMyEmail workflow
   */
    async routingStep(stepContext) {
        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;
        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status) {
            switch (commonPromptValidatorModel.result) {
                case "UpdateMyAddress":
                    const addressDetails = new AddressDetails;
                    return await stepContext.replaceDialog(UPDATE_ADDRESS_STEP, addressDetails);  
            }
        }
        else {
            return stepContext.replaceDialog(FEED_BACK_STEP, FeedBackStep);
        }
    }
}
