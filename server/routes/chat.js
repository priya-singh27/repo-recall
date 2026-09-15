const express = require('express');
const {requireAuth} = require('../middleware/auth')
const router = express.Router();
const {sendChatBot} = require('../controller/chat.controller')

router.use(requireAuth);

router.post('/', sendChatBot);

module.exports=router;