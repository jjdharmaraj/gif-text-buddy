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
    let lucky_number = fullDocument.lucky_number;
    let waterTemp, marsTemp;
    context.functions.execute("mercuryFn")
        .then(waterTempObj => {
            if (waterTempObj.data && waterTempObj.data[0] && waterTempObj.data[0].v) {
                waterTemp = waterTempObj.data[0].v;
            } else {
                //it is the meaning of life; really just a backup incase the NOAA API goes down
                waterTemp = "42";
            }
            return context.functions.execute("insightRoverFn");
        })
        .then(marsObj => {
            if (marsObj.sol_keys && marsObj.sol_keys[0]) {
                let sol = marsObj.sol_keys[0];
                marsTemp = marsObj[sol].AT.av;
            } else {
                //it is the meaning of life; really just a backup incase the NASA API goes down
                marsTemp = '42';
            }
            //the universe dictatd this formula to be a limiting factor on how many GIFs to get
            let limit = lucky_number * (Math.abs(Math.round(waterTemp / marsTemp)));
            return context.services.get("mongodb-atlas").db("fb").collection("private")
                .updateOne({ _id: fullDocument._id },
                    {
                        nextTrigger: 'giphyApi',
                        offset: fullDocument.offset,
                        lucky_number: fullDocument.lucky_number,
                        limit: limit,
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