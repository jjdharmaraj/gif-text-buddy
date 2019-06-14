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
    const http = context.services.get("fb-hook-service");
    let url = 'https://aztro.sameerkumar.website?sign=' + fullDocument.payload;
    return http.post({ url: url })
        .then(astroObj => {
            let body = EJSON.parse(astroObj.body.text());
            let lucky_number;
            if (body.lucky_number) {
                lucky_number = body.lucky_number;
            } else {
                //it is the meaning of life; just really a backup in case the astro API is down
                lucky_number = "42";
            }
            return context.services.get("mongodb-atlas").db("fb").collection("private")
                .updateOne({ _id: fullDocument._id },
                    {
                        nextTrigger: 'offsetFn',
                        lucky_number: lucky_number,
                        payload: fullDocument.payload,
                        senderFbId: fullDocument.senderFbId
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