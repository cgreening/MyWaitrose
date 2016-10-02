import http from 'http';
import request from 'request';
import { select } from 'soupselect';
import htmlparser from 'htmlparser';

function requestPromise(config) {
  return new Promise((resolve, reject) => {
    request(config, function(error, response, body) {
      if(error) {
        reject(error);
      } else {
        if(response.statusCode == 200 || response.statusCode == 201) {
          try {
            resolve(JSON.parse(body));
          } catch(error) {
            resolve(body);
          }
        } else {
          reject(new Error(`Got back status: ${response.statusCode}, body: ${JSON.stringify(body)}`));
        }
      }
    });
  });
}

function htmlParsePromise(rawHtml) {
  return new Promise((resolve, reject) => {
    var handler = new htmlparser.DefaultHandler(function (error, dom) {
      if (error) {
        console.log('Error parsing', error);
        reject(error);
      } else {
        console.log('Html parse done');
        resolve(dom);
      }
    });
    try {
      const parser = new htmlparser.Parser(handler);
      parser.parseComplete(rawHtml);
    } catch(error) {
      reject(error);
    }
  });
}

async function login(username, password, cookieJar) {
  const loginLookupResponse = await requestPromise({
    method: 'GET',
    url: `https://www.waitrose.com/shop/LogonIdLookupCmd?logonId=${username}&_method=GET`,
    jar: cookieJar
  });
  if(!loginLookupResponse.proceedToLogon) {
    throw new Error(`${username} is not valid`);
  }
  console.log('Username valid - logging in');
  const loginResponse = await requestPromise({
    method: 'POST',
    url: 'https://www.waitrose.com/webapp/wcs/stores/servlet/CustomerLogon',
    jar: cookieJar,
    form: {
      logonId: username,
      logonPassword: password,
      _method: 'put'
    }
  });
  if(loginResponse.outcome != 1) {
    throw new Error('Login failed');
  }
  console.log('Logged in successfully');
}

async function setPostcode(postcode, cookieJar) {
  const setPostcodeResponse = await requestPromise({
    method: 'GET',
    url: `https://www.waitrose.com/shop/SetPostcodeForBranch?postcode=${encodeURIComponent(postcode)}&_method=GET`,
    jar: cookieJar
  });
  // console.log('setPostcodeResponse', setPostcodeResponse);
  if(!setPostcodeResponse.success || !setPostcodeResponse.postcodeLookupPass) {
    throw new Error('Faied to set postcode');
  }
}

async function getTrolleySummary(cookieJar) {
  const basketSummaryResponse = await requestPromise({
    method: 'GET',
    url: `http://www.waitrose.com/shop/TrolleySummary?recalcprice=true&_method=GET`,
    jar: cookieJar
  });
//  console.log(basketSummaryResponse);
  if(basketSummaryResponse.result != 'success') {
    throw new Error('Could not get trolley summary');
  }
  return {
    numberOfItems: basketSummaryResponse.trolleydetails.trolleytotals.numberofitems,
    estimatedCost: basketSummaryResponse.trolleydetails.trolleytotals.trolleyestimatedcost
  }
}

// TODO - this is horrible...
async function getItemsInBasket(cookieJar) {
  const itemsInBasketHtml = await requestPromise({
    method: 'GET',
    url: 'http://www.waitrose.com/shop/TrolleyDisplay',
    jar: cookieJar
  });
  // extract the embedded json on the page that has the basket contents - might not be all the items? Is it just the items on this page?
  let jsonString = itemsInBasketHtml.split('\n').find(line => line.indexOf("\tproductsOnPage  = \'{") !== -1);
  const regex = /\tproductsOnPage  = '(.*)'/g
  jsonString = regex.exec(jsonString)[1];
  const escapeRegExpProducts = /[\-{}\[\]+?.,\\\^$|#\s]/g;
  jsonString  = jsonString.replace(escapeRegExpProducts, '\$&');
  const productsOnPage = JSON.parse(jsonString);
  return {
    numberOfItems: productsOnPage.totalOrderItemsCount,
    products: productsOnPage.products
  }
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

async function searchForProduct(searchTerm) {
  const searchResponse = await requestPromise({
    method: 'GET',
    url: `http://www.waitrose.com/shop/HeaderSearchCmd?searchTerm=${encodeURIComponent(searchTerm)}&defaultSearch=GR`
  });
  // looks like there is some embedded json for every search result on the page
  const parsedHtml = await htmlParsePromise(searchResponse);
  const products = select(parsedHtml, "div.productjson").map(element => JSON.parse(element.attribs['data-json']));
  return products;
}

async function addToBasket(productId, cookieJar) {
  const addToBasketResponse = await requestPromise({
    method: 'GET',
    url: `http://www.waitrose.com/webapp/wcs/stores/servlet/OrderItemAdd?URL=/shop/MiniTrolley&updateMiniTrolley=false&doPrice=N&doInventory=N&calculateOrder=1&catEntryId_1=${productId}&quantity_1=1.00&UOM_1=C62&subPref_1=1&noGreeting_1=0`,
    jar: cookieJar
  });
  if(addToBasketResponse.result != 'success') {
    throw new Error('Could not add to basket');
  }
  return  {
    numberOfItems: addToBasketResponse.size,
    products: addToBasketResponse.items
  }
}

const cookieJar = request.jar()

async function main(username, password, postcode, searchTerm) {
  try {
    await login(username, password, cookieJar);
    // need to set the postcode before we can add stuff to the basket ?
    await setPostcode(postcode, cookieJar);
    // see what's in our basket
    const itemsInBasket = await getItemsInBasket(cookieJar);
    console.log(`You have ${itemsInBasket.numberOfItems} items in your basket`);
    itemsInBasket.products.forEach(product => console.log(product.id, product.name));
    // get the trolley cost
    const trolleySummary = await getTrolleySummary(cookieJar);
    console.log(`Estimated cost of trolley ${trolleySummary.estimatedCost}`);

    // seach for a product
    const products = await searchForProduct(searchTerm);
    console.log(`Found ${products.length} matches for "${searchTerm}"`);
    products.forEach(product => console.log(product.id, product.name, product.quantity));

    // add the first product we found
    const newBasket = await addToBasket(products[0].id, cookieJar);
    console.log(`You now have ${newBasket.numberOfItems} items in your basket`);
    newBasket.products.forEach(product => console.log(product.id, product.name, product.quantity));

    const newTolleySummary = await getTrolleySummary(cookieJar);
    console.log(`Estimated cost of trolley ${newTolleySummary.estimatedCost}`);
  } catch(error) {
    console.log(error);
  }
}

if(process.argv.length != 6) {
  console.error('Usage: username password postcode search_term');
  process.exit(1);
}

main(process.argv[2], process.argv[3], process.argv[4], process.argv[5]);
