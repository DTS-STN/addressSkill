import { LuisRecognizer } from 'botbuilder-ai';
import { Choice, ChoiceFactory, ChoicePrompt, ComponentDialog, DialogTurnResult, ListStyle, PromptValidatorContext, TextPrompt, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import { CommonPromptValidatorModel } from '../../../../models/commonPromptValidatorModel';
import { AddressAPI } from '../../../../utils/addressAPI';
import { ContinueAndFeedbackStep } from '../../Common/continueAndFeedbackStep';
import i18n from '../../../locales/i18nConfig';
import { LUISAlwaysOnBotSetup } from '../../alwaysOnBotRecognizer';
import { CommonCallBackStep, COMMON_CALL_BACK_STEP } from '../commonCallBackStep';
import { AddressDetails } from './addressDetails';
import { ChoiceCheckUpdateAddressStep, CHOICE_CHECK_UPDATE_ADDRESS_STEP } from './choiceCheckUpdateAddressStep';
import { UPDATE_ADDRESS_STEP } from './updateAddressStep';
import { ValidateNumberStep, VALIDATE_NUMBER_STEP } from './validateNumberStep';
import { CommonChoiceCheckStepMultipleAddresses, COMMON_CHOICE_CHECK_MULTIPLE_ADDRESSES_STEP } from "./choiceCheckStepMultipleAddressStep";

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

let fullAddress: string;
let addressNotFoundAPI:string = '';
let isCallBackPassed:boolean = false;
let isValidPostalCode:boolean = false;
let manyAddresses:string[] = new Array();

export const GET_ADDRESS_STEP = 'GET_ADDRESS_STEP';
const GET_ADDRESS_WATERFALL_STEP = 'GET_ADDRESS_WATERFALL_STEP';

// Define the main dialog and its related components.
export class GetAddressesStep extends ComponentDialog {
    constructor() {
        super(GET_ADDRESS_STEP);
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT))
            .addDialog(new ContinueAndFeedbackStep())
            .addDialog(new ChoiceCheckUpdateAddressStep())
            .addDialog(new ValidateNumberStep())
            .addDialog(new CommonCallBackStep())
            .addDialog(new CommonChoiceCheckStepMultipleAddresses())
            .addDialog(new WaterfallDialog(GET_ADDRESS_WATERFALL_STEP, [
                this.initialStep.bind(this),
                this.continueStep.bind(this),
                this.checkSelectedAddressStep.bind(this),
                this.streetNameStep.bind(this),
                this.streetNumberStep.bind(this),
                this.streetAddressUnitStep.bind(this),
                this.finalStep.bind(this)
            ]));
        this.initialDialogId = GET_ADDRESS_WATERFALL_STEP;
    }

    private async CustomChoiceValidator(promptContext: PromptValidatorContext<Choice>) {
        return true;
    }
    /**
     * First step in the waterfall dialog. Prompts the user for enter the postal code of new address.
     */
     async initialStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
        return await stepContext.prompt(TEXT_PROMPT, i18n.__('updateAddressPostalCodePrompt'));
    }

   /**
    * Continue step in the waterfall.Once User Key-In the postal code then bot will try to get the full address from Address API
    * Call getAddress() Method to make a API call
    */
    async continueStep(stepContext: WaterfallStepContext): Promise<DialogTurnResult> {
                const addressDetails = stepContext.options as AddressDetails;
                addressDetails.PostalCode=stepContext.context.activity.text;
                addressDetails.masterError = false;
                addressDetails.currentStep = '';
                const addressAPI = new AddressAPI();

                let addressResults;
                try{
                    const data = await addressAPI.getAddress(stepContext.context.activity.text,i18n.__('APILanguage'),i18n.__('subscriptionKey'));
                    let addressMatches;
                    isValidPostalCode = false;
                    addressNotFoundAPI = '';
                    isValidPostalCode = this.validatePostalCode(stepContext.context.activity.text.toUpperCase());
                    addressResults = data['wsaddr:SearchResults'];
                    const addressRecordInfo = addressResults['wsaddr:Information'];
                    let isStreetNumberRequired:boolean = false;
                    addressNotFoundAPI = addressRecordInfo['nc:MessageText'];
                    if(Number(addressRecordInfo['nc:MessageText'])>1)
                    {
                        isStreetNumberRequired = true;
                    }
                     addressMatches = addressResults['wsaddr:AddressMatches'];
                    const addressCategoryText = addressMatches[0]['nc:AddressCategoryText'];
                    if(addressCategoryText === 'RuralLockBox'){
                    const cityName = addressMatches[0]['nc:AddressCityName'];
                    const province = addressMatches[0]['can:ProvinceCode'];
                    const addressPostalCode = addressMatches[0]['nc:AddressPostalCode'];
                    const streetMinText = addressMatches[0]['wsaddr:LockBoxNumberMinimumText'];
                    const streetMaxText = addressMatches[0]['wsaddr:LockBoxNumberMaximumText'];
                    const streetCategoryCode = addressMatches[0]['can:StreetCategoryCode'];
                    const streetName= addressMatches[0]['nc:StreetName'];
                    const deliveryInstallationDescritpion = addressMatches[0]['wsaddr:DeliveryInstallationDescription'];
                    const deliveryInstallationQualifierName = addressMatches[0]['wsaddr:DeliveryInstallationQualifierName'];
                    const deliveryInstallationAreaName = addressMatches[0]['wsaddr:DeliveryInstallationAreaName'];
                    fullAddress =  deliveryInstallationDescritpion+ ' ' + deliveryInstallationQualifierName+ ' ' + deliveryInstallationAreaName;
                    addressDetails.FullAddress = this.getSentence(fullAddress) + ' '+ String(province).toUpperCase()+ ' ' + String(addressDetails.PostalCode).toUpperCase();
                    addressDetails.AddressType = 'PO BOX';

                    addressDetails.promptMessage = i18n.__('PoNumberPromptMessage');
                    addressDetails.promptRetryMessage = i18n.__('PoNumberPromptRetryMessage');
                    return await stepContext.beginDialog(VALIDATE_NUMBER_STEP, addressDetails);
                }
                else{
                    addressResults = data['wsaddr:SearchResults'];
                     addressMatches = addressResults['wsaddr:AddressMatches'];
                    manyAddresses = [];
                    if(isStreetNumberRequired){
                        addressDetails.AddressType = 'MULTIPLE';
                        for (let i=0; i < addressMatches.length; i++) {
                            fullAddress = this.getSentence(addressMatches[i]['nc:StreetName'])+ ' ' + this.getSentence(addressMatches[i]['can:StreetCategoryCode'])+ ' ' + this.getSentence(addressMatches[i]['nc:AddressCityName'])+ ' ' + addressMatches[i]['can:ProvinceCode']+ ' ' +  String(addressDetails.PostalCode).toUpperCase();

                            if(!manyAddresses.includes(fullAddress)){
                            manyAddresses.push(fullAddress);
                            }
                        }
                        const promptmsg = i18n.__('MoreStreetNumbersPrompt');
                        manyAddresses.push(i18n.__('CannotFindMyAddress'));
                        if(manyAddresses.length>4){
                            addressDetails.manyAddresses = manyAddresses;
                            return await stepContext.next();
                        }
                        else{
                            let commonPromptValidatorModel = new CommonPromptValidatorModel(
                                manyAddresses,
                                Number(i18n.__("MaxRetryCount")),
                                "MultpleAddresses",promptmsg
                            );
                            return await stepContext.beginDialog(COMMON_CHOICE_CHECK_MULTIPLE_ADDRESSES_STEP, commonPromptValidatorModel);
                        }
                    }
                    else{
                    const cityName = addressMatches[0]['nc:AddressCityName'];
                    const province = addressMatches[0]['can:ProvinceCode'];
                    const addressPostalCode = addressMatches[0]['nc:AddressPostalCode'];
                    const streetMinText = addressMatches[0]['wsaddr:StreetNumberMinimumText'];
                    const streetMaxText = addressMatches[0]['wsaddr:StreetNumberMaximumText'];
                    const streetCategoryCode = addressMatches[0]['can:StreetCategoryCode'];
                    const streetName= addressMatches[0]['nc:StreetName'];
                    if(streetMinText === streetMaxText){
                        fullAddress = streetMinText + ' ' + streetName+ ' ' + streetCategoryCode+ ' ' + cityName;
                    }
                    else{
                        fullAddress = streetName+ ' ' + streetCategoryCode+ ' ' + cityName;
                    }
                    addressDetails.FullAddress = this.getSentence(fullAddress) + ' ' +  String(province).toUpperCase() + ' ' + String(addressDetails.PostalCode).toUpperCase();
                    addressDetails.AddressType = '';

                    if(streetMinText === streetMaxText){
                        addressDetails.promptMessage = i18n.__('UnitORApartmentPrompt');
                        addressDetails.promptRetryMessage = i18n.__('UnitORApartmentRetryPrompt');
                        return await stepContext.beginDialog(VALIDATE_NUMBER_STEP, addressDetails);
                      }
                      else{
                        addressDetails.promptMessage = i18n.__('NewStreetNumberPrompt');
                        addressDetails.promptRetryMessage = i18n.__('NewStreetNumberRetryPrompt');
                        return await stepContext.beginDialog(VALIDATE_NUMBER_STEP, addressDetails);
                      }
                  }
                }
           }catch(e){
                addressDetails.errorCount.getAddressesStep++;
                addressDetails.masterError = true;
                return await stepContext.next();
          }
    }
    /**
     * Check selected address step in the waterfall.
     * if we found more than one street addresses then bot asks the street number to the user.
     * if any errors found in previous step bot repeats this step until it reaches the max error count
     */
    private async checkSelectedAddressStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
        const addressDetails = stepContext.options;
        if (addressDetails.AddressType === 'MULTIPLE') {
            addressDetails.currentStep = 'street number';
            if(addressDetails.manyAddresses === null){
                addressDetails.FullAddress =  stepContext.context.activity.text;
            if(stepContext.context.activity.text === i18n.__('CannotFindMyAddress')){
                await stepContext.context.sendActivity(i18n.__('StreetAddressNotFoundMessage'));
                const commonPromptValidatorModel = new CommonPromptValidatorModel(
                    ['YesIWantToRequestCall', 'NoNotForNow'],
                    Number(i18n.__('MaxRetryCount')),
                    'StreetAddressNotFound',i18n.__('StreetAddressNotFoundPromptMessage')
                );
                return await stepContext.replaceDialog(COMMON_CALL_BACK_STEP, commonPromptValidatorModel);
            }
            else{
                const matchFound = manyAddresses.includes(stepContext.context.activity.text);
                if (matchFound)
                {
                    addressDetails.promptMessage = i18n.__('StreetNumbersPrompt');
                    addressDetails.promptRetryMessage = i18n.__('NewStreetNumberRetryPrompt');
                    return await stepContext.beginDialog(VALIDATE_NUMBER_STEP, addressDetails);
                }
                else{
                    isCallBackPassed = true;
                    return await stepContext.endDialog();
                } 
            }
           }
           else{
              return await stepContext.prompt(TEXT_PROMPT, i18n.__('StreetNamePromptMessage'));
           }
        }
        else if(addressDetails.masterError === true){
            if (addressDetails.errorCount.getAddressesStep >= Number(i18n.__('MaxRetryCount'))) {
                isCallBackPassed = true;
                const commonPromptValidatorModel = new CommonPromptValidatorModel(
                    ['YesIWantToRequestCall', 'NoNotForNow'],
                    Number(i18n.__('MaxRetryCount')),
                    'ServiceRepresentative',i18n.__('ServiceRepresentativePromptMessage')
                );
                return await stepContext.replaceDialog(COMMON_CALL_BACK_STEP, commonPromptValidatorModel);
            }else{
                if(addressNotFoundAPI.length>10){
                 await stepContext.context.sendActivity(i18n.__('NoAddressInAPIPrompt'));
                }
                else{
                    if(!isValidPostalCode){
                        await stepContext.context.sendActivity(i18n.__('IncorrectPostalCodePrompt'));
                    }
                    else{
                        await stepContext.context.sendActivity(i18n.__('APIDownPrompt'));
                    }
                }
                 return await stepContext.beginDialog(GET_ADDRESS_STEP,addressDetails);
            }
          }
        else {
            const getAddresses = stepContext.options as AddressDetails;
            if(getAddresses.AddressType === 'PO BOX'){
                getAddresses.UnitNumber = 'PO BOX' + ' ' + stepContext.context.activity.text;
            }
            else{
                getAddresses.UnitNumber = stepContext.context.activity.text;
            }
            const promptMsg = this.getEditedResponse(i18n.__('AddressFoundCheck'), getAddresses);
            const commonPromptValidatorModel = new CommonPromptValidatorModel(
                ['promptConfirmYes', 'promptConfirmNo'],
                Number(i18n.__('MaxRetryCount')),
                'AddressFound',promptMsg
            );
            return await stepContext.beginDialog(CHOICE_CHECK_UPDATE_ADDRESS_STEP, commonPromptValidatorModel);
        }
    }

    private async streetNameStep(stepContext) {
        const addressDetails = stepContext.options as AddressDetails;
        if(addressDetails.manyAddresses === null){
            return await stepContext.next();
        }
        else{
            const inputStreetName = stepContext.context.activity.text;
            const manyAddresses:string[] = addressDetails.manyAddresses;
            let outAddress = '';
            for (let i=0; i < manyAddresses.length; i++) {
                const streetName = manyAddresses[i];
                if(this.getRemoveSpaceSentence(String(streetName)).includes(this.getRemoveSpaceSentence(String(inputStreetName)))){
                   outAddress = manyAddresses[i];
                  break;
                }
            }
            if(outAddress === ''){
                await stepContext.context.sendActivity(i18n.__('StreetAddressNotFoundMessage'));
                const commonPromptValidatorModel = new CommonPromptValidatorModel(
                    ['YesIWantToRequestCall', 'NoNotForNow'],
                    Number(i18n.__('MaxRetryCount')),
                    'StreetAddressNotFound',i18n.__('StreetAddressNotFoundPromptMessage')
                );
                return await stepContext.replaceDialog(COMMON_CALL_BACK_STEP, commonPromptValidatorModel);
            }
            else{
            addressDetails.FullAddress = outAddress;
            addressDetails.promptMessage = i18n.__('StreetNumbersPrompt');
            addressDetails.promptRetryMessage = i18n.__('NewStreetNumberRetryPrompt');
            return await stepContext.beginDialog(VALIDATE_NUMBER_STEP, addressDetails);
            }

        }
     }
    private async streetNumberStep(stepContext) {
        const addressDetails = stepContext.options as AddressDetails;
        if (addressDetails.errorCount.confirmEmailStep >= Number(i18n.__('MaxRetryCount'))) {
            // Throw the master error flag
            if(!isCallBackPassed){
            addressDetails.masterError = true;
            isCallBackPassed = true;
            const commonPromptValidatorModel = new CommonPromptValidatorModel(
                ['YesIWantToRequestCall', 'NoNotForNow'],
                Number(i18n.__('MaxRetryCount')),
                'ServiceRepresentative',i18n.__('ServiceRepresentativePromptMessage')
            );
            return await stepContext.replaceDialog(COMMON_CALL_BACK_STEP, commonPromptValidatorModel);
            }
        }
        else{
        if(addressDetails.currentStep === 'street number'){
            addressDetails.FullAddress = stepContext.context.activity.text +' '+ addressDetails.FullAddress;
            addressDetails.promptMessage = i18n.__('UnitORApartmentPrompt');
            addressDetails.promptRetryMessage = i18n.__('UnitORApartmentRetryPrompt');
            return await stepContext.beginDialog(VALIDATE_NUMBER_STEP, addressDetails);
        }
        else{
            return await stepContext.next();
        }
      }
    }
    private async streetAddressUnitStep(stepContext) {
        const addressDetails = stepContext.options as AddressDetails;
        if(addressDetails.currentStep === 'street number'){
            addressDetails.UnitNumber = stepContext.context.activity.text;
            const promptMsg = this.getEditedResponse(i18n.__('AddressFoundCheck'), addressDetails);
            const commonPromptValidatorModel = new CommonPromptValidatorModel(
                ['promptConfirmYes', 'promptConfirmNo'],
                Number(i18n.__('MaxRetryCount')),
                'AddressFound',promptMsg
            );
            return await stepContext.beginDialog(CHOICE_CHECK_UPDATE_ADDRESS_STEP, commonPromptValidatorModel);
        }
        else{
            return await stepContext.next();
        }
    }
    /**
     * This is the final step in the waterfall.
     * User selects the "Yes" prompt then navigate to the users"s continue and feedback flow.
     * User selects the "No" prompt then bot again calls the update address flow.
     */
    private async finalStep(stepContext: WaterfallStepContext<AddressDetails>): Promise<DialogTurnResult> {
       const addressDetails = stepContext.options as AddressDetails;
       const recognizer = LUISAlwaysOnBotSetup(stepContext);
       const recognizerResult = await recognizer.recognize(stepContext.context);
       const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.5);
       switch (intent) {
           case 'promptConfirmYes':
               await stepContext.context.sendActivity(i18n.__('UpdateAddress') + this.getEditedResponse(i18n.__('FullAddress'), addressDetails));
               await stepContext.context.sendActivity(i18n.__('UpdateAddressFinalMessage'));
               return stepContext.endDialog(this.id);
           case 'promptConfirmNo':
               return await stepContext.replaceDialog(UPDATE_ADDRESS_STEP,addressDetails);
       }
   }
    /**
     * This is GetEditResponce Method to create a Full address for the postal code.
     */
    private getEditedResponse(response:string,postalCode:AddressDetails)
    {
        if(postalCode.PostalCode!=null)
        {
        response=response.replace('@Postal_Code',postalCode.FullAddress);
        response=response.replace('null','').replace('Null','').replace('Po','') ;
        response=response.replace(',',' ');
        }
        else
        {
            response=response.replace('@Postal_Code','');
            response=response.replace('null','');
            response=response.replace(',',' ');
        }
        if(postalCode.UnitNumber!=null)
        {
            response=response.replace('#Unit_Number','#'+postalCode.UnitNumber);
        }
        else
        {
            response=response.replace('#Unit_Number','');
        }
        return response;
    }
    /**
     * This is GetSentence Method to create a full address in sentence format.
     */
    private getSentence(word: string){
            const sentence = word.toLowerCase().split(' ');
            let outSentence:string = '';
            for(let i = 0; i< sentence.length; i++){
               outSentence = outSentence + sentence[i][0].toUpperCase() + sentence[i].slice(1)+ ' ';
            }
         return outSentence;
    }
    private getRemoveSpaceSentence(word: string){
        let sentence = word.toLowerCase();
        while(sentence.includes(' ')){
            sentence = sentence.replace('  ','');
            sentence = sentence.replace(' ','');
        }
     return sentence;
    }

    private validatePostalCode(response:string)
    {
        let reg = /^(?!.*[DFIOQU])[A-VXY][0-9][A-Z] ?[0-9][A-Z][0-9]$/
        let validPostalCode:boolean = false;
        reg = new RegExp(reg);
        if(response.match(reg))
        {
            validPostalCode = true;
        }
        return validPostalCode;
    }

}