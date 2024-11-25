const express = require('express');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

// Initialize the app
const app = express();

// Setup the uploads folder if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configure storage for Multer (for file uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files to the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware for parsing incoming data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (uploaded files, for example)
app.use(express.static(__dirname));

// Serve Landing Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landingpage.html')); // Landing page
});

// Serve Signup Page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html')); // Signup page
});

// Serve Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html')); // Login page
});

// Submit Registration Route (POST request to create a new user)
app.post('/login', (req, res) => {
    const { email, username, password } = req.body;

    let data = [];
    const dataFilePath = path.join(__dirname, 'uploads', 'data.json');

    if (fs.existsSync(dataFilePath)) {
        try {
            data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error reading user data. Please try again later.' });
        }
    }

    const user = data.find(user => user.username === username && user.email === email);

    if (user && user.password === password) {
        // Respond with a JSON success message
        res.json({ success: true, redirectUrl: '/filters.html' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username, email, or password.' });
    }
});


// Login Route (POST request to authenticate user)
app.post('/login', (req, res) => {
    const { email, username, password } = req.body;

    let data = [];
    if (fs.existsSync('uploads/data.json')) {
        data = JSON.parse(fs.readFileSync('uploads/data.json', 'utf8'));
    }

    const user = data.find(user => user.username === username && user.email === email);

    if (user && user.password === password) {
        res.json({ success: true, username: user.username });
    } else {
        res.json({ success: false, message: 'Invalid username, email, or password.' });
    }
});


// Delete Account Route (POST request to delete a user)
app.post('/delete-account', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: 'You must be logged in to delete your account.' });
    }

    let data = [];
    try {
        if (fs.existsSync('uploads/data.json')) {
            data = JSON.parse(fs.readFileSync('uploads/data.json', 'utf8'));
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error reading user data.' });
    }

    const userIndex = data.findIndex(user => user.username === username);

    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    data.splice(userIndex, 1); // Remove user from data

    try {
        fs.writeFileSync('uploads/data.json', JSON.stringify(data, null, 2)); // Write updated data
        res.json({ success: true, message: 'Account deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error writing user data.' });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
