const { I18n } = require('i18n');
import { join } from 'path';


// Initialise the local
// Configure i18n
const i18n = new I18n();
i18n.configure({
  locales: ['en', 'fr'],
  directory: join(__dirname),
  defaultLocale: 'en'
});


export const setLocale = (locale:any) => {
  console.log('language/locale: ', locale);
  if (locale.toLowerCase() === 'fr-ca'
    || locale.toLowerCase() === 'fr-fr'
    || locale.toLowerCase() === 'fr') {
    i18n.setLocale('fr');
  } else {
    i18n.setLocale('en');
  }
}

export default i18n;
