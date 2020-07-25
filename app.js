const express = require('express');
const app = express();
const helmet = require('helmet');
const axios = require('axios');
const cors = require('cors');

// common middlewire
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(cors());

require('dotenv/config');

// import routes
app.get('/api/v1/oauth/login', async (req, res, next) => {
    console.log('call comes');
    let config = {
        url: 'https://github.com/login/oauth/authorize',
        params: {
            client_id: process.env.CLIENT_ID,
            scope: 'user',
            redirect_uri: 'http://127.0.0.1:4000/api/v1/oauth/redirect',
            state: process.env.STATE
        }
    };
    try {
        const response = await axios.request(config);
        const permissionPage = response.data;
        console.log(permissionPage);
        res.send(permissionPage);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

app.get('/api/v1/oauth/redirect', async (req, res, next) => {
    const authCode = req.query.code;

    let config = {
        url: 'https://github.com/login/oauth/access_token',
        method: 'post',
        data: {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code: authCode
        },
        headers: {
            accept: 'application/json'
        }
    };
    try {
        const response = await axios.request(config);
        console.log(response.data, typeof response.data);
        var { access_token, scope, token_type } = response.data;
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }

    // fetch scope data
    config = {
        url: `https://api.github.com/${scope}`,
        headers: {
            Authorization: 'token ' + access_token,
            accept: 'application/json'
        }
    };
    try {
        let response = await axios.request(config);
        const user = response.data;
        console.log(user);
        response = {
            username: user.login,
            followers: user.followers,
            following: user.following,
            public_repos: user.public_repos
        };
        res.status(200).send(response);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.status(404).send();
});

app.listen(4000, () =>
    console.log(`oauth server is up and running at port 4000`)
);
