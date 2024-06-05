const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// MongoDB setup
mongoose.connect('mongodb://localhost:27017/crud-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define a schema
const ItemSchema = new mongoose.Schema({
    name: String,
    description: String,
    profilePic: String
});

const Item = mongoose.model('Item', ItemSchema);

// Storage setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Create
app.post('/items', upload.single('profilePic'), (req, res) => {
    const newItem = new Item({
        name: req.body.name,
        description: req.body.description,
        profilePic: req.file ? req.file.path : ''
    });
    newItem.save().then(item => res.json(item)).catch(err => res.status(500).json(err));
});

// Read
app.get('/items', (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    Item.find()
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec()
        .then(items => res.json(items))
        .catch(err => res.status(500).json(err));
});

// Update
app.put('/items/:id', (req, res) => {
    Item.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .then(item => res.json(item))
        .catch(err => res.status(500).json(err));
});

// Delete
app.delete('/items/:id', (req, res) => {
    Item.findByIdAndDelete(req.params.id)
        .then(() => res.json({ success: true }))
        .catch(err => res.status(500).json(err));
});

// Third-party API (weather)
app.get('/weather', async (req, res) => {
    try {
        const response = await axios.get('https://api.weatherapi.com/v1/current.json', {
            params: {
                key: '7634c8aaf82444aead255807243005',
                q: req.query.location || 'San Francisco'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json(error);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
