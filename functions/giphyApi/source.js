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

exports = function (arg) {
  let fullDocument = arg.fullDocument;
  const GIPHY_API_KEY = context.values.get("GIPHY_API_KEY");
  const http = context.services.get("fb-hook-service");

  let url = "https://api.giphy.com/v1/gifs/search?api_key=" + GIPHY_API_KEY
    + "&q=" + fullDocument.payload;
  // + "&limit=" + limit
  // + "&offset=" + offset
  // + "&rating=G&lang=en";
  return http.get({ url: url })
    .then(giphyObj => {
      let body = EJSON.parse(giphyObj.body.text());
      return context.services
        .get("mongodb-atlas")
        .db("fb")
        .collection("private")
        .updateOne({ senderFbId: fullDocument.senderFbId },
          { nextTrigger: 'sendToFb', image: body.data[0].images.original.url, senderFbId: fullDocument.senderFbId })
        .then(result => {
          return;
        })
        .catch(e => {
          console.log(e);
          return;
        });
    });
};