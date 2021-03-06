var mongoose = require('mongoose')
var Schema = mongoose.Schema

// create a schema
var adminSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  firstname: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  verify: {
    type: String,
    enum: [process.env.admin_key, process.env.admin_key2],
    required: true
  },
  created: {
    type: Date
  },
  updated: {
    type: Date
  },
  password: {
    type: String,
    required: true
  }
})

// Virtual for ADMIN's URL
adminSchema
  .virtual('url')
  .get(function () {
    return '/admin/hercules/' + this._id
  })

// creating a student model and exporting the module
module.exports = mongoose.model('Admins', adminSchema)
