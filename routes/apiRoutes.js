const express = require('express');
const Router = express.Router();
const PostController = require('../controller/PostController');

Router.post('/post', PostController.postCreate);
Router.post('/track', PostController.postTrack);
Router.post('/postservice', PostController.postservice);
Router.post('/postapproved', PostController.postApproved);

module.exports = Router;
