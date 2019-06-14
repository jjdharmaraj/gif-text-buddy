/* 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

exports = (arg) => {
  let fullDocument = arg.fullDocument;
  const GIPHY_API_KEY = context.values.get("GIPHY_API_KEY");
  const http = context.services.get("fb-hook-service");
  let lucky_number = fullDocument.lucky_number;

  let url = "https://api.giphy.com/v1/gifs/search?api_key=" + GIPHY_API_KEY
    + "&q=" + fullDocument.payload
    + "&limit=" + fullDocument.limit
    + "&offset=" + fullDocument.offset
    + "&rating=G&lang=en";
  return http.get({ url: url })
    .then(giphyObj => {
      let body = EJSON.parse(giphyObj.body.text());
      let image;
      //check to see if the lucky number image actually exists, if not get the first one.
      //if there is nothing, then say hi to Ralph

      if (body.data && body.data[lucky_number] && body.data[lucky_number].images
        && body.data[lucky_number].images.original && body.data[lucky_number].images.original.url) {
        image = body.data[lucky_number].images.original.url;
      } else if (body.data && body.data[0] && body.data[0].images
        && body.data[0].images.original && body.data[0].images.original.url) {
        image = body.data[0].images.original.url;
      } else {
        image = 'https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif';
      }
      return context.services.get("mongodb-atlas").db("fb").collection("private")
        .updateOne({ _id: fullDocument._id },
          {
            nextTrigger: 'sendToFb',
            image: image,
            senderFbId: fullDocument.senderFbId,
            offset: fullDocument.offset,
            lucky_number: lucky_number,
            limit: fullDocument.limit,
            payload: fullDocument.payload,
          });
    })
    .then(result => {
      return;
    })
    .catch(e => {
      console.log(e);
      return;
    });
};