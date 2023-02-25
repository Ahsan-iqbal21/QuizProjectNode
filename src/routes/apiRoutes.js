const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController/quizController');

// Define API routes
router.post('/api/quizzes', quizController.postQuiz);
router.get('/api/quizzes/:id', quizController.getQuiz);

module.exports = router;