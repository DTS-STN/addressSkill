import { ActivityTypes, EndOfConversationCodes, StatePropertyAccessor, TurnContext } from "botbuilder";
import {
    ChoicePrompt, ComponentDialog,
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from "botbuilder-dialogs";
import { Choice } from "../../../node_modules/botbuilder-dialogs/src/choices/findChoices";
import { FEED_BACK_STEP } from "./Common/feedBackStep";
import { UpdateProfileStep, UPDATE_PROFILE_STEP } from "./UpdateProfile/updateProfileStep";


export const ALWAYS_ON_BOT_DIALOG_STEP = "ALWAYS_ON_BOT_DIALOG_STEP";

export class AlwaysOnBotDialog extends ComponentDialog {

    constructor() {
        super(ALWAYS_ON_BOT_DIALOG_STEP);

        if (!UpdateProfileStep) throw new Error("[MainDialog]: Missing parameter \"updateProfileDialog\" is required");

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt("TEXT_PROMPT"))
            .addDialog(new UpdateProfileStep())
            .addDialog(new WaterfallDialog(ALWAYS_ON_BOT_DIALOG_STEP, [
                this.introStep.bind(this)
            ]));

        this.initialDialogId = ALWAYS_ON_BOT_DIALOG_STEP;
    }

    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {TurnContext} context
     */
    public async run(context: TurnContext, accessor: StatePropertyAccessor<DialogState>) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        console.log(results);
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        } else if (results.status === DialogTurnStatus.complete && results.result === FEED_BACK_STEP) {
            await context.sendActivity({
                type: ActivityTypes.EndOfConversation,
                code: EndOfConversationCodes.CompletedSuccessfully
            });
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */

    // validates all the prompts
     private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }

    /**
     * Passing intents list related to main dialog.
     * Passing master error count to common choice dialog.
     * Passing current dialog name to common choice dialog.
     */
    private async introStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        
        return await stepContext.replaceDialog(UPDATE_PROFILE_STEP, UpdateProfileStep);
    }
}
   


