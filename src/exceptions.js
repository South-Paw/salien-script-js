class SalienScriptException {
  constructor(message) {
    this.name = 'SalienScriptException';
    this.message = message;
  }
}

class SalienScriptRestart {
  constructor(message) {
    this.name = 'SalienScriptRestart';
    this.message = message;
  }
}

module.exports = {
  SalienScriptException,
  SalienScriptRestart,
};
