const fs = require('fs');
const path = require('path');
const UserModel = require('../models/userModel');

// Path to the local database file
const dbPath = path.join(__dirname, '../database.json');

exports.handleForm = (req, res) => {
    const { name, password, aadhar, pan, ration } = req.body;

    // Form validation
    if (!name || !password || !aadhar || !pan || !ration) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!/^\d{12}$/.test(aadhar)) {
        return res.status(400).json({ error: 'Aadhar card number must be 12 digits.' });
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        return res.status(400).json({ error: 'PAN card number is invalid.' });
    }

    // Create a new user object
    const newUser = new UserModel(name, password, aadhar, pan, ration);

    // Read existing data from the database
    let users = [];
    if (fs.existsSync(dbPath)) {
        const rawData = fs.readFileSync(dbPath);
        users = JSON.parse(rawData);
    }

    // Add the new user to the list
    users.push(newUser);

    // Save the updated data back to the database
    fs.writeFileSync(dbPath, JSON.stringify(users, null, 2));

    res.status(200).json({ message: 'Form submitted successfully!' });
};
