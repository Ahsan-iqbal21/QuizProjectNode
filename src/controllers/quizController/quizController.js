const client = require('../../config/database')

// Post api for quizzes
exports.postQuiz =  async (req, res) => {
    const quizData = req.body;

    // validate quizData
    let {validate, errorMessage} = validateData(quizData)

    if(validate){
        try {
            // Start a database transaction
            // client = await client.connect()
            await client.query('BEGIN');
        
            // Save the quiz to the database
            const quiz = await createQuiz(quizData);
        
            // Commit the transaction
            await client.query('COMMIT');
        
            // send response
            res.status(200).json({ 
                success: true,
                error: null,
                data: quiz
            })
          } catch (err) {
            // Roll back the transaction and return an error
            await client.query('ROLLBACK');
            res.status(500).json({ 
                success: false,
                error: 'internal server error',
                data: null
            })
          }
    }
    else {
        res.status(400).json({ 
            success: false,
            error: errorMessage,
            data: null
        })
    }
};

// Get api for quizzes 
exports.getQuiz =  async (req, res)  => {
    try {
      const { id } = req.params;
  
      // Get quiz details from database
      const quizData = await getQuizById(id);
  
      res.status(200).json({ 
        success: true,
        error: null,
        data: quizData
      });
    } catch (err) {
      res.status(500).json({ 
        success: false,
        error: 'internal server error',
        data: null
      });
    }
};

// Validate data for post/put api
const validateData = (quizData) => {
    // Check the request body
    if (!quizData || Object.keys(quizData).length === 0) {
        return {
            validate: false,
            errorMessage: 'undefined request body'
        }
    }

    // Check that the quiz has a title
    if (!quizData.title) {
        return {
            validate: false,
            errorMessage: 'Quiz must have a title'
        }
    }

    // Check taht the quiz have a title
    if (!quizData.description) {
        return {
            validate: false,
            errorMessage: 'Quiz must have a description'
        }
    }

    // Check taht the quiz have a publised status
    if (!quizData.published) {
        return {
            validate: false,
            errorMessage: 'Quiz must have publised set as true or false'
        }
    }


    // Check that the quiz has at least one question
    if (!quizData.questions || quizData.questions.length < 1) {
        return {
            validate: false,
            errorMessage: 'Quiz must have at least one question'
        }
    }

    // Check each question and its options
    for (const question of quizData.questions) {

        // Check that the question has a text
        if (!question.text) {
            return {
                validate: false,
                errorMessage: 'Questions must have a question statement'
            }
        }

        // Check that the question has at least one option
        if (!question.options || question.options.length < 1) {
            return {
                validate: false,
                errorMessage: 'Questions must have at least one option'
            }
        }

        // Check each option
        let hasCorrectOption = false;
        for (const option of question.options) {

            // Check that the option has a text
            if (!option.text) {
                return {
                    validate: false,
                    errorMessage: 'Options must have a text'
                }
            }

            // Check that at least one option is correct
            if (option.is_correct) {
                hasCorrectOption = true;
            }
        }
        if (!hasCorrectOption) {
            return {
                validate: false,
                errorMessage: 'Question must have at least one correct option'
            }
        }
    }

    // data is correctly validated
    return {
        validate: true,
        errorMessage: ''
    }
}

// Helper function to save quiz data to database
async function createQuiz(quizData) {
    const { title, description, questions, published } = quizData;
  
    // Insert the quiz into the database
    const { rows: [{ quiz_id }] } = await client.query(
      `INSERT INTO quizzes (title, description, published, "createdAt", "updatedAt", "publishedAt") 
       VALUES ($1, $2, $3, NOW(), NOW(), NOW()) 
       RETURNING quiz_id`,
      [title, description, published]
    );
  
    // Insert the questions and options into the database
    const insertedQuestions = [];
    for (const question of questions) {
      const { text, options, mandatory } = question;
  
      // Insert the question into the database
      const { rows: [{ question_id }] } = await client.query(
        `INSERT INTO questions (quiz_id, text, mandatory) 
         VALUES ($1, $2, $3) 
         RETURNING question_id, mandatory`,
        [quiz_id, text, mandatory ? mandatory : false]
      );
  
      // Insert the options into the database
      const insertedOptions = [];
      for (const option of options) {
        const { text, is_correct } = option;
        const { rows: [{ option_id }] } = await client.query(
          `INSERT INTO options (question_id, text, is_correct) 
           VALUES ($1, $2, $3) 
           RETURNING option_id`,
          [question_id, text, is_correct]
        );
        insertedOptions.push({ option_id, text, is_correct });
      }
  
      insertedQuestions.push({ question_id, mandatory: mandatory ? mandatory : false, text, options: insertedOptions });
    }
  
    // Get the inserted quiz data from the database with IDs
    const { rows: [insertedQuiz] } = await client.query(
      `SELECT * FROM quizzes 
       WHERE quiz_id = $1`,
      [quiz_id]
    );
  
    // Add the inserted questions and options to the quiz data
    insertedQuiz.questions = insertedQuestions;
  
    // Return the inserted quiz
    return insertedQuiz
}

// Helper function to get the quiz, given the quiz id
async function getQuizById(quiz_id) {

    let id = quiz_id
  
    try {

        // retrieve quiz information from database
        const { rows } = await client.query(
            `SELECT quizzes.quiz_id, quizzes.title, quizzes.description, quizzes.published, quizzes."createdAt", quizzes."updatedAt", quizzes."publishedAt",
                   questions.question_id, questions.text, questions.mandatory,
                   options.option_id, options.text, options.is_correct
            FROM quizzes
            LEFT JOIN questions ON quizzes.quiz_id = questions.quiz_id
            LEFT JOIN options ON questions.question_id = options.question_id
            WHERE quizzes.quiz_id = $1`,
            [id]
        );
    
        if (rows.length === 0) {
            return null; // quiz not found
        }

        // create an object to store the quiz details
        const quiz = {
            quiz_id: rows[0].quiz_id,
            title: rows[0].title,
            description: rows[0].description,
            published: rows[0].published,
            createdAt: rows[0].createdAt.toISOString(),
            updatedAt: rows[0].updatedAt,
            publishedAt: rows[0].publishedAt,
            questions: []
        };

                
        // iterate over the rows and add questions and options to the quiz object
        let currentQuestionId = null;
        let currentQuestion = null;
        for (let row of rows) {
            if (row.question_id !== currentQuestionId) {
                // new question
                currentQuestionId = row.question_id;
                currentQuestion = {
                    question_id: row.question_id,
                    text: row.text,
                    mandatory: row.mandatory,
                    options: []
                };
                quiz.questions.push(currentQuestion);
            }

            // add option to current question
            currentQuestion.options.push({
                option_id: row.option_id,
                text: row.text,
                is_correct: row.is_correct
            });
        }
        return quiz;
    } catch (err) {
        return null; // error occurred
    }
};
  