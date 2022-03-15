import i18n, { setLocale } from '../dialogs/locales/i18nConfig';
// In practice you'll probably get this from a service
export const declaration = (transitNumber:string, accountNumber:string, institutionNumber:string, loacle:string) => {
    setLocale(loacle);
    return {
        "type": "AdaptiveCard",
        "body": [
            {
                "type": "TextBlock",
                "wrap": true,
                "text": `${i18n.__('DirectDepositAdaptiveText2')}`
            },
            {
                "type": "FactSet",
                "facts": [
                    {
                        "title": "Transit Number",
                        "value": `${transitNumber}`
                    },
                    {
                        "title": "Account Number",
                        "value": `${accountNumber}`
                    },
                    {
                        "title": "Institution Number",
                        "value": `${institutionNumber}`
                    }
                    
                ]
            }
        ],
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.0"
    }
}