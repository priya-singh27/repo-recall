const {fecth_repo, fetch_files, get_embedding} = require('../controller/repos.controller');
const express = require('express');
const router = express.Router();

router.post('/details', fecth_repo);
router.post('/files', fetch_files);
router.post('/index', get_embedding);

module.exports = router;