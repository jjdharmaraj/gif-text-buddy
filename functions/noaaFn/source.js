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
    const http = context.services.get("fb-hook-service");
    console.log(fullDocument.lucky_number);

    let url = 'https://tidesandcurrents.noaa.gov/api/datagetter?'
        //Woods Hole, MA
        + 'station=8447930&product=water_temperature'
        + '&units=english&time_zone=gmt&application=ports_screen&format=json&date=latest';
    return http.post({ url: url })
        .then(astroObj => {
            let body = EJSON.parse(astroObj.body.text());
            let v, limit;
            if (body.data && body.data[0] && body.data[0].v) {
                v = body.data[0].v;
            } else {
                //it is the meaning of life
                v = "42";
            }
            //Aquaman is concerned about the water temp in the northeast
            limit = Math.round(Math.E * v);
            return context.services
                .get("mongodb-atlas")
                .db("fb")
                .collection("private")
                .updateOne({ senderFbId: fullDocument.senderFbId },
                    {
                        nextTrigger: 'giphyApi', limit, lucky_number: fullDocument.lucky_number,
                        payload: fullDocument.payload, senderFbId: fullDocument.senderFbId
                    })
                .then(result => {
                    return;
                })
                .catch(e => {
                    console.log(e);
                    return;
                });
        });
};