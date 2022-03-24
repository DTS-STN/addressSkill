export class AddressAPI {
    
     async getAddress(postalCode:string,langAPI:string,subscriptionKey:string) {
        const query = {
            AddressPostalCode: postalCode,
         };
        const url = new URL(process.env.AddressAPIUrl);
        url.search = new URLSearchParams(query).toString();
        const headers = {
            "Ocp-Apim-Subscription-Key": subscriptionKey,
            "Accept-Language": langAPI,
        };
        const response = await fetch( url.toString(), {headers} );
        return await response.json();
     };  
}
 
