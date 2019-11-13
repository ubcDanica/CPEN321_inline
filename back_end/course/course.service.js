const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const User = db.User
const Course = db.Course
const queues = require('../queue/queue.service')
const mongoose = require("mongoose");
const topic = require('../fcm/send2')
const regToken = require('../fcm/regToken')

// routes
router.post('/new', new_course);
router.post('/add/:userid&:courseid', add_course);
router.get('/:id', get_courseById);
router.get('/', get_all);
router.put('/:id', update_course)
router.delete('/:id', delete_course);
router.get('/students/:id', get_students);

module.exports = router;

/*
add_course adds a student into the course document as well as add the course into
the student document.
url requirement /courses/add/:userid&:courseid
where :userid, :courseid are the ids for the user doucment and coursename
*/
async function add_course(req, res, next){
  var user = await User.findById(mongoose.Types.ObjectId(req.params.userid));
  var course = await Course.findById(mongoose.Types.ObjectId(req.params.courseid));

    console.log("found");

    if(!user){
        res.status(404).json({message:"no user found"});
    }
    else if(!course){
        res.status(404).json({message:"no course found"});
    }
    else{
        console.log(user.username);
        console.log(course.coursename);
        var token = await regToken.getToken(user.username);
        console.log(token);
        user.updateOne({$addToSet: {"courses": course.coursename}})
          .then(add_user(req, res, next, user, course))
          .then(await topic.subscribe(token, course.coursename))
          .catch(err => next(err));

        await user.save();
        await course.save();
    }


}

/*function that should be only use inside add_course, do not use it outside*/
async function add_user(req, res, next, userParam, courseParam){
    courseParam.updateOne({$addToSet: {"students": userParam.username}})
    .then(res.json({"username": userParam.username,
                   "coursename":courseParam.coursename}))
    .catch(err => next(err));
}

/*
post request, /courses/new
function that creates a new courss, http post json template{"coursename":"","teachers":["",""],"AA":""}
AA are the avaiable agents that is needed when starts a new line up
*/
async function new_course(req, res ,next){

  if(await Course.findOne({coursename: req.body.coursename})){
    res.status(400).json({message:"course " + req.body.coursename + " exists"});
  }
  else{
	console.log("coursename" + req.body.coursename)
    var queue = await queues.newQueue(req.body.coursename,req.body.AA)
    var course = new Course(req.body);
    res.json(course);
    await course.save();
    console.log(course.coursename)
  }
}

/*
get request, need courseid in url
courses/:id
get one course
*/
async function get_courseById(req,res,next){
  var course = await Course.findById(mongoose.Types.ObjectId(req.params.id))
  if(course){
    res.json(course);
  }
  else{
    res.status(404).json({message:"no course found"});
  }
}

/*
get request, need courseid in url
/courses/stduents/:id
get all students usernames in a specific course
*/
async function get_students(req,res,next){
  var course = await Course.findById(mongoose.Types.ObjectId(req.params.id))
  if(course){
    res.json(course.students);
  }
  else{
    res.status(404).json({message:"no course found"});
  }
}

/*
url: /courses/
get all students courses
*/
async function get_all(req,res,next){
    await Course.find().select('-hash')
    .then(users => res.json(users))
    .catch(err => next(err));
}

/*
put request, need courseid in url
/courses/:id
update a specific course
*/
async function update_course(req,res,next){
  var course = await Course.findById(mongoose.Types.ObjectId(req.params.id))
  if(course){
    Object.assign(course, req.body);
      await course.save();
      res.json(course);
  }
  else{
    res.status(404).json({message:"no course found"});
  }
}

/*
delete request, need courseid in url
/courses/:id
delete a specific course
*/
async function delete_course(req,res,next){
  var course = await Course.findByIdAndDelete(mongoose.Types.ObjectId(req.params.id))
  .then(()=>{res.json({message:"deleted"})}).catch(err=>next(err));
}
