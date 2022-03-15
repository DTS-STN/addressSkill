import { setLocale } from 'i18n';
import i18n from '../dialogs/locales/i18nConfig';
// In practice you'll probably get this from a service

export const TextBlock = (Locale:string,text:string) => {
  setLocale(Locale);
  return {
   '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
   'type': 'AdaptiveCard',
     'version': '1.0',
     'body': [
     {
       'type': 'TextBlock',
       'text': `${text}`,
       'wrap': true,
       'fontType': 'default'
     }
   ]
 }
};

export const TextBlockWithLink = (text:string, link:string, linkText:string) => {
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
        'title': `${linkText}`,
        'url': `${link}`,
        'spacing' : 'medium',
        'style': 'positive',
        'wrap': true
      }
    ]
  }
};

export const TwoTextBlock = (one:any, two:any) => {
  return {
  '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
  'type': 'AdaptiveCard',
    'version': '1.0',
    'body' : [
      {
        'type': 'TextBlock',
        'text': `${one}`,
        'wrap': true
      },
      {
        'spacing' : 'medium',
        'type': 'TextBlock',
        'text': `${two}`,
        'wrap': true
      }
    ]
  }
};