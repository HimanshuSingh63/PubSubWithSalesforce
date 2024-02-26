// Import necessary libraries
var express = require('express'); // Express.js for building the server
var bodyParser = require('body-parser'); // Body-parser for parsing the request body
var cors = require('cors'); // CORS for handling cross-origin requests
var mongoose = require('mongoose'); // Mongoose for MongoDB interactions

// Import the Google Cloud client library
const {PubSub} = require('@google-cloud/pubsub'); // Google Cloud Pub/Sub for real-time messaging

// Initialize Express.js
var app = express();
app.use(cors()); // Use CORS middleware

app.use(bodyParser.json()); // Use body-parser middleware to parse JSON request body
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Connect to MongoDB
mongoose.connect('mongodb+srv://himanshus:zr6DG3RgpqNaRkXV@cluster0.6dspaev.mongodb.net/HIC');

// Define Mongoose schema for Contact
var ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  website: String,
  message: String
});

// Create Mongoose model for Contact
var Contact = mongoose.model('Contact', ContactSchema);

// Initialize Google Cloud Pub/Sub client
const pubSubClient = new PubSub();

// Define your Google Cloud Pub/Sub topic
const topicName = 'projects/operating-ethos-414907/topics/SalesforceTopic';


// Define POST route for '/saveData'
app.post('/saveData', function(req, res) {
    // Create new Contact document
    var newContact = new Contact(req.body);
    
    // Save the Contact document to MongoDB
    newContact.save()
      .then(data => {
        // Send success response
        res.status(200).json({message: 'Data Saved Successfully', data: data});

        // Convert data object to JSON string
        let dataString = JSON.stringify(data);

        // Function to publish message to Google Cloud Pub/Sub
        async function publishMessage() {
          try {
            // Convert string to buffer
            const dataBuffer = Buffer.from(dataString);
            // Publish buffer to Google Cloud Pub/Sub
            const messageId = await pubSubClient.topic(topicName).publish(dataBuffer);

            console.log(`Message ${messageId} published.`);

          } catch (error) {
            console.error(`Received error while publishing: ${error.message}`);
          }
        }
        // Call the publish function
        publishMessage().catch(console.error);
      })
      .catch(err => {
        // Send error response
        res.status(500).json({message: 'Internal Server Error', error: err});
      });
});

                //  Listning Published Messages started

// Define your Google Cloud Pub/Sub subscription
const subscriptionName = 'projects/operating-ethos-414907/subscriptions/SalesforceTopic-sub';
// Reference the subscription
const subscription = pubSubClient.subscription(subscriptionName);
// Creating an event handler to handle messages
let messageHandler = (message) => {
  console.log(`Received message ${message.id}:`);
  console.log(`\tData: ${message.data}`);
  console.log(`\tAttributes: ${message.attributes}`);

  // "Ack" (acknowledge receipt of) the message
  // message.ack();
};

// Listen for new messages until timeout is hit
subscription.on(`message`, messageHandler);

//  Listning Published Messages Ending

// Define GET route for '/'
app.get('/', function(req, res) {
    res.send('Hello, World! Welcome');
});

// Start the server
app.listen(3000, function() {
  console.log('Server listening on port 3000');
});
