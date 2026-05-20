#!/usr/bin/env node

// Copyright (C) 2017-2023 Smart code 203358507

const INDEX_CACHE = 7200;
const ASSETS_CACHE = 2629744;
const HTTP_PORT = process.env.PORT || 8080;

const AUTH_USER = process.env.AUTH_USER || 'kinasih';
const AUTH_PASS = process.env.AUTH_PASS || 'stream2024';
const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false';

const express = require('express');
const path = require('path');

const build_path = path.resolve(__dirname, 'build');
const index_path = path.join(build_path, 'index.html');

const app = express();

if (AUTH_ENABLED) {
    app.use((req, res, next) => {
        const authorization = req.headers['authorization'];
        if (!authorization) {
            res.set('WWW-Authenticate', 'Basic realm="Kinasih Stream"');
            return res.status(401).send('Authentication required.');
        }
        const [scheme, encoded] = authorization.split(' ');
        if (scheme !== 'Basic' || !encoded) {
            return res.status(400).send('Invalid authorization header.');
        }
        const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
        if (user !== AUTH_USER || pass !== AUTH_PASS) {
            res.set('WWW-Authenticate', 'Basic realm="Kinasih Stream"');
            return res.status(401).send('Invalid credentials.');
        }
        next();
    });
    console.info(`Basic auth enabled — user: ${AUTH_USER}`);
}

app.use(express.static(build_path, {
    setHeaders: (res, filePath) => {
        if (filePath === index_path) res.set('cache-control', `public, max-age: ${INDEX_CACHE}`);
        else res.set('cache-control', `public, max-age: ${ASSETS_CACHE}`);
    }
})).all('*', (_req, res) => {
    // TODO: better 404 page
    res.status(404).send('<h1>404! Page not found</h1>');
}).listen(HTTP_PORT, () => console.info(`Server listening on port: ${HTTP_PORT}`));
