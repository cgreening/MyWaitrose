import htmlparser from 'htmlparser';

export default function htmlParsePromise(rawHtml) {
  return new Promise((resolve, reject) => {
    const handler = new htmlparser.DefaultHandler((error, dom) => {
      if (error) {
        reject(error);
      } else {
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
