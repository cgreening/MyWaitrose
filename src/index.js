/* eslint class-methods-use-this: 0 */
import request, { jar } from './request';

export default class WaitroseAPI {
  constructor() {
    this.cookieJar = jar();
  }

  async login(username, password) {
    const loginLookupResponse = await request({
      method: 'GET',
      url: `https://www.waitrose.com/shop/LogonIdLookupCmd?logonId=${username}&_method=GET`,
      jar: this.cookieJar
    });
    if(!loginLookupResponse.proceedToLogon) {
      throw new Error(`${username} is not valid`);
    }
    const loginResponse = await request({
      method: 'POST',
      url: 'https://www.waitrose.com/webapp/wcs/stores/servlet/CustomerLogon',
      jar: this.cookieJar,
      form: {
        logonId: username,
        logonPassword: password,
        _method: 'put'
      }
    });
    if(loginResponse.outcome != 1) {
      throw new Error('Login failed');
    }
  }

  async setPostcode(postcode) {
    const setPostcodeResponse = await request({
      method: 'GET',
      url: `https://www.waitrose.com/shop/SetPostcodeForBranch?postcode=${encodeURIComponent(postcode)}&_method=GET`,
      jar: this.cookieJar
    });
    // console.log('setPostcodeResponse', setPostcodeResponse);
    if(!setPostcodeResponse.success || !setPostcodeResponse.postcodeLookupPass) {
      throw new Error('Faied to set postcode');
    }
  }

  async getTrolleySummary() {
    const basketSummaryResponse = await request({
      method: 'GET',
      url: 'http://www.waitrose.com/shop/TrolleySummary?recalcprice=true&_method=GET',
      jar: this.cookieJar
    });
  //  console.log(basketSummaryResponse);
    if(basketSummaryResponse.result != 'success') {
      throw new Error('Could not get trolley summary');
    }
    return {
      numberOfItems: basketSummaryResponse.trolleydetails.trolleytotals.numberofitems,
      estimatedCost: basketSummaryResponse.trolleydetails.trolleytotals.trolleyestimatedcost
    };
  }

  async getItemsInBasket() {
    const miniTrolleyResponse = await request({
      method: 'GET',
      url: 'http://www.waitrose.com/shop/MiniTrolley?_method=GET',
      jar: this.cookieJar
    });
    if(miniTrolleyResponse.result != 'success') {
      throw new Error('Could not get items');
    }
    return {
      numberOfItems: miniTrolleyResponse.size,
      products: miniTrolleyResponse.items
    };
  }

  async searchForProduct(searchTerm) {
    const searchResponse = await request({
      method: 'GET',
      // url: `http://www.waitrose.com/shop/HeaderSearchCmd?searchTerm=${encodeURIComponent(searchTerm)}&defaultSearch=GR`,
      url: `http://query.published.live1.suggest.eu1.fredhopperservices.com/waitrose/jscript?search=${encodeURIComponent(searchTerm)}&scope=%2F%2Fwaitroseproduct%2Fen_GB&callback=mywaitrose&_method=GET&_=1475746938540`
    });
    const regex = /mywaitrose\((.*)\)/g;
    const jsonString = regex.exec(searchResponse)[1];
    const json = JSON.parse(jsonString);
    return json.suggestionGroups[2].suggestions.map((product) => {
      return { ...product, id: product.secondId };
    });
  }

  async addToBasket(productId) {
    const addToBasketResponse = await request({
      method: 'GET',
      url: `http://www.waitrose.com/webapp/wcs/stores/servlet/OrderItemAdd?URL=/shop/MiniTrolley&updateMiniTrolley=false&doPrice=N&doInventory=N&calculateOrder=1&catEntryId_1=${productId}&quantity_1=1.00&UOM_1=C62&subPref_1=1&noGreeting_1=0`,
      jar: this.cookieJar
    });
    if(addToBasketResponse.result != 'success') {
      throw new Error('Could not add to basket');
    }
    return {
      numberOfItems: addToBasketResponse.size,
      products: addToBasketResponse.items
    };
  }
}
