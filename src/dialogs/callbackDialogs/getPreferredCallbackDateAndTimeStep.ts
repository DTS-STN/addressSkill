import {
  TextPrompt,
  ComponentDialog,
  WaterfallDialog,
  ChoiceFactory,
  WaterfallStepContext
} from 'botbuilder-dialogs';

import { LuisRecognizer } from 'botbuilder-ai';
import { CallbackBotDetails } from './callbackBotDetails';
// This is for the i18n stuff
import i18n from '../locales/i18nConfig';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
export const GET_PREFERRED_CALLBACK_DATE_AND_TIME_STEP =
  'GET_PREFERRED_CALLBACK_DATE_AND_TIME_STEP';
const GET_PREFERRED_CALLBACK_DATE_AND_TIME_WATERFALL_STEP =
  'GET_PREFERRED_CALLBACK_DATE_AND_TIME_WATERFALL_STEP';

const MAX_ERROR_COUNT = 3;

export class GetPreferredCallbackDateAndTimeStep extends ComponentDialog {
  constructor() {
    super(GET_PREFERRED_CALLBACK_DATE_AND_TIME_STEP);

    // Add a text prompt to the dialog stack
    this.addDialog(new TextPrompt(TEXT_PROMPT));

    this.addDialog(
      new WaterfallDialog(GET_PREFERRED_CALLBACK_DATE_AND_TIME_WATERFALL_STEP, [
        this.initialStep.bind(this),
        this.dateStep.bind(this),
        this.timeStep.bind(this),
        this.finalStep.bind(this)
      ])
    );

    this.initialDialogId = GET_PREFERRED_CALLBACK_DATE_AND_TIME_WATERFALL_STEP;
  }

  /**
   * Initial step in the waterfall. This will kick of the ConfirmLookIntoStep step
   *
   * If the confirmSendEmailStep flag is set in the state machine then we can just
   * end this whole dialog
   *
   * If the confirmLookIntoStep flag is set to null then we need to get a response from the user
   *
   * If the user errors out then we're going to set the flag to false and assume they can't / don't
   * want to proceed
   */
  async initialStep(stepContext) {
    // Get the user details / state machine
    const callbackBotDetails = stepContext.options;

    // Set the text for the prompt
    const standardMsg = i18n.__('getPreferredCallbackDateAndTimeStepPromptMsg');

    // Set the text for the retry prompt
    const retryMsg = i18n.__('getPreferredCallbackDateAndTimeStepRetryMsg');

    // Check if the error count is greater than the max threshold
    if (
      callbackBotDetails.errorCount.getPreferredCallbackDateAndTimeStep >=
      MAX_ERROR_COUNT
    ) {
      // Throw the master error flag
      callbackBotDetails.masterError = true;
      // End the dialog and pass the updated details state machine
      return await stepContext.endDialog(callbackBotDetails);
    }

    // Check the user state to see if callbackBotDetails.confirm_look_into_step is set to null or -1
    // If it is in the error state (-1) or or is set to null prompt the user
    // If it is false the user does not want to proceed
    if (
      callbackBotDetails.getPreferredCallbackDateAndTimeStep === null ||
      callbackBotDetails.getPreferredMethodOfContactStep === -1
    ) {
      // Setup the prompt message
      let promptMsg = '';

      // The current step is an error state
      if (callbackBotDetails.getPreferredCallbackDateAndTimeStep === -1) {
        promptMsg = retryMsg;
      } else {
        promptMsg = standardMsg;
      }

      // Set the options for the quick reply buttons
      const promptOptions: any = i18n.__(
        'getPreferredCallbackDateAndTimeStepStandardPromptOptions'
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

  async dateStep(stepContext: WaterfallStepContext<CallbackBotDetails>) {
    // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
    // Running a prompt here means the next WaterfallStep will be run when the users response is received.
    return await stepContext.prompt(CHOICE_PROMPT, {
      choices: ChoiceFactory.toChoices([
        ' Sep 1 2021',
        'Spe 4 2021',
        'Sep 19 2021'
      ]),
      prompt: 'Please choose your prefer date.'
    });
  }

  async timeStep(stepContext: WaterfallStepContext<CallbackBotDetails>) {
    const callbackBotDetails = stepContext.options;
    if (stepContext.result !== null) {
      callbackBotDetails.date = stepContext.result.value;
      // User said "yes" so we will be prompting for the age.
      // WaterfallStep always finishes with the end of the Waterfall or with another dialog, here it is a Prompt Dialog.
      const promptOptions = {
        choices: ChoiceFactory.toChoices(['10:00 AM', '12:30PM', '1:30PM']),
        prompt: 'Please choose the available time .',
        retryPrompt: 'The value entered must be in the list.'
      };

      return await stepContext.prompt(CHOICE_PROMPT, promptOptions);
    } else {
      // User said "no" so we will skip the next step. Give -1 as the age.
      return await stepContext.next(-1);
    }
  }
  /**
   * Validation step in the waterfall.
   * We use LUIZ to process the prompt reply and then
   * update the state machine (callbackBotDetails)
   */
  async finalStep(stepContext: WaterfallStepContext<CallbackBotDetails>) {
    // Get the user details / state machine
    const callbackBotDetails = stepContext.options;
    callbackBotDetails.time = stepContext.result.value;
    // Language check
    let applicationId = '';
    let endpointKey = '';
    let endpoint = '';

    // Then change LUIS appID
    if (
      stepContext.context.activity.locale.toLowerCase() === 'fr-ca' ||
      stepContext.context.activity.locale.toLowerCase() === 'fr-fr'
    ) {
      applicationId = process.env.LuisAppIdFR;
      endpointKey = process.env.LuisAPIKeyFR;
      endpoint = `https://${process.env.LuisAPIHostNameFR}.api.cognitive.microsoft.com`;
    } else {
      applicationId = process.env.LuisAppIdEN;
      endpointKey = process.env.LuisAPIKeyEN;
      endpoint = `https://${process.env.LuisAPIHostNameEN}.api.cognitive.microsoft.com`;
    }

    // LUIS Recogniser processing
    /* const recognizer = new LuisRecognizer({
            applicationId: applicationId,
            endpointKey: endpointKey,
            endpoint: endpoint
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

*/
    // Call prompts recognizer
    //  const recognizerResult = await recognizer.recognize(stepContext.context);
    // Setup the possible messages that could go out
    const sendDateAndTimeMsg = i18n.__(
      'getPreferredCallbackDateAndTimeStepConfirmMsg'
    );

    // Top intent tell us which cognitive service to use.
    // const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.50);
    // for demo purpose, right now hard code
    const intent: string = 'dateTime';
    switch (intent) {
      // Proceed with Email
      case 'dateTime':
        console.log('INTENT: ', intent);
        callbackBotDetails.getPreferredCallbackDateAndTimeStep = true;

        await stepContext.context.sendActivity(sendDateAndTimeMsg);

        return await stepContext.endDialog(callbackBotDetails);

      // Could not understand / None intent
      default: {
        // Catch all
        console.log('NONE INTENT');
        callbackBotDetails.getPreferredCallbackDateAndTimeStep = -1;
        callbackBotDetails.errorCount.getPreferredCallbackDateAndTimeStep++;

        return await stepContext.replaceDialog(
          GET_PREFERRED_CALLBACK_DATE_AND_TIME_STEP,
          callbackBotDetails
        );
      }
    }
  }
}
