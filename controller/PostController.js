const puppeteer = require('puppeteer');
const Post = require('../model/Post');
const { nanoid } = require('nanoid');
const axios = require('axios').default;

const BotURL = process.env.HEROKU
  ? 'http://doge-boot.herokuapp.com'
  : 'http://localhost:3000';

const postCreate = async (req, res, next) => {
  const post = req.body?.post?.trim?.();
  console.log(req.body.post);
  if (!post) {
    res.status(400).json({ error: 'Post cannot be empty.' });
  }

  const postTrackingId = nanoid();
  const data = await Post.create({ text: post, trackingId: postTrackingId });
  console.log(data);
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XDA SP</title>
        <style>
            *{
                box-sizing: border-box;
                font-family: Arial, Helvetica, sans-serif;
                text-align: center;
                color: darkslategray;
                
            }
            h2,h3{
                padding-left: 20px;
            }
        </style>
    </head>
    <body>
        <h2>Your post has been submitted for approval!</h2>
        <hr />
        <img src="https://c.tenor.com/4otr5S3l1agAAAAj/dancing-duckdancing.gif" alt="">
        <h3>You can use this Tracking ID: <strong>${postTrackingId}</strong> to track the status of your post :)</h3>
        <br><br><br><br><br>
        <hr />
        <p>&copy 2022. XDA SHIT POSTING INC</p>
    </body>
    </html>
    `);
  // Check Indian time
  // Send whatsapp message to Group.
  try {
    const result = await axios.post(BotURL + '/createpost', {
      token: 'SUPERDOGE1234',
      postId: data._id.toString(),
      text: data.text
    });
    console.log(result);
  } catch (err) {
    console.error(err);
  }
};
const postservice = async (req, res, next) => {
  const { token, response, service } = req.body;
  if (token !== 'SUPERDOGE1234') {
    return res.status(401).json({ error: 'Unautorized' });
  }
  if (!response || !service) {
    return res.status(400).json({ error: 'Response Service required.' });
  }

  // Approve or Decline?
  const postId = response.split('-')[1];
  const post = await Post.findById(postId);
  if (!post)
    return res.status(404).json({ message: 'Post not found in database.' });

  switch (service) {
    case 'Approve': {
      post.status = 'Approved';
      await post.save();
      postToFacebook(post);
      return res.status(202).json({ message: 'The Post has been approved.' });
    }
    case 'Decline': {
      post.status = 'Declined';
      await post.save();
      return res.status(202).json({ message: 'The Post has been declined.' });
    }
    default: {
      return res.status(400).json({ message: 'Unknown request' });
    }
  }
};
const postTrack = async (req, res, next) => {
  const trackingId = req.body?.trackingId?.trim?.();
  console.log(req.body.post);
  if (!trackingId) {
    return res.status(400).json({ error: 'Tracking Id cannot be empty.' });
  }

  const post = await Post.findOne({ trackingId });
  if (!post) {
    return res.status(404).send('<h1>Invalid tracking Id.</h1>');
  }

  res.send(`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>XDA SP | Post Tracking</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>
        body {
          font-family: 'Inter', sans-serif;
        }
        .status {
          font-weight: 700;
        }
        .Pending {
          color: #455a64;
        }
  
        .Approved {
          color: #2e7d32;
        }
  
        .Posted {
          color: #1b5e20;
        }
        .Declined {
          color: #d50000;
        }
      </style>
    </head>
    <body>
      <h2>Tracking ${post.trackingId}</h2>
      Status: <span class="status ${post.status}">${post.status}</span>
  
      <h3>Post:</h3>
      <p>
        ${post.text}
      </p>
    </body>
  </html>
  `);
};

async function postToFacebook(post) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://www.facebook.com/login');
    await page.waitForTimeout(1000);
    await page.type('#email', 'beginningonix@gmail.com', {
      delay: 20
    });
    await page.type('#pass', process.env.password, {
      delay: 10
    });
    await page.click('#loginbutton');
    await page.waitForTimeout(3000);
    await page.waitForNavigation();
    await page.goto('https://mbasic.facebook.com/groups/1622367768119037/');
    await page.click('textarea[aria-label="Write a post."]');
    await page.type(`textarea[aria-label="Write a post."]`, post.text);
    await page.waitForTimeout(3000);
    await page.click('input[value="Post"]');
    await page.waitForNavigation();
    await page.waitForTimeout(5000);
    await browser.close();
    post.status = 'Posted';
    await post.save();
  } catch (err) {
    console.log(err);
  }
}

module.exports = { postCreate, postTrack, postservice };
