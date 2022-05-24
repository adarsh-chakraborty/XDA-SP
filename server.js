require('dotenv').config();
const fs = require('fs');

const puppeteer = require('puppeteer');

// const csvWriteStream = fs.createWriteStream('./followers.csv');
// csvWriteStream.write('username, profile_url\n');

const WAIT = 5000;
const SCROLL_INTERVAL = 3000;

async function grabUsers(page) {
  const grabbedUsers = await page.evaluate(async (SCROLL_INTERVAL) => {
    var scroll_stuff = document.getElementsByClassName('isgrP')[0];
    scroll_stuff.scrollTop = scroll_stuff.scrollHeight;
    await new Promise((resolve) => setTimeout(resolve, SCROLL_INTERVAL));
    scroll_stuff.scrollTop = scroll_stuff.scrollHeight;
    await new Promise((resolve) => setTimeout(resolve, SCROLL_INTERVAL));
    scroll_stuff.scrollTop = scroll_stuff.scrollHeight;
    await new Promise((resolve) => setTimeout(resolve, SCROLL_INTERVAL));

    const names = document.querySelectorAll(
      '.FPmhX.notranslate._0imsa:not(.mark_evaluated)'
    );
    let users = '';
    names.forEach((user) => {
      users += `${user.title}, ${user.href}\n`;
      user.classList.add('mark_evaluated');
      console.log(user.title);
    });

    return users;
    // scroll_stuff.scrollTop = scroll_stuff.scrollHeight;
  }, SCROLL_INTERVAL);

  csvWriteStream.write(`${grabbedUsers}\n`);
  console.log(`Grabbing more users in ${WAIT / 1000} secs`);
  setTimeout(grabUsers.bind(null, page), WAIT);
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.facebook.com/login');
  await page.waitForTimeout(1000);
  // await page.waitForSelector('div[data-visualcompletion="loading-state"]', {
  //   hidden: true
  // });
  await page.type('#email', 'beginningonix@gmail.com', {
    delay: 20
  });
  await page.type('#pass', process.env.password, {
    delay: 10
  });
  await page.click('#loginbutton');
  await page.waitForTimeout(3000);
  // await page.type('[name="username"]', 'anandroiddeveloper', {
  //   delay: 20
  // });
  // await page.type('input[name="password"]', process.env.password, {
  //   delay: 10
  // });

  // await page.click('.sqdOP.L3NKy.y3zKF', { delay: 10 });
  await page.waitForNavigation();
  await page.goto('https://mbasic.facebook.com/groups/1622367768119037/');
  await page.click('textarea[aria-label="Write a post."]');
  await page.type(
    `textarea[aria-label="Write a post."]`,
    'Hello, This is a test please ignore this post :)'
  );
  // await page.click('input[value="Post"]');
  // await page.click("a[href='/adarshchakraborty/followers/']");
  // await page.waitForTimeout(10000);

  // csvWriteStream.write(grabusers);

  // Scroll

  // await page.click('button[name="login"]');
  // await page.click('div[aria-label="Write a post."]');
  // await browser.close();
})();
