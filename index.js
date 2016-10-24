'use strict';

var Promise = require('bluebird');
var ForecastIo = require('forecastio');
var Geocoder = Promise.promisifyAll(require('geocoder'));
var AWS = require("aws-sdk");

var config = require('dotenv').config();
var API_KEY = ''

/**
 * This sample shows how to create a simple Lambda function for handling speechlet requests.
 */

exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session, 
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    if ("Forecast" === intentName) {
        console.log("Forecast received");
        setForecastInSession(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var speechOutput = "Hello JD " +
        "Happy to find out weather status for you";
    var repromptText = "Tell me what would you like to know";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));
}

function buildSpeechletResponse(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

/**
 * Function of forcast
 */
function setForecastInSession(intent, session, callback) {
    console.log(intent);

    fetch(intent.slots.cityName.value).then(function (data) {
      console.log(data.temp.speech);
      var speechOutput = data.temp.speech;
      var repromptText = "";
      var shouldEndSession = true;
      var sessionAttributes = {};
                    
      callback(sessionAttributes,
          buildSpeechletResponse(speechOutput, repromptText, shouldEndSession));

    // response
    //   .say(data.temp.speech)
    //   .say(data.feelsLike.speech)
    //   .say(data.hourSummary)
    //   .say(data.daySummary)
    //   .send();
  });
}

function fetch(location) {
  location = location || config.DEFAULT_LOCATION;

  return Geocoder.geocodeAsync(location).then(function (data) {
    var coord = data.results[0].geometry.location;
    //var forecastIo = new ForecastIo(config.API_KEY);
    var forecastIo = new ForecastIo(API_KEY);
    return forecastIo.forecast(coord.lat, coord.lng);
  })
  .then(function(data) {
    var currently = data.currently;
    var temp = Math.round(currently.temperature);
    var feelsLike = Math.round(currently.apparentTemperature);

    return {
      temp: {
        speech: 'It\'s currently ' + temp + ' degrees.',
        value: temp
      },
      feelsLike: (feelsLike && Math.abs(feelsLike - temp) > config.FEELS_LIKE_THRESHOLD) && {
        speech: 'Feels like ' + feelsLike + ' degrees.',
        value: feelsLike
      },
      // hourSummary: data.minutely.summary,
      // daySummary: data.hourly.summary,
      // weekSummary: data.daily.summary
    }
  });
}

