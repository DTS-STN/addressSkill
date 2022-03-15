import { ActivityTypes, EndOfConversationCodes } from "botbuilder";
import {
    Choice, ChoiceFactory, ChoicePrompt, ComponentDialog, DialogTurnResult, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from "botbuilder-dialogs";

import i18n from "../../locales/i18nConfig";

const TEXT_PROMPT = "TEXT_PROMPT";
const CHOICE_PROMPT = "CHOICE_PROMPT";
export const FEED_BACK_STEP = "FEED_BACK_STEP";
const FEED_BACK_WATERFALL_STEP = "FEED_BACK_WATERFALL_STEP";

export class FeedBackStep extends ComponentDialog {
    constructor() {
        super(FEED_BACK_STEP);

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT, this.CustomChoiceValidator))
            .addDialog(new WaterfallDialog(FEED_BACK_WATERFALL_STEP, [
                this.feedbackStep.bind(this),
                this.finalStep.bind(this)

            ]));

        this.initialDialogId = FEED_BACK_WATERFALL_STEP;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    /**
   * Initial step in the waterfall. This will prompts service rate card choices to the user.
   */
    async feedbackStep(stepContext:WaterfallStepContext): Promise<DialogTurnResult> {
                const promptText = i18n.__("continueAndFeedRating");
                let choices = Array<string>();
                choices = i18n.__("continueAndFeedRatingChoices");
                return await stepContext.prompt(CHOICE_PROMPT, {
                    prompt: promptText,
                    choices: ChoiceFactory.toChoices(choices)
                });
    }
   /**
   * This is the final step in waterfall.bot displays thank you message to the user end of the bot.
   */
    async finalStep(stepContext) {
            await stepContext.context.sendActivity(i18n.__("continueAndFeedExcellent"));
            return await stepContext.endDialog(this.id);
    }
}
