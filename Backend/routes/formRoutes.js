const express = require('express');
const formController = require('../controllers/formController');

const router = express.Router();

// Route to handle form submission
router.post('/submit', formController.handleForm);

module.exports = router;
