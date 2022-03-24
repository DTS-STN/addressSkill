import { MessageFactory, CardFactory } from 'botbuilder';

export * from './directdeposit'


// Helper function to attach adaptive card.
export function addACard(schema:any): any {
	let card:any;
	let message:any;

	card = CardFactory.adaptiveCard(schema);
	return message = MessageFactory.attachment(card);
}

// Helper function to return an adaptive card.
export function adaptiveCard(stepContext:any, card:any): any {
	return stepContext.context.sendActivity(addACard(card));
}
