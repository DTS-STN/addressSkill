export class AddressDetails{
    public PostalCode;
    public UnitNumber;
    public FullAddress;
    public AddressType;
    public currentStep;
    public maxCount;
    public currentCount;
    public getAddressesStep;
    public updateAddressStep;
    public errorCount;
    public masterError;
    public manyAddresses;
    public numberValidationStep;
    public promptMessage;
    public promptRetryMessage;
    constructor(){
        this.masterError = null;
        this.PostalCode=null;
        this.UnitNumber=null;
        this.FullAddress=null;
        this.AddressType=null;
        this.currentStep=null;
        this.maxCount=3;
        this.currentCount=0;
        this.getAddressesStep=null;
        this.updateAddressStep=null;
        this.manyAddresses=null;
        this.numberValidationStep=null;
        this.promptMessage=null;
        this.promptRetryMessage=null;
         // State machine that stores the error counts of each step
    this.errorCount = {
        getAddressesStep: 0,
        updateAddressStep: -1,
        numberValidationStep: 0
      };
    }
}