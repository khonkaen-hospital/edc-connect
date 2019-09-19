const mqtt = require("mqtt");
var EventEmitter = require('events').EventEmitter;

var client;
var REQUEST_TOPIC  = '';
var RESPONSE_TOPIC = '';
var evm = new EventEmitter();

function start(option = { edcid, host, username, password }) {

  setRequestTopic(option.edcid)
  setResponseTopic(option.edcid)

  client = mqtt.connect("mqtt://" + option.host, {
    username: option.username,
    password: option.password
  });

  client.on("connect", function() {
    console.log("Mqtt connect...", client);
    client.subscribe(REQUEST_TOPIC, function(err, data) {
        console.log("subscrib topic=" + REQUEST_TOPIC, data);
    });
    client.subscribe(RESPONSE_TOPIC, function(err, data) {
        console.log("subscrib topic=" + RESPONSE_TOPIC, data);
    });
  });

  client.on("message", function(topic, msgData) {
    let message = msgData.toString();
    let json = undefined;
    console.log("On message, topic=", topic);
    if(message){
        try {
             json = JSON.parse(message);
        } catch (error) {
            console.log(error.message)
        }
    }
    if(REQUEST_TOPIC == topic && message){
        console.log('Request payment', message)
        evm.emit('request',json)
    } else if(RESPONSE_TOPIC == topic && message){
        console.log('Response payment', message)
        evm.emit('response',json)
    }
  });

  client.on("close", function() {
    console.log("On close");
  });

  client.on("error", function() {
    console.log("On error");
  });

  client.on("offline", function() {
    console.log("On offline");
  });
}

function stop() {
    try {
        client.unsubscribe(REQUEST_TOPIC);
        client.unsubscribe(RESPONSE_TOPIC);
        client.end();
        console.log('Stop mqtt')
    } catch (error) {
        console.log(error);
    }
}

function publish(topic, message) {
    console.log('publish',topic);
    client.publish(topic, message)
}

function subscribe(topic, calback=()=> {}) {
    client.subscribe(topic, calback)
}

function setResponseTopic(edcid){
    return RESPONSE_TOPIC = '/edc/response/' + edcid;
}

function setRequestTopic(edcid){
    return REQUEST_TOPIC = '/edc/request/' + edcid;
}

function getResponseTopic(){
    return RESPONSE_TOPIC;
}

function getRequestTopic(){
    return REQUEST_TOPIC;
}

module.exports = {
  getResponseTopic: getResponseTopic,
  getRequestTopic: getRequestTopic,
  start: start,
  stop: stop,
  publish: publish,
  subscribe: subscribe,
  event: evm
};
