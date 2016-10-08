/* eslint no-console: 0 */
import { AllHtmlEntities as htmlEntities } from 'html-entities';
import WaitroseAPI from '../index';

async function main(username, password) {
  try {
    const waitroseAPI = new WaitroseAPI();
    await waitroseAPI.login(username, password);
    console.log('Logged in');
    // need to set the postcode before we can add stuff to the basket ?
    // see what's our favourites are
    const favourites = await waitroseAPI.getFavourites();
    console.log(`You have ${favourites.length} favourites`);
    favourites.forEach(favourite => {
      if(favourite.details) {
        console.log(htmlEntities.decode(favourite.details.name));
      } else {
        console.log('no details');
      }
    });
  } catch(error) {
    console.log(error);
  }
}

if(process.argv.length != 4) {
  console.error('Usage: username password');
  process.exit(1);
}

main(process.argv[2], process.argv[3]);
