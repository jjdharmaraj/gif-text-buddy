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

/**
 * This is the main function for the FB Stitch Webhook.
 * 
 * https://docs.mongodb.com/manual/reference/mongodb-extended-json/
 * https://docs.mongodb.com/stitch/functions/utilities/index.html#ejson
 * https://docs.mongodb.com/stitch/services/webhook-requests-and-responses/#webhook-response-object
 * 
 * @param {Object} payload Incoming data that is EJSON with query, headers, and body (EJSON).
 * @param {Object} response Result sent back to the DOM when webhook is called.
 */
exports = function (payload, response) {
    //Process FB Setup Webhook: GET method
    if (payload.query['hub.verify_token'] && payload.query['hub.challenge']
        && payload.query['hub.mode'] == 'subscribe') {
        return fbSetupWebhook(payload)
            .then(verification => {
                response.setStatusCode(200);
                response.setBody(verification);
                return;
            })
            .catch(e => {
                console.log('Error, wrong validation token');
                response.setStatusCode(401);
                response.setBody(e);
                return;
            });
    }
    //Process FB Message: POST method
    //https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/
    //messages, messaging_postbacks, messaging_optins, and message_deliveries
    else if (payload.headers['X-Hub-Signature']) {
        //TODO: add FB signature check if you care to protect your webhook
        //https://developers.facebook.com/docs/messenger-platform/webhook/#security
        let incomingJson = EJSON.parse(payload.body.text());
        return fbProcessIncoming(incomingJson)
            .then(responseBody => {
                //the value of responseBody doesn't matter with regards to your bot
                //but the values I set could make an interesting playlist
                if (typeof responseBody != 'string') {
                    responseBody = 'Come as You Are';
                }
                response.setStatusCode(200);
                response.setBody(responseBody);
                return;
            })
            .catch(e => {
                console.log('An error has occurred with the POST: ');
                console.log(e);
                response.setStatusCode(401);
                response.setBody('I Knew You Were Trouble');
                return;
            });
    }
    //Possibly a lazy hacker
    else {
        console.log(JSON.stringify(payload));
        //Not authorized call
        response.setStatusCode(401);
        response.setBody('Give Me a Sign');
        return;
    }
};
/**
 * This processes the request for the GET method and webhook subscription.
 * 
 * @param {Object} payload Incoming data.
 */
function fbSetupWebhook(payload) {
    return new Promise((resolve, reject) => {
        const VERIFY_TOKEN = context.values.get("FB_VERIFICATION_BOT_TOKEN");

        let queryParams = payload.query;
        let rVerifyToken = queryParams['hub.verify_token'];

        if (rVerifyToken === VERIFY_TOKEN) {

            resolve(queryParams['hub.challenge']);
        } else {
            reject('Sugar, We\'re Goin Down');
        }
    });
}
/**
 * Process the POST request which are the messages sent in.
 * 
 * @param {Object} event The body of the payload with what message to process.
 */
function fbProcessIncoming(event) {

    return new Promise((resolve, reject) => {
        //We only deal with the first message even though there could be
        //a series since FB could have delayed sending some, aka need
        //to treat it as a conversation
        let messagingEvents = event.entry[0].messaging;

        for (var i = 0; i < messagingEvents.length; i++) {
            let messagingEvent = messagingEvents[i];

            let senderFbId = messagingEvent.sender.id;
            //check to make sure there is an actual message
            if (messagingEvent.postback || messagingEvent.message) {
                messageDispatch(senderFbId, messagingEvent)
                    .then(message => {
                        if (message && (message.message_id || message.recipient_id)) {
                            resolve('Thank U, Next');
                        } else {
                            console.log(JSON.stringify(message));
                            console.log('Oh snap, did FB change something again for the response!');
                            resolve('I Hate Everything About You');
                        }
                    })
                    .catch(e => {
                        console.log('Error with message dispatch');
                        reject(e);
                    });
            } else if (messagingEvent.delivery && messagingEvent.delivery.watermark) {
                //mids maynot always be there but watermark will always be there
                //https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/message-deliveries
                console.log(`${senderFbId} last message received ${messagingEvent.delivery.watermark}`);
                resolve('Thnks fr th Mmrs');
            } else {
                //who are you messagingEvent?
                console.log('postback || message, delivery && delivery.watermark keys are not present.');
                reject(messagingEvent);
            }
        }
    });
}
/**
 * This sorts through the different types of messages.
 * 
 * Super basic handling of the messages and don't hold content in code.
 * 
 * https://developers.facebook.com/docs/messenger-platform/introduction/conversation-components/
 * 
 * @param {String} senderFbId This is the user who sent to message.
 * @param {Object} messagingEvent The relevant data sent from FB messenger.
 */
function messageDispatch(senderFbId, messagingEvent) {
    let payload;
    if (messagingEvent.postback && messagingEvent.postback.payload) {
        payload = messagingEvent.postback.payload;
    }
    //while I am not using quick replies right now, I might in the future.
    else if (messagingEvent.message.quick_reply && messagingEvent.message.quick_reply.payload) {
        payload = messagingEvent.message.quick_reply.payload;
    } else {
        payload = 'n/a';
    }
    //send the message
    if (payload == 'help') {
        let text = 'Gif Text Buddy uses a formula to stitch together data from across the universe to find you the perfect gif '
            + 'to send to your friends.  This includes the air temperature from the InSight Mars Lander, the water temperature in '
            + 'Cape Cod, is Mercury in retrograde and a roll of the dice in our trigger happy formula.';
        return sendTextMessage(senderFbId, text)
            .then(fbCallback => {
                return fbCallback;
            });
    }
    //catchall; composer is diabled so text and attachments should not come through but just incase
    else if (payload == 'n/a') {
        let text = `I am sorry we cannot support that type of message right now.`;
        return sendTextMessage(senderFbId, text)
            .then(fbCallback => {
                return fbCallback;
            });
    } else {
        //send typing indicator since the machine might take awhile for the universe to find the perfect gif
        return context.services
            .get("mongodb-atlas")
            .db("fb")
            .collection("private")
            .insertOne({
                senderFbId, payload, nextTrigger: 'astroFn',
            })
            .then(result => {
                return sendDots(senderFbId);
            })
            .then(fbCallback => {
                return fbCallback;
            });
    }
}
/**
 * Typing indicators are automatically turned off after 20 seconds, or when the bot sends a message.
 *
 * https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions/#supported_actions
 *
 * @param {String} senderFbId The user id from Facebook.
 */
function sendDots(senderFbId) {
    return new Promise((resolve, reject) => {
        const messaging_type = "RESPONSE";
        let outgoingJson = {
            messaging_type: messaging_type, recipient: { id: senderFbId },
            sender_action: "typing_on"
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