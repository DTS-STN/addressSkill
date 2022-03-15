import { LuisRecognizer } from 'botbuilder-ai';
import {
  TextPrompt,
  ComponentDialog,
  WaterfallDialog,
  ChoiceFactory,
  WaterfallStepContext
} from 'botbuilder-dialogs';
import { CallbackBotDetails } from './callbackBotDetails';

import i18n from '../locales/i18nConfig';

const TEXT_PROMPT = 'TEXT_PROMPT';
export const CONFIRM_AUTH_WORD_STEP = 'CONFIRM_AUTH_WORD_STEP';
const CONFIRM_AUTH_WORD_WATERFALL_STEP = 'CONFIRM_AUTH_WORD_WATERFALL_STEP';

const MAX_ERROR_COUNT = 3;

export class ConfirmAuthWordStep extends ComponentDialog {
  constructor() {
    super(CONFIRM_AUTH_WORD_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));

    this.addDialog(
      new WaterfallDialog(CONFIRM_AUTH_WORD_WATERFALL_STEP, [
        this.initialStep.bind(this),
        this.finalStep.bind(this)
      ])
    );

    this.initialDialogId = CONFIRM_AUTH_WORD_WATERFALL_STEP;
  }

  /**
   * Kick off the dialog to display callback details, include the secure word
   *
   */
  async initialStep(stepContext: WaterfallStepContext) {
    // Get the user details / state machine
    const callbackBotDetails = stepContext.options as CallbackBotDetails;

    // Set the text for the prompt
    const standardMsg = i18n.__('confirmAuthWordStepStandardMsg');
    const standardMsgContinue = i18n.__('confirmAuthStepMsg');
    const standardMsgEnd = i18n.__('confirmAuthWordMsg');

    const retryMsg = i18n.__('confirmAuthWordStepRetryMsg');
    // Check if the error count is greater than the max threshold
    if (callbackBotDetails.errorCount.confirmAuthWordStep >= MAX_ERROR_COUNT) {
      // Throw the master error flag
      callbackBotDetails.masterError = true;
      // Set master error message to send
      const errorMsg = i18n.__('masterErrorMsg');

      // Send master error message
      await stepContext.context.sendActivity(errorMsg);

      // End the dialog and pass the updated details state machine
      return await stepContext.endDialog(callbackBotDetails);
    }

    // Check the user state to see if callbackBotDetails.confirmAuthWordStep is set to null or -1
    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    if (
      callbackBotDetails.confirmAuthWordStep === null ||
      callbackBotDetails.confirmAuthWordStep === -1
    ) {
      const authCode = this.generateAuthCode();
      callbackBotDetails.authCode = authCode;
      const standMsg = standardMsg + ' ' + authCode;
      // Setup the prompt message
      await stepContext.context.sendActivity(standMsg);
      await stepContext.context.sendActivity(standardMsgContinue);
      await stepContext.context.sendActivity(standardMsgEnd);
      const goodbyeMsg = i18n.__('callbackGoodByeGreetingMsg');
      let promptMsg = '';
      // The current step is an error state
      if (callbackBotDetails.confirmAuthWordStep === -1) {
        promptMsg = retryMsg;
      } else {
        promptMsg = goodbyeMsg;
      }
      const promptOptions = i18n.__(
        'callbackGoodByeGreetingStandardPromptOptions'
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
   *
   *
   */
  async finalStep(stepContext: WaterfallStepContext) {
    // Get the user details / state machine
    const callbackBotDetails = stepContext.options as CallbackBotDetails;

    // Language check
    let applicationId = '';
    let endpointKey = '';
    let endpoint = '';

    // Then change LUIZ appID
    if (
      stepContext.context.activity.locale.toLowerCase() === 'fr-ca' ||
      stepContext.context.activity.locale.toLowerCase() === 'fr-fr'
    ) {
      applicationId = process.env.LuisCallbackAppIdFR;
      endpointKey = process.env.LuisCallbackAPIKeyFR;
      endpoint = `https://${process.env.LuisCallbackAPIHostNameFR}.api.cognitive.microsoft.com`;
    } else {
      applicationId = process.env.LuisCallbackAppIdEN;
      endpointKey = process.env.LuisCallbackAPIKeyEN;
      endpoint = `https://${process.env.LuisCallbackAPIHostNameEN}.api.cognitive.microsoft.com`;
    }

    // LUIZ Recogniser processing
    const recognizer = new LuisRecognizer(
      {
        applicationId,
        endpointKey,
        endpoint
      },
      {
        includeAllIntents: true,
        includeInstanceData: true
      },
      true
    );

    // Call prompts recognizer
    const recognizerResult = await recognizer.recognize(stepContext.context);

    // Top intent tell us which cognitive service to use.
    const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);
    // Result has come through
    switch (intent) {
      case 'promptConfirmYes':
        const confirmMsg = i18n.__('callbackGoodByeGreetingMsg');
        callbackBotDetails.confirmAuthWordStep = true;
        await stepContext.context.sendActivity(confirmMsg);

        return await stepContext.endDialog(callbackBotDetails);

      case 'promptConfirmNo':
        const closeMsg = i18n.__('callbackCloseMsg');
        callbackBotDetails.confirmAuthWordStep = true;
        await stepContext.context.sendActivity(closeMsg);

        return await stepContext.endDialog(callbackBotDetails);
      // No result provided
      case 'None':
        callbackBotDetails.confirmAuthWordStep = -1;
        callbackBotDetails.errorCount.confirmAuthWordStep++;

        return await stepContext.replaceDialog(
          CONFIRM_AUTH_WORD_STEP,
          callbackBotDetails
        );
    }
  }

  private generateAuthCode() {
    return Math.floor(1000 + Math.random() * 9000);
  }
}
