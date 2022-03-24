import {
  TextPrompt,
  ComponentDialog,
  WaterfallDialog,
  ChoiceFactory,
  WaterfallStepContext,
} from "botbuilder-dialogs";

import { LuisRecognizer } from "botbuilder-ai";

import i18n from "../locales/i18nConfig";
import { GET_USER_PHONE_NUMBER_STEP } from "./getUserPhoneNumberStep";
import { CallbackBotDetails } from "./callbackBotDetails";
import { CallbackRecognizer } from "./callbackRecognizer";

const TEXT_PROMPT = "TEXT_PROMPT";
export const CONFIRM_PHONE_STEP = "CONFIRM_PHONE_STEP";
const CONFIRM_PHONE_WATERFALL_STEP = "CONFIRM_PHONE_WATERFALL_STEP";

const MAX_ERROR_COUNT = 3;

export class ConfirmPhoneStep extends ComponentDialog {
  constructor() {
    super(CONFIRM_PHONE_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));

    this.addDialog(
      new WaterfallDialog(CONFIRM_PHONE_WATERFALL_STEP, [
        this.initialStep.bind(this),
        this.finalStep.bind(this),
      ])
    );

    this.initialDialogId = CONFIRM_PHONE_WATERFALL_STEP;
  }

  /**
   * Kick off the dialog by asking confirm the existing email address correct
   *
   */
  async initialStep(stepContext: WaterfallStepContext) {
    // Get the user details / state machine
    const callbackBotDetails = stepContext.options as CallbackBotDetails;

    // Set the text for the prompt
    const standardMsg = i18n.__("confirmPhoneStepStandMsg");

    // Set the text for the retry prompt
    const retryMsg = i18n.__("confirmPhoneStepRetryMsg");

    // Check if the error count is greater than the max threshold
    if (callbackBotDetails.errorCount.confirmPhoneStep >= MAX_ERROR_COUNT) {
      // Throw the master error flag
      callbackBotDetails.masterError = true;

      // Set master error message to send
      const errorMsg = i18n.__("masterErrorMsg");

      // Send master error message
      await stepContext.context.sendActivity(errorMsg);

      // End the dialog and pass the updated details state machine
      return await stepContext.endDialog(callbackBotDetails);
    }

    // Check the user state to see if unblockBotDetails.confirmPhoneStep is set to null or -1
    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    if (
      callbackBotDetails.confirmPhoneStep === null ||
      callbackBotDetails.confirmPhoneStep === -1
    ) {
      // Setup the prompt message
      let promptMsg = "";

      // The current step is an error state
      if (callbackBotDetails.confirmPhoneStep === -1) {
        promptMsg = retryMsg;
      } else {
        promptMsg = standardMsg;
      }

      const promptOptions = i18n.__("confirmPhoneStepStandardPromptOptions");

      const promptDetails = {
        prompt: ChoiceFactory.forChannel(
          stepContext.context,
          promptOptions,
          promptMsg
        ),
      };

      return await stepContext.prompt(TEXT_PROMPT, promptDetails);
    } else {
      return await stepContext.next(false);
    }
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
    // Language check
    // Then change LUIZ appID when initial
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

    const closeMsg = i18n.__("getUserBothContactsConfirmMsg");

    switch (intent) {
      // Proceed
      // Not - adding these extra intent checks because of a bug with the french happy path
      case "promptConfirmPhoneYes":
      case "promptConfirmYes":
        console.log("INTENT: ", intent);
        callbackBotDetails.confirmPhoneStep = true;
        const confirmMsg = i18n.__("getUserPhoneConfirmMsg");
        if (callbackBotDetails.preferredEmailAndText === true) {
          await stepContext.context.sendActivity(closeMsg);
        } else {
          await stepContext.context.sendActivity(confirmMsg);
        }
        return await stepContext.endDialog(callbackBotDetails);

      // Don't Proceed
      case "promptConfirmPhoneNo":
      case "promptConfirmNo":
        console.log("INTENT: ", intent);
        callbackBotDetails.confirmPhoneStep = false;

        // await stepContext.context.sendActivity(closeMsg);

        // return await stepContext.endDialog(callbackBotDetails);
        return await stepContext.replaceDialog(
          GET_USER_PHONE_NUMBER_STEP,
          callbackBotDetails
        );
      // Could not understand / None intent
      default: {
        // Catch all
        console.log("NONE INTENT");
        callbackBotDetails.confirmPhoneStep = -1;
        callbackBotDetails.errorCount.confirmPhoneStep++;

        return await stepContext.replaceDialog(
          CONFIRM_PHONE_STEP,
          callbackBotDetails
        );
      }
    }
  }
}
