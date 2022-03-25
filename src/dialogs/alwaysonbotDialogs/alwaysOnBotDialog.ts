import { ActivityTypes, EndOfConversationCodes, StatePropertyAccessor, TurnContext } from 'botbuilder';
import {
    ChoicePrompt, ComponentDialog,
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus, PromptValidatorContext, TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { Choice } from 'botbuilder-dialogs/src/choices/findChoices';
import { CommonPromptValidatorModel } from '../../models/commonPromptValidatorModel';
import { CommonChoiceCheckStep } from '../alwaysonbotDialogs/Common/commonChoiceCheckStep';
import { FeedBackStep, FEED_BACK_STEP } from '../alwaysonbotDialogs/Common/feedBackStep';
import { GET_ADDRESS_STEP } from './UpdateProfile/UpdateAddress/getAddressesStep';
import { AddressDetails } from './UpdateProfile/UpdateAddress/addressDetails';
import { UpdateAddressStep, UPDATE_ADDRESS_STEP } from './UpdateProfile/UpdateAddress/updateAddressStep';
import { UpdateProfileStep } from './UpdateProfile/updateProfileStep';


const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const ALWAYS_ON_BOT_WATERFALL_DIALOG = 'ALWAYS_ON_BOT_WATERFALL_DIALOG';
export const ALWAYS_ON_BOT_DIALOG = 'ALWAYS_ON_BOT_DIALOG';
export class AlwaysOnBotDialog extends ComponentDialog {

    constructor() {
        super(ALWAYS_ON_BOT_DIALOG);

        if (!UpdateProfileStep) throw new Error('[MainDialog]: Missing parameter "updateProfileDialog" is required');

        // Define the main dialog and its related components.
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new UpdateProfileStep());
        this.addDialog(new UpdateAddressStep())
        this.addDialog(new FeedBackStep());
        this.addDialog(new CommonChoiceCheckStep());
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT,this.CustomChoiceValidator));
        this.addDialog(new WaterfallDialog(ALWAYS_ON_BOT_WATERFALL_DIALOG, [
                this.introStep.bind(this),
            ]));

        this.initialDialogId = ALWAYS_ON_BOT_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {TurnContext} context
     */
    // public async run(context: TurnContext, accessor: StatePropertyAccessor<DialogState>) {
    //     const dialogSet = new DialogSet(accessor);
    //     dialogSet.add(this);
    //     const dialogContext = await dialogSet.createContext(context);
    //     const results = await dialogContext.continueDialog();
    //     if (results.status === DialogTurnStatus.empty) {
    //         await dialogContext.beginDialog(this.id);
    //     }
    // }

    public async run(context: TurnContext, accessor: StatePropertyAccessor<DialogState>) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        console.log(results);
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        } else if (results.status === DialogTurnStatus.complete && results.result === GET_ADDRESS_STEP) {
            await context.sendActivity({
                type: ActivityTypes.EndOfConversation,
                code: EndOfConversationCodes.CompletedSuccessfully
            });
        } else if (results.status === DialogTurnStatus.complete && results.result === UPDATE_ADDRESS_STEP){
            await context.sendActivity({
                type: ActivityTypes.EndOfConversation,
                code: EndOfConversationCodes.CompletedSuccessfully
            });
        } else if (results.status === DialogTurnStatus.complete){
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
        const addressDetails = new AddressDetails();
        return await stepContext.replaceDialog(UPDATE_ADDRESS_STEP, addressDetails);
}
    }



