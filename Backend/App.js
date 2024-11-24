const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (like CSS, JS) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Set up Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store files in the "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Store file with a unique name
  },
});

const upload = multer({ storage });

// POST /submit route to handle form submission and file uploads
app.post('/submit', upload.fields([
  { name: 'income_cert', maxCount: 1 },
  { name: 'spouse_cert', maxCount: 1 }
]), (req, res) => {
  const formData = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    aadhar: req.body.aadhar,
    age: req.body.age,
    gender: req.body.gender,
    state: req.body.state,
    caste: req.body.caste,
    caste_cert: req.files['caste_cert'] ? req.files['caste_cert'][0].path : null,
    income: req.body.income,
    income_cert: req.files['income_cert'] ? req.files['income_cert'][0].path : null,
  };

  const viewsDir = path.join(__dirname, 'views');
  if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir);
  }

  const filePath = path.join(viewsDir, 'data.json');

  let existingData = [];
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (fileContent.trim()) {
        existingData = JSON.parse(fileContent);
      }
    }
  } catch (error) {
    console.error('Error reading or parsing data.json:', error.message);
    existingData = [];
  }

  // Check if Aadhaar number already exists
  const isDuplicate = existingData.some(user => user.aadhar === formData.aadhar);

  if (isDuplicate) {
    console.log('A user with the same Aadhaar number already exists:', formData.aadhar);
    res.status(400).send('Error: User with this Aadhaar number already exists');
    return;
  }

  // Add the new user data if no duplicate found
  existingData.push(formData);

  try {
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    console.log('Form data saved to data.json:', formData);
    res.redirect('/update-files.html');
  } catch (error) {
    console.error('Error writing to data.json:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Serve `index.html` as the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET route for login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// POST route for login form submission, fetching data from data.json
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const filePath = path.join(__dirname, 'views', 'data.json');

  let existingData = [];
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (fileContent.trim()) {
        existingData = JSON.parse(fileContent);
      }
    }
  } catch (error) {
    console.error('Error reading or parsing data.json:', error.message);
  }

  const user = existingData.find(user => user.username === username && user.password === password);
  if (user) {
    res.json({ message: 'Login successful', user });
  } else {
    res.status(401).send('Invalid username or password');
  }
});

// Profile update and delete options
app.post('/profile/update', (req, res) => {
  const { aadhar, updatedData } = req.body; // Expecting 'updatedData' to be an object containing the fields to be updated
  const filePath = path.join(__dirname, 'views', 'data.json');

  let existingData = [];
  try {
    if (fs.existsSync(filePath)) {
      existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error reading data.json:', error.message);
    return res.status(500).send('Error reading data file');
  }

  // Find the user by Aadhaar
  const userIndex = existingData.findIndex(user => user.aadhar === aadhar);
  if (userIndex >= 0) {
    // Merge updated data with existing user data
    existingData[userIndex] = { ...existingData[userIndex], ...updatedData };

    try {
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
      res.send('Profile updated successfully');
    } catch (error) {
      console.error('Error writing to data.json:', error.message);
      res.status(500).send('Error updating data');
    }
  } else {
    res.status(404).send('User not found');
  }
});

app.post('/profile/delete', (req, res) => {
  const { aadhar } = req.body;
  const filePath = path.join(__dirname, 'views', 'data.json');

  let existingData = [];
  try {
    if (fs.existsSync(filePath)) {
      existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error reading data.json:', error.message);
    return res.status(500).send('Error reading data file');
  }

  // Filter out the user with the given Aadhaar
  const updatedData = existingData.filter(user => user.aadhar !== aadhar);

  // If the user exists, proceed with deletion
  if (updatedData.length !== existingData.length) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
      res.send('Account deleted successfully');
    } catch (error) {
      console.error('Error writing to data.json:', error.message);
      res.status(500).send('Error deleting account');
    }
  } else {
    res.status(404).send('User not found');
  }
});

// Serve `update-files.html` after form submission
app.get('/update-files.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'update-files.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
