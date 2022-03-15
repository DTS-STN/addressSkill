
import { Choice, ChoicePrompt, ComponentDialog, ConfirmPrompt, DialogTurnResult, PromptValidatorContext, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { CommonPromptValidatorModel } from "../../../../models/commonPromptValidatorModel";
import { CONTINUE_AND_FEEDBACK_STEP,ContinueAndFeedbackStep } from "../../Common/continueAndFeedbackStep";
import { FeedBackStep, FEED_BACK_STEP } from "../../Common/feedBackStep";
import { COMMON_CHOICE_CHECK_STEP } from "../../../alwaysonbotDialogs/UpdateProfile/UpdateAddress/commonChoiceCheckStep";
import { AddressDetails } from "./addressDetails";
import { GetAddressesStep, GET_ADDRESS_STEP } from "./getAddressesStep";
import i18n from "../../../locales/i18nConfig";
import { COMMON_CALL_BACK_STEP,CommonCallBackStep } from "../commonCallBackStep";

const CONFIRM_PROMPT = "CONFIRM_PROMPT";
const CHOICE_PROMPT = "CHOICE_PROMPT";
export const UPDATE_ADDRESS_STEP = "UPDATE_ADDRESS_STEP";
const UPDATE_ADDRESS_WATERFALL_STEP = "UPDATE_ADDRESS_WATERFALL_STEP";

let isCallBackPassed:Boolean = false;
// Define the main dialog and its related components.
export class UpdateAddressStep extends ComponentDialog {
    constructor() {
        super(UPDATE_ADDRESS_STEP);

        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new ContinueAndFeedbackStep())
            .addDialog(new GetAddressesStep())
            .addDialog(new WaterfallDialog(UPDATE_ADDRESS_WATERFALL_STEP, [
                this.checkAddressStep.bind(this),
                this.selectionStep.bind(this),
            ]));

        this.initialDialogId = UPDATE_ADDRESS_WATERFALL_STEP;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    /**
     * Passing intents list related to UpdateAddress dialog.
     * Passing master error count to common choice dialog.
     * Passing current dialog name to common choice dialog.
     */
    async checkAddressStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        const addressDetails = stepContext.options as AddressDetails;
        addressDetails.errorCount.updateAddressStep++;
        if (addressDetails.errorCount.updateAddressStep >= Number(i18n.__("MaxRetryCount"))) {
            let commonPromptValidatorModel = new CommonPromptValidatorModel(
                ["YesIWantToRequestCall", "NoNotForNow"],
                Number(i18n.__("MaxRetryCount")),
                "ServiceRepresentative",i18n.__("ServiceRepresentativePromptMessage")
            );
            isCallBackPassed = true;
            return await stepContext.replaceDialog(COMMON_CALL_BACK_STEP, commonPromptValidatorModel);
        }
        else{
            console.log(addressDetails.errorCount.updateAddressStep);
            if (addressDetails.errorCount.updateAddressStep === 0){
            let commonPromptValidatorModel = new CommonPromptValidatorModel(
               ["promptConfirmYes", "promptConfirmNo"],
               Number(i18n.__("MaxRetryCount")),
              "UpdateAddress",i18n.__("UpdateAddressPromptMessage")
              );
            return await stepContext.beginDialog(COMMON_CHOICE_CHECK_STEP, commonPromptValidatorModel);
            }else{
                isCallBackPassed = true;
                const addressDetails = stepContext.options as AddressDetails;
                return await stepContext.replaceDialog(GET_ADDRESS_STEP, addressDetails);

            }
    }
    }

   /**
   * Selection step in the waterfall.bot chooses the different flows depends on user's input
   * If users selects 'Yes' then bot will navigate to the Get Address workflow
   * If users selects 'No' then bot will navigate to the continue and feedback flow
   */
     async selectionStep(stepContext) {

        const commonPromptValidatorModel = stepContext.result as CommonPromptValidatorModel;
        if (commonPromptValidatorModel != null && commonPromptValidatorModel.status) {
            switch (commonPromptValidatorModel.result) {
                case "promptConfirmYes":
                    const addressDetails = stepContext.options as AddressDetails;
                    return await stepContext.replaceDialog(GET_ADDRESS_STEP, addressDetails);
                case "promptConfirmNo":
                    return await stepContext.replaceDialog(CONTINUE_AND_FEEDBACK_STEP, ContinueAndFeedbackStep);
            }
        }
        else {
            if(!isCallBackPassed){
            return stepContext.replaceDialog(FEED_BACK_STEP, FeedBackStep);
            }
        }
    }
}

