export class CommonPromptValidatorModel {
    public retryCount: number;
    public result: string;
    public promptCode: string;
    public status: boolean;
    public intents: string[];
    public maxRetryCount: number;
    public initialPrompt : string;

    constructor(intents?: string[], maxRetryCount?: number, promptCode?:string,initialPrompt?:string){
        this.retryCount = 0;
        this.intents = intents;
        this.maxRetryCount = maxRetryCount ?? 2;
        this.promptCode = promptCode;
        this.initialPrompt = initialPrompt;
    }
}