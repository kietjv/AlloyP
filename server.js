const express = require('express');
const app = express();
const path = require('path');
const routes = require('./routes/index');

 
require('dotenv').config();
const token = process.env.ALLOY_TOKEN;
const secret = process.env.ALLOY_SECRET;
const basicAuth = Buffer.from(`${token}:${secret}`).toString('base64');

// Parse JSON and form data FIRST
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve form
app.get('/homepage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
});

// Handle form submission
app.post('/submit', async (req, res) => {
  const formData = req.body;

  const alloyPayload = {
    name_first: formData.first_name,
    name_last: formData.last_name,
    address_line_1: formData.address1,
    address_city: formData.city,
    address_state: formData.state,
    address_postal_code: formData.zip,
    address_country_code: formData.country,
    document_ssn: formData.ssn,
    email_address: formData.email,
    birth_date: formData.dob,
  };

  try {
    // Step 1: Create evaluation
    const createRes = await fetch('https://sandbox.alloy.co/v1/evaluations', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify(alloyPayload)
    });

    const createResult = await createRes.json();
    const evaluationToken = createResult.evaluation_token;
    console.log(`Step 1: Evaluation token = ${evaluationToken}`);

    // Step 2: Fetch evaluation result
    const summaryRes = await fetch(`https://sandbox.alloy.co/v1/evaluations/${evaluationToken}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'Authorization': `Basic ${basicAuth}`
      }
    });

    const summary = await summaryRes.json();
    console.log('Step 2: Evaluation summary =', summary);
    console.log('Outcome =', summary.summary.outcome);

    // Simple decision output
    if (summary.summary.outcome === "Manual Review") {
      res.send(`
        <h1>Thank you!</h1>
        <p>We'll be in touch.</p>
      `);
    } else if (summary.summary.outcome === "Denied") {
      res.send(`
        <h1>Error!</h1>
        <p>Sorry, your application was not successful.</p>
      `);
    } else {
      res.send(`
        <h1>Approved!</h1>
        <p>Welcome aboard!</p>
      `);
    }

  } catch (err) {
    console.error('Error during Alloy evaluation process:', err);
    res.status(500).send('Something went wrong.');
  }
});


app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
