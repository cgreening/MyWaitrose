/* eslint class-methods-use-this: 0 */
import { select } from 'soupselect';
import htmlparser from './htmlparser';
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

  // TODO - this is horrible...
  async getItemsInBasket() {
    const itemsInBasketHtml = await request({
      method: 'GET',
      url: 'http://www.waitrose.com/shop/TrolleyDisplay',
      jar: this.cookieJar
    });
    // extract the embedded json on the page that has the basket contents - might not be all the items? Is it just the items on this page?
    let jsonString = itemsInBasketHtml.split('\n').find(line => line.indexOf('\tproductsOnPage  = \'{') !== -1);
    const regex = /\tproductsOnPage {2}= '(.*)'/g;
    jsonString = regex.exec(jsonString)[1];
    const escapeRegExpProducts = /[\-{}\[\]+?.,\\\^$|#\s]/g;
    jsonString = jsonString.replace(escapeRegExpProducts, '$&');
    const productsOnPage = JSON.parse(jsonString);
    return {
      numberOfItems: productsOnPage.totalOrderItemsCount,
      products: productsOnPage.products,
      jar: this.cookieJar
    };
    /* This is what it looks like in the page
    <script>
      var productsOnPage = new Array();
      var escapeRegExpProducts = /[\-{}\[\]+?.,\\\^$|#\s]/g;
      productsOnPage  = '{"found":true,"itemsPerPage":48,"isEditOrder":false,"continueShopping":"/shop/Browse/Groceries","totalOrderItemsCount":3,"products":[{"name":"Waitrose Fairtrade Organic 6 Bananas in a bag","id":862592014,"productid":"45727","linenumber":"088937","image":"//d25hqtnqp5nl24.cloudfront.net/images/products/9/LN_088937_BP_9.jpg","thumb":"//d25hqtnqp5nl24.cloudfront.net/images/products/9/LN_088937_BP_9.jpg","url":"/shop/DisplayProductFlyout?productId=45727","productType":"G","canSubstitute":true,"price_individual":"&pound;1.92","price":"&pound;1.92","price_annotation":"","price_per_unit":"(32p each)","price_per_serving":"","serving_per_unit":"","weight":"6s","main_category":"Fresh &amp; Chilled","category":"Fresh_Fruit","sub_category":"Bananas","level1_category":"Fresh_and_Chilled","summary":"Organic bananas, grown under the Fairtrade scheme, which provides a better deal for producers in developing countries, creating opportunities for farmers and workers to improve their lives and communities and protect their environment.","offer":"","weight_type":"single","notice_required":0,"favourite":"","offer_tooltip":"","default_units":"C62","analgesic":0,"types":[],"maxPersonalMessageLength":0,"isPersonalised":"false","defaultQuantity":"1","persistDefault":0,"uom":"C62","quantity":1,"subPref":1,"parentCatentryId":45726},{"name":"Waitrose Fairtrade Organic 6 Bananas in a bag","id":862484514,"productid":"45727","linenumber":"088937","image":"//d25hqtnqp5nl24.cloudfront.net/images/products/9/LN_088937_BP_9.jpg","thumb":"//d25hqtnqp5nl24.cloudfront.net/images/products/9/LN_088937_BP_9.jpg","url":"/shop/DisplayProductFlyout?productId=45727","productType":"G","canSubstitute":true,"price_individual":"&pound;1.92","price":"&pound;1.92","price_annotation":"","price_per_unit":"(32p each)","price_per_serving":"","serving_per_unit":"","weight":"6s","main_category":"Fresh &amp; Chilled","category":"Fresh_Fruit","sub_category":"Bananas","level1_category":"Fresh_and_Chilled","summary":"Organic bananas, grown under the Fairtrade scheme, which provides a better deal for producers in developing countries, creating opportunities for farmers and workers to improve their lives and communities and protect their environment.","offer":"","weight_type":"single","notice_required":0,"favourite":"","offer_tooltip":"","default_units":"C62","analgesic":0,"types":[],"maxPersonalMessageLength":0,"isPersonalised":"false","defaultQuantity":"1","persistDefault":0,"uom":"C62","quantity":1,"subPref":1,"parentCatentryId":45726},{"name":"Waitrose Fairtrade Organic 6 Bananas in a bag","id":862597294,"productid":"45727","linenumber":"088937","image":"//d25hqtnqp5nl24.cloudfront.net/images/products/9/LN_088937_BP_9.jpg","thumb":"//d25hqtnqp5nl24.cloudfront.net/images/products/9/LN_088937_BP_9.jpg","url":"/shop/DisplayProductFlyout?productId=45727","productType":"G","canSubstitute":true,"price_individual":"&pound;1.92","price":"&pound;1.92","price_annotation":"","price_per_unit":"(32p each)","price_per_serving":"","serving_per_unit":"","weight":"6s","main_category":"Fresh &amp; Chilled","category":"Fresh_Fruit","sub_category":"Bananas","level1_category":"Fresh_and_Chilled","summary":"Organic bananas, grown under the Fairtrade scheme, which provides a better deal for producers in developing countries, creating opportunities for farmers and workers to improve their lives and communities and protect their environment.","offer":"","weight_type":"single","notice_required":0,"favourite":"","offer_tooltip":"","default_units":"C62","analgesic":0,"types":[],"maxPersonalMessageLength":0,"isPersonalised":"false","defaultQuantity":"1","persistDefault":0,"uom":"C62","quantity":1,"subPref":1,"parentCatentryId":45726}]}';
      productsOnPage  = productsOnPage.replace(escapeRegExpProducts, '\$&');
      var orderAttributes =  '{"groceryCount":3,"weCount":0,"totalCount":3,"isSeasonalItemPresent":false,"isSeasonalOrder":false}';
    </script>
    */
  }

  async searchForProduct(searchTerm) {
    const searchResponse = await request({
      method: 'GET',
      url: `http://www.waitrose.com/shop/HeaderSearchCmd?searchTerm=${encodeURIComponent(searchTerm)}&defaultSearch=GR`,
    });
    // looks like there is some embedded json for every search result on the page
    const parsedHtml = await htmlparser(searchResponse);
    const products = select(parsedHtml, 'div.productjson').map(element => JSON.parse(element.attribs['data-json']));
    return products;
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
