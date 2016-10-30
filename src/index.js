'use strict';

var AWS = require("aws-sdk");
var Promise = require('bluebird');
var ForecastIo = require('forecastio');
var Geocoder = Promise.promisifyAll(require('geocoder'));
var config = require('dotenv').config();
var APP_ID = '';

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

var WeatherMe = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
WeatherMe.prototype = Object.create(AlexaSkill.prototype);
WeatherMe.prototype.constructor = WeatherMe;

WeatherMe.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("WeatherMe onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

WeatherMe.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("WeatherMe onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

WeatherMe.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("WeatherMe onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

WeatherMe.prototype.intentHandlers = {
    "Forecast": function (intent, session, response) {
        fetchForecast(intent, session, response);
    },

    "ForecastToday": function (intent, session, response) {
        fetchForecastToday(intent, session, response);
    },

    "ForecastWeek": function (intent, session, response) {
        fetchForecastWeek(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        helpTheUser(intent, session, response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

/**
 * Returns the welcome response for when a user invokes this skill.
 */
function getWelcomeResponse(response) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var speechText = "Hello JD " +
        "Happy to find out weather status for you";

    var repromptText = {};
    // var repromptText = "<speak>Please choose a category by saying, " +
    //     "books <break time=\"0.2s\" /> " +
    //     "fashion <break time=\"0.2s\" /> " +
    //     "movie <break time=\"0.2s\" /> " +
    //     "kitchen</speak>";

    var speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechOutput, repromptOutput);
}

/**
 * Function of Forcast
 */
function fetchForecast(intent, session, callback) {
    console.log("fetchForecast function");

    var cityName = intent.slots.cityName;
    var repromptText = "";
    var sessionAttributes = {};

    console.log(cityName.value);

    fetch(cityName.value).then(function (data) {
      var speechOutput = data.temp.speech + data.windSpeed.speech + data.apparentTemp.speech;
      var repromptText = "";
      var shouldEndSession = true;
      var sessionAttributes = {};
                    
      response.tell(speechOutput);

  });
}

/**
 * Function of ForcastToday
 */
function fetchForecastToday(intent, session, callback) {

    var cityName = intent.slots.cityName;
    var repromptText = "";
    var sessionAttributes = {};

    fetch(cityName.value).then(function (data) {
      var speechOutput = data.hourlyData.speech;
      var repromptText = "";
      var shouldEndSession = true;
      var sessionAttributes = {};
                    
      response.tell(speechOutput);

  });
}

/**
 * Function of ForcastToday
 */
function fetchForecastWeek(intent, session, callback) {
    
    var cityName = intent.slots.cityName;
    var repromptText = "";
    var sessionAttributes = {};

    fetch(cityName.value).then(function (data) {
      var speechOutput = data.dailyData.speech;
      var repromptText = "";
      var shouldEndSession = true;
      var sessionAttributes = {};
                    
      response.tell(speechOutput);

  });
}

function fetch(location) {
  location = location || config.DEFAULT_LOCATION;
  var options = {
  units: 'si'
  };

  return Geocoder.geocodeAsync(location).then(function (data) {
    var coord = data.results[0].geometry.location;

    console.log(coord);
    var forecastIo = new ForecastIo(config.API_KEY);
    return forecastIo.forecast(coord.lat, coord.lng, options);
  })
  .then(function(data) {
    var currently = data.currently;
    var temp = Math.round(currently.temperature);
    var windSpeed = currently.windSpeed
    var apparentTemp = Math.round(currently.apparentTemperature);
    var hourlyData = data.hourly;
    var dailyData = data.daily;

    return {
      temp: {
        speech: 'It\'s currently ' + temp + ' degrees. ',
        value: temp
      },
      windSpeed: {
        speech: 'and the wind speed is ' + windSpeed + ' Meters per second. ',
        value: windSpeed
      },
      apparentTemp: {
        speech: 'You might feels like ' + apparentTemp + ' degrees. ',
        value: apparentTemp
      },
      hourlyData: {
        speech: 'Today in summary ' + hourlyData.summary,
        value: hourlyData.summary
      },
      dailyData: {
        speech: 'This week in summary ' + dailyData.summary,
        value: dailyData.summary
      },
    }
  });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var weatherMe = new WeatherMe();
    weatherMe.execute(event, context);
};

