const bcrypt = require('bcryptjs')
const saltRounds = bcrypt.genSaltSync(10)

const encryptPass = function (password) {
  return bcrypt.hashSync(password, saltRounds);
};

const comparePass = function (password, userPass) {
  return bcrypt.compareSync(password, userPass);
};

module.exports = {
  encryptPass,
  comparePass,
}
