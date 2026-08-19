const {fecth_repo} = require('../controller/repos.controller');
const express = require('express');
const router = express.Router();

router.post('/details', fecth_repo);

module.exports = router;