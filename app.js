const express = require('express');
const http = require('http'); // Required to integrate Socket.IO
const { Server } = require('socket.io'); // For WebSocket functionality
const app = express();
const routes = require('./routes')
require('dotenv').config();
const cors = require('cors');
const { errorMiddleware } = require('./middleware/errorMiddleware');
const sql = require('msnodesqlv8');

app.use(express.json());
// Enable CORS for all routes
app.use(cors({
    origin: '*', // Replace this with the frontend URL, or use '*' for all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies and credentials to be included
}));

// Middleware to handle preflight requests
app.options('*', cors()); // Enable preflight for all routes

// app router initialization
app.use('/api', routes)
// Error Middleware (Should be the last)
app.use(errorMiddleware)

// Create HTTP server
const server = http.createServer(app);

module.exports = { app, server };