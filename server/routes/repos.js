const {fecth_repo, fetch_files, embed_content, fetch_file_content} = require('../controller/repos.controller');
const express = require('express');
const {requireAuth}= require('../middleware/auth')

const router = express.Router()

router.use(requireAuth);

router.post('/', fecth_repo);
router.post('/files', fetch_files);
router.post('/index', embed_content);
router.post('/file', fetch_file_content);

module.exports = router;