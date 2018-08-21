require('dotenv').config();
const chalk = require('chalk');
const fs = require('fs');
const keys = require('./keys');
const moment = require('moment');
const readline = require('readline');
const request = require('request');
const Spotify = require('node-spotify-api');

function selectAction(actionName, searchTerm) {
    const action = actionName || process.argv[2];
    switch(action) {
        case "spotify-this-song":
            spotifyThisSong(searchTerm);
            break;
        case "concert-this":
            concertThis(searchTerm);
            break;
        case "movie-this":
            movieThis(searchTerm);
            break;
        case "do-what-it-says":
            doWhatItSays(searchTerm);
            break;
        default:
            console.log("Sorry I don't understand you... Goodbye!");
            break;
    }
}

function spotifyThisSong(song) {
    const spotify = new Spotify(keys.spotify);
    const searchTerm = song || getSearchTerm();
    
    spotify.search({type: "track", query: searchTerm}, (err, data) => {
        if (err) {
            return console.log("BAAARRRFFF XP ", err);
        }

        const trackInfo = data.tracks.items.find(track => {
            return track.name.toLowerCase() === searchTerm.toLowerCase();
        });
        
        // In case we don't have a track match
        const rickRoll = "https://open.spotify.com/track/7GhIk7Il098yCjg4BQjzvb?si=0HYy5VBcR_mBPurX8hY6uA";
        
        if (trackInfo) {
            console.log("\n" + chalk.green("Artist: ") + chalk.blue(trackInfo.artists[0].name));
            console.log(chalk.green("Song: ") + chalk.blue(trackInfo.name));
            console.log(chalk.green("Album: ") + chalk.blue(trackInfo.album.name));
            console.log(chalk.green("Preview: ") + chalk.blue(trackInfo.preview_url));
            console.log(chalk.green("Spotify URI: ") + chalk.blue(trackInfo.uri) + "\n");
        } else {
            console.log(chalk.red("\nSorry. We couldn't find ") + chalk.blue(searchTerm) + chalk.red(", but have you listened to this?"));
            console.log(chalk.blue(rickRoll));
        }
    });
}

function concertThis(band) {
    const artist = band || getSearchTerm();

    const queryUrl = "https://rest.bandsintown.com/artists/" + artist + "/events?app_id=codingbootcamp";

    request.get(queryUrl, (err, response) => {
        if (err) {
            return console.log(err);
        }

        // Wrapping JSON.parse call in a try because
        // the api will return invalid json if there 
        // aren't any results for that band.
        try {
            const data = JSON.parse(response.body);
            
            console.log(chalk.blue("\nConcert results for: ") + chalk.blue(artist) + "\n");
    
            if (data.length > 0) {
                data.forEach(function(item) {
                    console.log(chalk.green("\nVenue Name:", chalk.blue(item.venue.name)));
                    console.log(chalk.green("Venue Location:"), chalk.blue(item.venue.city + ", " + item.venue.region + " " + item.venue.country));
                    console.log(chalk.green("Concert Date:"),  chalk.blue(moment(item.datetime).format("LLLL") + "\n\n"));
                });
            } else {
                console.log(chalk.green(artist) + chalk.red(" doesn't seem to be have any upcoming shows."));
            }
        } catch(e) {
            console.log(chalk.red("\nbandsintown doesn't have a band record for " + artist + ".\n"));
            console.log(e);
        }
    });
}

function movieThis(movie) {
    const searchTerm = movie || getSearchTerm();
    const queryUrl = "http://www.omdbapi.com/?apikey=trilogy&t=" + searchTerm;
    
    request.get(queryUrl, (err, response) => {
        if (err) {
            return console.log(chalk.red(err));
        }
        
        const data = JSON.parse(response.body);
        
        if (data.Respone === "False" || data.Error === "Movie not found!") {
            console.log(chalk.red("\nI wasn't able to find your movie, but have you seen Mr. Nobody?"));
            console.log(chalk.yellow("It's on Netflix, you should check it out!"));
            console.log(chalk.blue("http://www.imdb.com/title/tt0485947/\n\n"));
        } else {
            const imdbRating = data.Ratings.find(rating => rating.Source === "Internet Movie Database") && data.Ratings.find(rating => rating.Source === "Internet Movie Database").Value || "N/A";
            const rtRating = data.Ratings.find(rating => rating.Source === "Rotten Tomatoes") && data.Ratings.find(rating => rating.Source === "Rotten Tomatoes").Value || "N/A";
            
            console.log(chalk.green("\n" + data.Title));
            console.log(chalk.yellow("Release Year: ") + chalk.blue(data.Year));
            console.log(chalk.yellow("IMDB Rating: ") + chalk.blue(imdbRating));
            console.log(chalk.yellow("Rotten Tomatoes Rating: ") + chalk.blue(rtRating));
            console.log(chalk.yellow("Countries of Production: ") + chalk.blue(data.Country));
            console.log(chalk.yellow("Plot: ") + chalk.blue(data.Plot));
            console.log(chalk.yellow("Actors: ") + chalk.blue(data.Actors) + "\n");
        }
    });
}

function doWhatItSays() {
    const inputReader = readline.createInterface({
        input: fs.createReadStream('random.txt')
    });
    
    inputReader.on('line', line => {
        const actionName = line.split(",")[0];
        const searchTerm = line.split(",")[1];
        selectAction(actionName, searchTerm);
    });
}

function getSearchTerm() {
    let searchTerm = "";
    for (let i = 3; i < process.argv.length; i++) {
        searchTerm += " " + process.argv[i];
    }
    return searchTerm.trim();
}

selectAction();

