const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware to parse incoming form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Store files in 'uploads' directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });

// Serve the index.html on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to handle form submission
app.post('/submit', upload.fields([
    { name: 'income_cert', maxCount: 1 },
    { name: 'caste_cert', maxCount: 1 }
]), (req, res) => {
    console.log('Form Data:', req.body); // Log form data
    console.log('Uploaded Files:', req.files); // Log files

    // Prepare form data
    const formData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        aadhar: req.body.aadhar,
        age: req.body.age,
        gender: req.body.gender,
        state: req.body.state,
        caste: req.body.caste,
        income: req.body.income,
        caste_cert: req.files['caste_cert'] ? req.files['caste_cert'][0].path : null,
        income_cert: req.files['income_cert'] ? req.files['income_cert'][0].path : null,
    };

    // Path to the JSON file where data will be stored
    const dataFilePath = path.join(__dirname, 'views', 'data.json');

    // Read existing data from the file
    let existingData = [];
    try {
        if (fs.existsSync(dataFilePath)) {
            const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
            if (fileContent.trim()) {
                existingData = JSON.parse(fileContent);
            }
        }
    } catch (error) {
        console.error('Error reading or parsing data.json:', error.message);
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

    // Write updated data to the JSON file
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2), 'utf-8');
        console.log('Form data saved to data.json:', formData);

        // Redirect to update-files.html with the username as a query parameter
        res.redirect(`/update-files.html?username=${encodeURIComponent(formData.username)}`);
    } catch (error) {
        console.error('Error writing to data.json:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
