import i18n,{ setLocale } from '../dialogs/locales/i18nConfig';

export const  callbackCard= (locale:string,text:string) => {
    setLocale(locale);
    return {
      '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
      'type': 'AdaptiveCard',
      'version': '1.0',
      'body': [
        {
          'type': 'TextBlock',
          'text': `${text}`,
          'wrap': true
        }
      ],
      'actions': [
        {
          'type': 'Action.OpenUrl',
          'title': `${i18n.__('MasterErrorMessageLink')}`,
          'url': 'https://en.wikipedia.org/wiki/Help_desk',
          'spacing' : 'medium',
          'style': 'positive',
          'wrap': true
        }
      ]
    }
  };