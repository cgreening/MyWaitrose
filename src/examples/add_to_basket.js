/* eslint no-console: 0 */
import WaitroseAPI from '../index';

async function main(username, password, postcode, searchTerm) {
  try {
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
  } catch(error) {
    console.log(error);
  }
}

if(process.argv.length != 6) {
  console.error('Usage: username password postcode search_term');
  process.exit(1);
}

main(process.argv[2], process.argv[3], process.argv[4], process.argv[5]);
