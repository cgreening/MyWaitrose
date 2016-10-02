# MyWaitrose
Hacking around with watirose

## Getting started

```
npm install mywaitrose
```

```js
import WaitroseAPI from 'mywaitrose';

async function addToBasket(username, password, postcode, searchTerm) {
  const waitroseAPI = new WaitroseAPI();
  await waitroseAPI.login(username, password);
  console.log('Logged in');
  // need to set the postcode before we can add stuff to the basket ?
  await waitroseAPI.setPostcode(postcode);
  console.log('Set Password');
  // see what's in our basket
  const itemsInBasket = await waitroseAPI.getItemsInBasket();
  console.log(`You have ${itemsInBasket.numberOfItems} items in your basket`);
  itemsInBasket.products.forEach(product => console.log(product.id, product.name));
  // get the trolley cost
  const trolleySummary = await waitroseAPI.getTrolleySummary();
  console.log(`Estimated cost of trolley ${trolleySummary.estimatedCost}`);

  // seach for a product
  const products = await waitroseAPI.searchForProduct(searchTerm);
  console.log(`Found ${products.length} matches for "${searchTerm}"`);
  products.forEach(product => console.log(product.id, product.name));

  // add the first product we found
  const newBasket = await waitroseAPI.addToBasket(products[0].id);
  console.log(`You now have ${newBasket.numberOfItems} items in your basket`);
  newBasket.products.forEach(product => console.log(product.id, product.name, product.quantity));

  const newTolleySummary = await waitroseAPI.getTrolleySummary();
  console.log(`Estimated cost of trolley ${newTolleySummary.estimatedCost}`);
}

main(<YOUR USERNAME>, <YOUR PASSWORD>, <YOUR POSTCODE> <SEARCH TERM FOR PRODUCT TO ADD TO BASKET>);
```

## Development

### Setup

Clone the repo and run:

```
npm install
```

## Running sample code in development

```
npm run dev USERNAME PASSWORD "POSTCODE" "PRODUCT SEARCH TERM"
```

This will run the code in a loop waiting for changes to the code. Pass your waitrose username, password, delivery postcode and the product you want to search for.

```
npm start USERNAME PASSWORD "POSTCODE" "PRODUCT SEARCH TERM"
```

This will run the code once - pass the same arguments as above.

## Building

Build the javascript with:

```
npm run lint
npm test
npm run build
```
