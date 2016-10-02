import request from 'request';

export const jar = request.jar;

export default function requestPromise(config) {
  return new Promise((resolve, reject) => {
    request(config, (error, response, body) => {
      if(error) {
        reject(error);
      } else if(response.statusCode == 200 || response.statusCode == 201) {
        try {
          resolve(JSON.parse(body));
        } catch(jsonError) {
          resolve(body);
        }
      } else {
        reject(new Error(`Got back status: ${response.statusCode}, body: ${JSON.stringify(body)}`));
      }
    });
  });
}
