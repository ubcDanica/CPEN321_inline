const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  coursename:{type: String, required: true},
  hash:{type:String, required: true},
  teachers: {type:[{type:String, required: true}]},
  createdDate: { type: Date, default: Date.now },
  officeHours: {type:[{type:String, default: "Monday 1pm"}]},
});

schema.set('toJSON',{virtuals: true});

module.exports = mongoose.model('Course', schema);
