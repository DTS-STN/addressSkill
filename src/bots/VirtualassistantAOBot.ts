// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, BotState, ConversationState, StatePropertyAccessor, UserState } from 'botbuilder';
import { Dialog, DialogSet, DialogState } from 'botbuilder-dialogs';

import { ALWAYS_ON_BOT_DIALOG_STEP,AlwaysOnBotDialog } from '../dialogs/alwaysonbotDialogs/alwaysOnBotDialog';
import i18n, { setLocale } from '../dialogs/locales/i18nconfig';

export class VirtualassistantAOBot extends ActivityHandler {
    private conversationState: BotState;
    private userState: BotState;
    private dialog: Dialog;
    private dialogState: StatePropertyAccessor<DialogState>;

    /**
     * @param {BotState} conversationState
     * @param {BotState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState: BotState, userState: BotState, dialog: Dialog) {
        super();
        if (!conversationState) {
            throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        }
        if (!userState) {
            throw new Error('[DialogBot]: Missing parameter. userState is required');
        }
        if (!dialog) {
            throw new Error('[DialogBot]: Missing parameter. dialog is required');
        }

        this.conversationState = conversationState as ConversationState;
        this.userState = userState as UserState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty<DialogState>('DialogState');

        this.onMembersAdded(async (context, next) => {
            console.log('MEMBER ADDED:Running dialog with Message Activity.');
            const membersAdded = context.activity.membersAdded;
            setLocale(context.activity.locale);
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await (dialog as AlwaysOnBotDialog).run(context, conversationState.createProperty<DialogState>('DialogState'));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMessage(async (context, next) => {
            console.log('Running dialog with Message Activity.');
            setLocale(context.activity.locale);
            // Run the Dialog with the new message Activity.
            await (this.dialog as AlwaysOnBotDialog).run(context, this.dialogState);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);

            // const dialogSet = new DialogSet(this.dialogState);
            // dialogSet.add(this.dialog);
            // const dialogContext = await dialogSet.createContext(context);
            // console.log();

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onEndOfConversation(async (context, next) => {
            // This will be called if the root bot is ending the conversation.  Sending additional messages should be
            // avoided as the conversation may have been deleted.
            // Perform cleanup of resources if needed.

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}
