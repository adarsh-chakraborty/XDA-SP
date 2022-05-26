const puppeteer = require('puppeteer');
const Post = require('../model/Post');
const { nanoid } = require('nanoid');
const axios = require('axios').default;

let isPosting = false;

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
  const data = await Post.create({
    text: post,
    trackingId: postTrackingId,
    ip: req.ip
  });
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
    return res.status(401).json({ error: 'Unauthorized' });
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
      return res.status(202).json({
        message:
          'The Post has been approved.\n Type !post to post all approved post to group. (max 10) to facebook.'
      });
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

const postApproved = async (req, res, next) => {
  const { token } = req.body;
  if (token !== 'SUPERDOGE1234') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (isPosting) {
    return res.status(409).json({
      error: 'There is already posting process going on, try again later.'
    });
  }
  const approvedPosts = await Post.find({ status: 'Approved' }).limit(10);
  res.send(`${approvedPosts?.length} posts will be posted to XDA SP.`);
  if (approvedPosts?.length > 0) {
    isPosting = true;
    postToFacebook();
  }
};

async function postToFacebook(approvedPosts) {
  console.log(approvedPosts);
  console.log('PUPETEER:', '1. Initializing');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.setCacheEnabled(false);
  try {
    await page.screenshot({ path: './public/1.png', fullPage: true });
    console.log('PUPETEER:', '2. Opened new page, visiting login');
    await page.goto('https://mbasic.facebook.com/login');
    await page.screenshot({ path: './public/2.png', fullPage: true });
    await page.waitForTimeout(1000);
    console.log('PUPETEER:', '3. Typing Email');
    await page.type(`input[name="email"]`, 'beginningonix@gmail.com', {
      delay: 20
    });
    console.log('PUPETEER:', '3. Typing password');
    await page.type(`input[name="pass"]`, process.env.password, {
      delay: 10
    });
    await page.screenshot({ path: './public/3.png', fullPage: true });

    console.log('PUPETEER:', '4. Clicking on login button');
    await page.click(`input[name="login"]`);

    await page.waitForTimeout(15000);
    await page.screenshot({ path: './public/4.png', fullPage: true });

    console.log('PUPETEER:', '5. Logged in, redirecting to XDA SP');

    // Repeatative Task //
    for (post of approvedPosts) {
      await page.waitForTimeout(5000);
      await page.goto('https://mbasic.facebook.com/groups/1622367768119037/');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: './public/5.png', fullPage: true });
      console.log('PUPETEER:', '6. Typing post text');
      await page.screenshot({ path: './public/6.png', fullPage: true });
      const next = await page.waitForSelector(
        'textarea[aria-label="Write a post."]'
      );
      await next.click();
      await next.type(post.text, { delay: 10 });
      console.log('PUPETEER:', '7. Posting....');
      await page.screenshot({ path: './public/7.png', fullPage: true });

      await page.click('input[value="Post"]');
      post.status = 'Posted';
      await post.save();
      await page.waitForTimeout(5000);
    }

    // console.log('PUPETEER:', 'Clicking on Write a post');
    // await page.click('textarea[aria-label="Write a post."]');

    console.log('PUPETEER:', '8. Posted. Closing Browser');
    await page.screenshot({ path: './public/8.png', fullPage: true });
    await browser.close();
    console.log('PUPETEER:', 'Browser closed, All done');
    isPosting = false;
  } catch (err) {
    await browser.close();
    console.log(err);
    isPosting = false;
  }
}

module.exports = { postCreate, postTrack, postservice, postApproved };
