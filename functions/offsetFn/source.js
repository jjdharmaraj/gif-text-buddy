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
    context.functions.execute("mercuryFn")
        .then(mercuryObj => {
            let numOfDice;
            if (mercuryObj.is_retrograde && mercuryObj.is_retrograde === true) {
                numOfDice = 'd6';
            } else {
                numOfDice = 'd12';
            }
            let url = 'http://roll.diceapi.com/json/' + numOfDice;
            return http.get({ url: url });
        })
        .then(diceObj => {
            let body = EJSON.parse(diceObj.body.text());
            let offset;
            if (body.dice && body.dice[0] && body.dice[0].value) {
                offset = body.dice[0].value;
            } else {
                offset = 0;
            }
            return context.services.get("mongodb-atlas").db("fb").collection("private")
                .updateOne({ _id: fullDocument._id },
                    {
                        nextTrigger: 'limitFn', offset,
                        lucky_number: fullDocument.lucky_number,
                        payload: fullDocument.payload, senderFbId: fullDocument.senderFbId
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