import i18n, { setLocale } from '../dialogs/locales/i18nConfig';

// In practice you'll probably get this from a service
export const directdeposit = (locale: string) => {
    setLocale(locale);
    return {
        "type": "AdaptiveCard",
        "body": [
            {
                "type": "TextBlock",
                "wrap": true,
                "text": `${i18n.__('DirectDepositAdaptiveText1')}`
            },
            {
                "type": "TextBlock",
                "wrap": true,
                "text": `${i18n.__('DirectDepositAdaptiveTransitText')}`
            },
            {
                "type": "TextBlock",
                "wrap": true,
                "text": `${i18n.__('DirectDepositAdaptiveInstitutionText')}`
            },
            {
                "type": "TextBlock",
                "wrap": true,
                "text": `${i18n.__('DirectDepositAdaptiveAccountText')}`
            }
        ],
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.0"
    }
}

export const directdepositcheque = (locale: string) => {
    setLocale(locale);
    return {
        "type": "AdaptiveCard",
        "body": [

            {
                "type": "TextBlock",
                "wrap": true,
                "text": `${i18n.__('DirectDepositAdaptiveAllText')}`
            },
            {
                "type": "TextBlock",
                "wrap": true,
                "text": `${i18n.__('DirectDepositAdaptiveChequeText')}`
            },
            {
                "type": "Image",
                "url": "file:///C:/Users/MR454UN/OneDrive%20-%20EY/Desktop/Chat%20Bot%20Final/aobot-core%20(1)/aobot-core/src/public/cheque%20a.svg"
            }
        ],
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.0"
    }
}


