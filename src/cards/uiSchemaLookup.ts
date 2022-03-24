import i18n from '../dialogs/locales/i18nConfig';
// In practice you'll probably get this from a service

export const lookupUpdateSchema = (reason:any) => {
  return {
   '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
   'type': 'AdaptiveCard',
     'version': '1.0',
     'body': [
      {
       'type': 'TextBlock',
       'text': `${i18n.__('unblock_lookup_update_msg')}`,
       'wrap': true,
       'fontType': 'default'
      },
      {
       'type': 'RichTextBlock',
       'wrap': true,
       'fontType': 'default',
       'inlines': [
        {
          'type': 'TextRun',
          'text': `${i18n.__('unblock_lookup_update_details')}`
        },
        {
          'type': 'TextRun',
          'text': ` ${reason}`,
          'weight': 'bolder'
        },
        {
          'type': 'TextRun',
          'text': `.`
        }
      ]
     }
   ]
 }
};

