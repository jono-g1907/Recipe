function ValidationError(errors) {
    Error.call(this, 'Validation failed');
    this.name = 'ValidationError';
    this.errors = errors || [];
}
ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;
  
module.exports = ValidationError;