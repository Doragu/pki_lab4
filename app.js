const { google } = require('googleapis');
const express = require('express')
const OAuth2Data = require('./google_key.json')

const app = express()

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[1]

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authed = false;

const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

client.connect()

app.get('/', (req, res) => {
    var response = '<form method="get" action="/login"><button type="submit">Zaloguj</button></form> <br> Results from db: <br>'
    updateData((queryResult) => {
        res.send(response + queryResult)
    })
})

app.get('/login', (req, res) => {
    if (!authed) {
        // Generate an OAuth URL and redirect there
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/userinfo.profile'
        });
        console.log(url)
        res.redirect(url);
    } else {
        var oauth2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
        oauth2.userinfo.v2.me.get(function(err, result) {
            if (err) {
                console.log('BŁĄD');
                console.log(err);
            } else {
                loggedUser = result.data.name;
                console.log(loggedUser);
                updateDB(loggedUser)
            }
            res.send('Logged in: '.concat(loggedUser,' <img src="', result.data.picture, 
                    '"height="23" width="23"><br><form method="get" action="/logout"><button type="submit">Wyloguj</button></form>'));
        });
    } 
})

app.get('/logout', (req, res) => {
    authed = false;
    res.redirect(OAuth2Data.web.javascript_origins[1])
})

app.get('/auth/google/callback', function (req, res) {
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                oAuth2Client.setCredentials(tokens);
                authed = true;
                res.redirect('/login')
            }
        });
    }
});

function updateDB(username) {
    client.query(`SELECT * FROM public."users" WHERE name = '${username}';`, (error, result) => {
        if (error) {
            throw error
        } 
  
        console.log(result)
        console.log("Rows: " + result.length)
        if (result.length <= 0) {
            client.query(`INSERT INTO public."users" (name, counter) VALUES ('${username}', 1);`, (error, result) => {
                if (error) {
                    throw error
                } 
            })
        } else {
            client.query(`UPDATE public."users" SET counter = counter + 1, lastvisit = NOW() WHERE name = '${username}';`, (error, result) => {
                if (error) {
                    throw error
                } 
            })
        }
    })
}

function updateData(callback) {
    queryResult = ''

    client.query('SELECT * FROM public."users";', (error, result) => {
        if (error) {
            throw error
        }
        
        for (let row of result.rows) {
            queryResult = queryResult.concat(JSON.stringify(row) + '<br>')
        }
        
        callback(queryResult)
    })
}

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Server running at ${port}`));

// Heroku link: https://frozen-scrubland-88807.herokuapp.com/