require('dotenv').config()
const express = require('express');
const app = express();
const apiRoutes = require('./src/routes/apiRoutes');
const bodyParser = require('body-parser');

// Setup body parser middleware
app.use(bodyParser.json());

// Mount API routes
app.use('/', apiRoutes);



// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});