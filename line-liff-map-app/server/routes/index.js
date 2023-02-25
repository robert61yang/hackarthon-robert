// ./routes/index.js
const cors = require('cors');
const mymap = require('./mymap');
module.exports = app => {
  app.use('/mymap', cors(), mymap);
};
