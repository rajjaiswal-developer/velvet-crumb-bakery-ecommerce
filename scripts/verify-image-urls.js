const https = require('https');

const urls = [
  'https://ik.imagekit.io/by3es5jcax/products/belgian-truffle.jpg',
  'https://ik.imagekit.io/by3es5jcax/products/red-velvet-heart.jpg',
  'https://ik.imagekit.io/by3es5jcax/products/Butterscotch-cake_2y39YReU3.jpg',
  'https://ik.imagekit.io/by3es5jcax/products/images_TD8d5ipEv.jpg',
  'https://ik.imagekit.io/by3es5jcax/products/images__1__L8mXhdC3w.jpg',
  'https://ik.imagekit.io/by3es5jcax/products/Butterscotch-cake_Y0OR7GAIn.jpg',
  'https://ik.imagekit.io/by3es5jcax/products/Red_Velvet_4vXXl4F_P7.jpg',
  'https://ik.imagekit.io/by3es5jcax/products/764da5c14a8dc7f13ece2dfd6321e15d_68cgatczR.jpg',
  'https://ik.imagekit.io/by3es5jcax/products/images__2__SrY-XeWzIA.jpg',
  'https://ik.imagekit.io/by3es5jcax/products/images__3__bvgPQMQH2.jpg'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, statusCode: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', (e) => {
      resolve({ url, error: e.message });
    });
  });
}

async function run() {
  for (const url of urls) {
    const res = await checkUrl(url);
    console.log(res);
  }
}

run();
