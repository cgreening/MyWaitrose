# MyWaitrose
Hacking around with watirose

## Setup

Clone the repo and run:

```
npm install
```

## Running in development

```
npm run dev USERNAME PASSWORD "POSTCODE" "PRODUCT SEARCH TERM"
```

This will run the code in a loop waiting for changes to the code. Pass your waitrose username, password, delivery postcode and the product you want to search for.

```
npm start USERNAME PASSWORD "POSTCODE" "PRODUCT SEARCH TERM"
```

This will run the code once - pass the same arguments as above.

## Running in production

Build the javascript with:

```
npm run build
```

You can now do:

```
node lib/index.js USERNAME PASSWORD "POSTCODE" "PRODUCT SEARCH TERM"
```

The bebel compiler should be targetting the latest stable node so the code should work on lambda.
