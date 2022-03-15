import { LuisRecognizer } from 'botbuilder-ai';

export const LUISAlwaysOnBotSetup = (stepContext: any) => {

    // Luis Application Settings
    let applicationId: string;
    let endpointKey: string;
    let endpoint: string;
    let recognizer: any;
    let locale = 'en';

    if (stepContext.context.activity.locale)
    {
        locale = stepContext.context.activity.locale.toLowerCase();
    }
    // Then change LUIZ appID
    if (
        locale.toLowerCase() === 'fr-ca' ||
        locale.toLowerCase() === 'fr-fr' ||
        locale.toLowerCase() === 'fr'
    ) {
        applicationId = process.env.LuisAppIdFR;
        endpointKey = process.env.LuisAPIKeyFR;
        endpoint = `https://${process.env.LuisAPIHostNameFR}.cognitiveservices.azure.com`;

    } else {
        applicationId = process.env.LuisAppIdEN;
        endpointKey = process.env.LuisAPIKeyEN;
        endpoint = `https://${process.env.LuisAPIHostNameEN}.cognitiveservices.azure.com`;
    }

    // LUIZ Recogniser processing
    recognizer = new LuisRecognizer(
        {
            'applicationId': `${applicationId}`,
            'endpointKey': `${endpointKey}`,
            'endpoint': `${endpoint}`
        },
        {
            includeAllIntents: true,
            includeInstanceData: true
        },
        true
    );

    return recognizer;

}