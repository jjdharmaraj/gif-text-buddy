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
    return sendImageMessage(fullDocument.senderFbId, fullDocument.image)
        .then(fbCallback => {
            let text = `The universe has dictated that your lucky number is ${fullDocument.lucky_number}.`;
            return sendTextMessage(fullDocument.senderFbId, text);
        });
};
/**
 * This just sends a text message.
 * 
 * https://developers.facebook.com/docs/messenger-platform/reference/send-api/#message
 * 
 * @param {String} senderFbId The user id from Facebook.
 * @param {String} text The message sent to users; 2000 character limit.
 */
function sendTextMessage(senderFbId, text) {
    return new Promise((resolve, reject) => {
        const messaging_type = "RESPONSE";
        let outgoingJson = {
            messaging_type: messaging_type, recipient: { id: senderFbId },
            message: {
                text: text
            }
        };
        sendToFb(outgoingJson)
            .then(callbackFb => {
                callbackFb = EJSON.parse(callbackFb.body.text());
                resolve(callbackFb);
            })
            .catch(error => {
                reject(error);
            });
    });
}
/**
 * This just sends a text message.
 * 
 * https://developers.facebook.com/docs/messenger-platform/reference/send-api/#message
 * 
 * @param {String} senderFbId The user id from Facebook.
 * @param {String} image Image to send.
 */
function sendImageMessage(senderFbId, image) {
    return new Promise((resolve, reject) => {
        const messaging_type = "RESPONSE";
        let outgoingJson = {
            messaging_type: messaging_type, recipient: { id: senderFbId },
            message: {
                attachment: { type: 'image', payload: { url: image } }
            }
        };
        sendToFb(outgoingJson)
            .then(callbackFb => {
                callbackFb = EJSON.parse(callbackFb.body.text());
                resolve(callbackFb);
            })
            .catch(error => {
                reject(error);
            });
    });
}
/**
 * This is the main function, this is really a Promise. 
 * 
 * @param {Object} json The data sent to facebook.
 */
function sendToFb(json) {
    const PAGE_TOKEN = context.values.get("FB_PAGE_ACCESS_TOKEN");
    const http = context.services.get("fb-hook-service");
    return http.post({
        url: "https://graph.facebook.com/v2.6/me/messages?access_token=" + PAGE_TOKEN,
        body: json,
        encodeBodyAsJSON: true
    });
}