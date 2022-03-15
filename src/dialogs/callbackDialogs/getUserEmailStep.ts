import { LuisRecognizer } from "botbuilder-ai";
import {
  TextPrompt,
  ComponentDialog,
  WaterfallDialog,
  WaterfallStepContext,
  ChoiceFactory,
} from "botbuilder-dialogs";

import { CallbackBotDetails } from "./callbackBotDetails";
import { CallbackRecognizer } from "./callbackRecognizer";
import { CONFIRM_EMAIL_STEP } from "./confirmEmailStep";
import { GET_PREFERRED_METHOD_OF_CONTACT_STEP } from "./getPreferredMethodOfContactStep";
import i18n from "../locales/i18nConfig";

const TEXT_PROMPT = "TEXT_PROMPT";
export const GET_USER_EMAIL_STEP = "GET_USER_EMAIL_STEP";
const GET_USER_EMAIL_WATERFALL_STEP = "GET_USER_EMAIL_WATERFALL_STEP";
const MAX_ERROR_COUNT = 3;

export class GetUserEmailStep extends ComponentDialog {
  constructor() {
    super(GET_USER_EMAIL_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));

    this.addDialog(
      new WaterfallDialog(GET_USER_EMAIL_WATERFALL_STEP, [
        this.initialStep.bind(this),
        this.finalStep.bind(this),
      ])
    );

    this.initialDialogId = GET_USER_EMAIL_WATERFALL_STEP;
  }
  /**
   * Kick off the dialog by asking for an email address
   *
   */
  async initialStep(stepContext: WaterfallStepContext) {
    // Get the user details / state machine
    const callbackBotDetails = stepContext.options as CallbackBotDetails;

    // Set the text for the prompt
    const standardMsg = i18n.__("getUserEmailStepStandardMsg");

    // Set the text for the retry prompt
    const retryMsg = i18n.__("getUserEmailFormatErrorMsg");

    // Check if the error count is greater than the max threshold
    if (callbackBotDetails.errorCount.getUserEmailStep >= MAX_ERROR_COUNT) {
      // Throw the master error flag
      // callbackBotDetails.masterError = true;
      const errorMsg = i18n.__("emailFormatMaxErrorMsg");

      // Send master error message
      // await stepContext.context.sendActivity(errorMsg);

      const promptOptions = i18n.__("confirmEmailStepErrorPromptOptions");

      const promptDetails = {
        prompt: ChoiceFactory.forChannel(
          stepContext.context,
          promptOptions,
          errorMsg
        ),
      };
      return await stepContext.prompt(TEXT_PROMPT, promptDetails);
      // End the dialog and pass the updated details state machine

      // return await stepContext.endDialog(callbackBotDetails);
    }
    // Check the user state to see if unblockBotDetails.getAndSendEmailStep is set to null or -1
    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    else if (
      (callbackBotDetails.getUserEmailStep === null ||
        callbackBotDetails.getUserEmailStep === -1) &&
      typeof callbackBotDetails.confirmEmailStep === "boolean" &&
      callbackBotDetails.confirmEmailStep === false
    ) {
      // Setup the prompt message
      let promptMsg = "";

      // The current step is an error state
      if (callbackBotDetails.getUserEmailStep === -1) {
        promptMsg = retryMsg;
      } else {
        promptMsg = standardMsg;
      }
      return await stepContext.prompt(TEXT_PROMPT, promptMsg);
    }
    return await stepContext.next(false);
  }

  /**
   *
   *
   */
  async finalStep(stepContext: WaterfallStepContext) {
    // Get the user details / state machine
    const callbackBotDetails = stepContext.options as CallbackBotDetails;
    let luisRecognizer;
    let lang = "en";

    // Then change LUIZ appID
    if (
      stepContext.context.activity.locale.toLowerCase() === "fr-ca" ||
      stepContext.context.activity.locale.toLowerCase() === "fr-fr"
    ) {
      lang = "fr";
    }

    // LUIZ Recogniser processing
    luisRecognizer = new CallbackRecognizer(lang);

    // Call prompts recognizer
    const recognizerResult = await luisRecognizer.executeLuisQuery(
      stepContext.context
    );

    // Top intent tell us which cognitive service to use.
    const intent = LuisRecognizer.topIntent(recognizerResult, "None", 0.5);

    switch (intent) {
      // Proceed
      case "promptConfirmSendEmailYes":
      case "promptConfirmNotifyYes":
      case "promptConfirmYes":
        console.log("INTENT: ", intent);
        callbackBotDetails.getPreferredMethodOfContactStep = null;
        callbackBotDetails.confirmEmailStep = null;
        callbackBotDetails.preferredEmailAndText = null;
        callbackBotDetails.preferredEmail = null;
        callbackBotDetails.getUserEmailStep = null;
        callbackBotDetails.errorCount.getUserEmailStep = 0;
        return await stepContext.replaceDialog(
          GET_PREFERRED_METHOD_OF_CONTACT_STEP,
          callbackBotDetails
        );

      // Don't Proceed
      case "promptConfirmEmailNo":
      case "promptConfirmNo":
        console.log("INTENT: ", intent);

        return await stepContext.endDialog(callbackBotDetails);
      // Could not understand / None intent
      default: {
        // Catch all
        console.log("NONE INTENT");
        // Result has come through
        const results = stepContext.result;
        if (results) {
          const re =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          // Email validation
          if (re.test(String(results).toLowerCase())) {
            callbackBotDetails.confirmEmailStep = true;
            callbackBotDetails.getUserEmailStep = true;

            const confirmMsg = i18n.__("getUserEmailStepConfirmMsg");

            await stepContext.context.sendActivity(confirmMsg);
            return await stepContext.endDialog(callbackBotDetails);
          } else {
            callbackBotDetails.getUserEmailStep = -1;
            callbackBotDetails.errorCount.getUserEmailStep++;
          }
        }
        return await stepContext.replaceDialog(
          GET_USER_EMAIL_STEP,
          callbackBotDetails
        );
      }
    }
  }
}
