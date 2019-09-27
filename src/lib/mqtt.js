const mqtt = require("mqtt");
var EventEmitter = require('events').EventEmitter;

var client;
var isConnect = false;
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
    isConnect =  true
    console.log("Mqtt connect...", client);
    log('Mqtt Connect')
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
    isConnect =  false
    console.log("On close");
    log('Mqtt close')
  });

  client.on("error", function(err) {
    isConnect =  false
    console.log("On error",error.message);
    log('Mqtt Error')
  });

  client.on("offline", function() {
    isConnect =  false
    console.log("On offline");
    log('MQTT Offline')
  });
}

function stop() {
    isConnect =  false
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
    if(isConnect) { 
      console.log('publish', topic);
      client.publish(topic, message)
      return true;
    } else {
      log('MQTT is not connected')
      console.log('MQTT is not connected');
      return false;
    }
}

function subscribe(topic, calback=()=> {}) {
  if(isConnect) { 
    client.subscribe(topic, calback)
  } else {
    log('MQTT is not connected')
  }
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

function getClient(){
  return client;
}

function log(message){
  evm.emit('log',message)
}

module.exports = {
  getResponseTopic: getResponseTopic,
  getRequestTopic: getRequestTopic,
  start: start,
  stop: stop,
  publish: publish,
  subscribe: subscribe,
  event: evm,
  getClient: getClient,
  isConnect: isConnect
};
