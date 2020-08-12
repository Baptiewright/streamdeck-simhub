//
//  main.js
//  Simhub Plugin
//
//  Created by Grahame Wright, Baptiewright Designs
//

let websocket = null;
let pluginUUID = null;
//let settingsCache = {};
let globalSettingsCache = {};
let settingsCache = {};

const controlAction = {

    type : "com.baptiewright.simhub.control",

    onKeyUp : function(context, settings, coordinates, userDesiredState) {
        triggerSimhub(settings['trigger'],context);
        //console.log("Button Pressed");
    },

    onWillAppear : function(context, settings, coordinates) {
        settingsCache[context] = settings;
        //console.log("willAppear",settings);
    },

    SetTitle : function(context,jsonPayload) {
        //console.log(jsonPayload['title']);
        let payload = {};
        payload.title = jsonPayload['title'];
        payload.target = "DestinationEnum.HARDWARE_AND_SOFTWARE";
        const json = {
            "event": "setTitle",
            "context": context,
            "payload": payload,
        };
        websocket.send(JSON.stringify(json));
    }

};

function triggerSimhub(trigger,context)
{
    var simURL = "http://localhost:8888/api/triggerinput/"+trigger;
    var method = "GET";
    var request = new XMLHttpRequest();
    request.open(method, simURL);
    request.send();
    //console.log(request);
    request.onreadystatechange = function() {
        
        if (request.readyState == 4){
            if (request.status == 200) {
                //var status = request.status;
                var data = request.responseText;
                if (data == "Ok") {
                    showAlert("showOk",context);
                }
                else {
                    //console.log("Shit went wrong");
                    showAlert("showAlert",context);
                }

            }
            else {
                //console.log("Shit went wrong");
                showAlert("showAlert",context);
            }
        }
    }
}

function showAlert(event,context) {
    if (websocket) {
        let payload = {};
        const json = {
            "event": event,
            "context": context,
        };
        websocket.send(JSON.stringify(json));
    }
}

function requestSettings(uuid,event,payload={}) {
    if (websocket) {
        const json = {
            "event": event,
            "context": uuid,
            "payload" : payload,
        };
        //console.log("sending to plugin",json);
        websocket.send(JSON.stringify(json));
    }
}

function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo)
{
    pluginUUID = inPluginUUID;
    console.log("pluginUUID ",pluginUUID);
    // Open the web socket
    websocket = new WebSocket("ws://localhost:" + inPort);

    function registerPlugin(inPluginUUID)
    {
        const json = {
            "event": inRegisterEvent,
            "uuid": inPluginUUID
        };

        websocket.send(JSON.stringify(json));
    };

    websocket.onopen = function()
    {
        // WebSocket is connected, send message
        registerPlugin(pluginUUID);
        requestSettings(pluginUUID,"getGlobalSettings");
    };

    websocket.onmessage = function (evt)
    {
        // Received message from Stream Deck
        const jsonObj = JSON.parse(evt.data);
        const event = jsonObj['event'];
        const action = jsonObj['action'];
        const context = jsonObj['context'];
        const jsonPayload = jsonObj['payload'];
        console.log("main plugin onmessage",jsonObj)
        if(event == "keyUp")
        {
            const settings = jsonPayload['settings'];
            const coordinates = jsonPayload['coordinates'];
            const userDesiredState = jsonPayload['userDesiredState'];
            controlAction.onKeyUp(context, settings, coordinates, userDesiredState);
        }
        else if(event == "willAppear")
        {
            const settings = jsonPayload['settings'];
            const coordinates = jsonPayload['coordinates'];
            controlAction.onWillAppear(context, settings, coordinates);
        }
        else if (event == "propertyInspectorDidAppear") {
            
        }
        else if(event == "didReceiveSettings") {
                settingsCache[context] = jsonPayload;
            }

        else if(event == "didReceiveGlobalSettings") {

            }
        else if(event == "sendToPlugin") {

            }


        }
};
