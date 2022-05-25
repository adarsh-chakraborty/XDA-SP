if (!process.env.HEROKU) {
  require('dotenv').config();
}

/* Modules */
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

/* Constants */
const PORT = process.env.PORT || 9000;

/* Routes */
const apiRoutes = require('./routes/apiRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(apiRoutes);
mongoose.connect(process.env.MONGODB_URI, (err) => {
  if (err) {
    console.log('Error connecting to mongodb.');
    return;
  }
  console.log('Connected to mongodb.');
  app.listen(PORT, () => {
    console.log('Server is listening on PORT: ', PORT);
  });
});
