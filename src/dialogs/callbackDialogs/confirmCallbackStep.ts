import {
  TextPrompt,
  ComponentDialog,
  WaterfallDialog,
  ChoiceFactory,
  WaterfallStepContext
} from 'botbuilder-dialogs';

import { LuisRecognizer } from 'botbuilder-ai';

import i18n from '../locales/i18nConfig';
import { CallbackBotDetails } from './callbackBotDetails';
import { CallbackRecognizer } from './callbackRecognizer';

const TEXT_PROMPT = 'TEXT_PROMPT';
export const CONFIRM_CALLBACK_STEP = 'CONFIRM_CALLBACK_STEP';
const CONFIRM_CALLBACK_WATERFALL_STEP = 'CONFIRM_CALLBACK_WATERFALL_STEP';

const MAX_ERROR_COUNT = 3;

export class ConfirmCallbackStep extends ComponentDialog {
  constructor() {
    super(CONFIRM_CALLBACK_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));

    this.addDialog(
      new WaterfallDialog(CONFIRM_CALLBACK_WATERFALL_STEP, [
        this.initialStep.bind(this),
        this.finalStep.bind(this)
      ])
    );

    this.initialDialogId = CONFIRM_CALLBACK_WATERFALL_STEP;
  }
  /**
   * Initial step in the waterfall. This will kick of the ConfirmCallbackStep step
   *
   * If the confirmCallbackStep flag is set in the state machine then we can just
   * end this whole dialog
   *
   * If the confirmCallbackStep flag is set to null then we need to get a response from the user
   *
   * If the user errors out then we're going to set the flag to false and assume they can't / don't
   * want to proceed
   */
  async initialStep(stepContext: WaterfallStepContext) {
    // Get the user details / state machine
    const callbackBotDetails: CallbackBotDetails =
      stepContext.options as CallbackBotDetails;

    // Set the text for the prompt
    const botGreatMsg = i18n.__('botGreatMsg');
    const standardMsg = i18n.__('callbackBotDialogStepStandardMsg');

    // Set the text for the retry prompt
    const retryMsg = i18n.__('confirmCallbackStepRetryMsg');

    // Check if the error count is greater than the max threshold
    if (callbackBotDetails.errorCount.confirmCallbackStep >= MAX_ERROR_COUNT) {
      // Throw the master error flag
      callbackBotDetails.masterError = true;

      // Set master error message to send
      const errorMsg = i18n.__('confirmCallbackStepErrorMsg');

      // Send master error message
      await stepContext.context.sendActivity(errorMsg);

      // End the dialog and pass the updated details state machine
      return await stepContext.endDialog(callbackBotDetails);
    }

    // Check the user state to see if callbackBotDetails.confirmCallbackStep is set to null or -1
    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    if (
      callbackBotDetails.confirmCallbackStep === null ||
      callbackBotDetails.confirmCallbackStep === -1
    ) {
      // Setup the prompt message
      let promptMsg = standardMsg;

      // The current step is an error state
      if (callbackBotDetails.confirmCallbackStep === -1) {
        promptMsg = retryMsg;
      }
      if (callbackBotDetails.confirmCallbackStep === null) {
        await stepContext.context.sendActivity(botGreatMsg);
      }

      const promptOptions: any = i18n.__(
        'confirmCallbackStandardPromptOptions'
      );
      const promptDetails = {
        prompt: ChoiceFactory.forChannel(
          stepContext.context,
          promptOptions,
          promptMsg
        )
      };

      return await stepContext.prompt(TEXT_PROMPT, promptDetails);
    } else {
      return await stepContext.next(false);
    }
  }

  /**
   * Validation step in the waterfall.
   * We use LUIZ to process the prompt reply and then
   * update the state machine (callbackBotDetails)
   */
  async finalStep(stepContext) {
    // Get the user details / state machine
    const callbackDetails = stepContext.options;
    let luisRecognizer;
    let lang = 'en';
    // Language check

    // Then change LUIZ appID
    if (
      stepContext.context.activity.locale.toLowerCase() === 'fr-ca' ||
      stepContext.context.activity.locale.toLowerCase() === 'fr-fr'
    ) {
      console.log('here');
      lang = 'fr';
    }

    // LUIZ Recogniser processing
    luisRecognizer = new CallbackRecognizer(lang);
    // Call prompts recognizer
    const recognizerResult = await luisRecognizer.executeLuisQuery(
      stepContext.context
    );

    // Top intent tell us which cognitive service to use.
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);

    const closeMsg = i18n.__('confirmCallbackStepCloseMsg');

    switch (intent) {
      // Proceed
      case 'promptConfirmYes':
        console.log('INTENT 1: ', intent);
        callbackDetails.confirmCallbackStep = true;

        return await stepContext.endDialog(callbackDetails);

      // Don't Proceed
      case 'promptConfirmNo':
        console.log('INTENT 1 : ', intent);

        await stepContext.context.sendActivity(closeMsg);

        callbackDetails.confirmCallbackStep = false;
        return await stepContext.endDialog(callbackDetails);

      // Could not understand / None intent
      default: {
        // Catch all
        console.log('NONE INTENT 1');
        callbackDetails.confirmCallbackStep = -1;
        callbackDetails.errorCount.confirmCallbackStep++;

        return await stepContext.replaceDialog(
          CONFIRM_CALLBACK_STEP,
          callbackDetails
        );
      }
    }
  }
}
