import { RecognizerResult, TurnContext } from "botbuilder";
import {
  LuisApplication,
  LuisRecognizer,
  LuisRecognizerOptionsV3,
} from "botbuilder-ai";

export class CallbackRecognizer {
  private recognizer: LuisRecognizer;
  private applicationId;
  private endpointKey;
  private endpoint;
  constructor(lang: string) {
    // Then change LUIZ appID

    console.log("CallbackRecognizer", lang);

    if (lang === "fr") {
      this.applicationId = process.env.LuisAppIdFR;
      this.endpointKey = process.env.LuisAPIKeyFR;
      //this.endpoint = process.env.LuisAPIHostNameFR;
      //this.applicationId = process.env.LuisCallbackAppIdFR;
      //this.endpointKey = process.env.LuisCallbackAPIKeyFR;
      //this.endpoint = process.env.LuisCallbackAPIHostNameFR;
      this.endpoint = `https://${process.env.LuisAPIHostNameFR}.cognitiveservices.azure.com`;
    } else {
      this.applicationId = process.env.LuisAppIdEN;
      this.endpointKey = process.env.LuisAPIKeyEN;
      //this.endpoint = process.env.LuisAPIHostNameEN;
      //this.applicationId = process.env.LuisCallbackAppIdEN;
     // this.endpointKey = process.env.LuisCallbackAPIKeyEN;
     // this.endpoint = process.env.LuisCallbackAPIHostNameEN;
      this.endpoint = `https://${process.env.LuisAPIHostNameEN}.cognitiveservices.azure.com`;
    }
    const luisConfig: LuisApplication = {
      applicationId: this.applicationId,
      endpointKey: this.endpointKey,
      endpoint: this.endpoint,
    };
    const luisIsConfigured =
      luisConfig &&
      luisConfig.applicationId &&
      luisConfig.endpoint &&
      luisConfig.endpointKey;
    if (luisIsConfigured) {
      // Set the recognizer options depending on which endpoint version you want to use e.g LuisRecognizerOptionsV2 or LuisRecognizerOptionsV3.
      // More details can be found in https://docs.microsoft.com/en-gb/azure/cognitive-services/luis/luis-migration-api-v3
      const recognizerOptions: LuisRecognizerOptionsV3 = {
        apiVersion: "v3",
        includeAllIntents: true,
        includeInstanceData: true,
      };

      this.recognizer = new LuisRecognizer(luisConfig, recognizerOptions, true);
    }
  }

  public get isConfigured(): boolean {
    return this.recognizer !== undefined;
  }

  /**
   * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
   * @param {TurnContext} context
   */
  public async executeLuisQuery(
    context: TurnContext
  ): Promise<RecognizerResult> {
    return this.recognizer.recognize(context);
  }
}
