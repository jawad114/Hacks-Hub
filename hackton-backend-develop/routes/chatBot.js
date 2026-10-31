/* eslint-disable no-use-before-define */
const { Router } = require('express');
const authenticate = require('../api/auth/authenticate');
const botController=require('./../controllers/botController/botController')


const router = Router();

router.get('/', botController.chatBot);

module.exports = router;