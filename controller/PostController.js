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
  res.send(
    'Your post has been submitted for approval, You can use this trackingId to track status of your post. TrackingID: ' +
      postTrackingId
  );
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
const postTrack = (req, res, next) => {};

async function postToFacebook(post) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
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
