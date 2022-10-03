/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
const axios = require('axios');

const getEpochTime = function(timeString) {
    try {
        let epochTime = new Date(timeString).getTime();
        return epochTime;
    } catch {
        return null;
    }
}

const getTimeStamp = function(message) {
    if(message.hasOwnProperty('time')) {
        return getEpochTime(message["time"]);
    }
    return null;
}

const getPayload = async function(message) {

    try {
        jsonMessage = JSON.parse(message);
    } catch (err) {
        // The message is not JSON, so send it as-is.
        let payload = {
            "event": message
        }
        return payload;
    }

    // If the JSON contains a records[] array, batch the events for HEC.
    if(jsonMessage.hasOwnProperty('records')) {
        let payload = ''

        jsonMessage.records.forEach(function(record) {
            
            let recordEvent = {
                "event": JSON.stringify(record)
            }
            
            let eventTimeStamp = getTimeStamp(record);
            if(eventTimeStamp) { recordEvent["time"] = eventTimeStamp; }
            payload += JSON.stringify(recordEvent);
        });
        return payload
    }

    // If we made it here, the JSON does not contain a records[] array, so send the data as-is
    let payload = {
        "event": JSON.stringify(jsonMessage)
    }
    let eventTimeStamp = getTimeStamp(jsonMessage);
    if(eventTimeStamp) { payload["time"] = eventTimeStamp; }
    return payload
}

const sendToHumio = async function(message) {

    let headers = {
        "Authorization": `Bearer ${process.env["INGESET_TOKEN"]}`
    }

    await getPayload(message)
        .then(payload => {
            return axios.post(process.env["HUMIO_URL"], payload, {headers: headers});
        })
        .catch(err => {
            throw err;
    });
}

exports.sendToHumio = sendToHumio;