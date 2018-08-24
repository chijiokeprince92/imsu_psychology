// this is the controller for handling anything student 


var StudentSigns = require('../models/studentSchema');
var Staff = require('../models/staffSchema');
var async = require('async');
var multer = require('multer');
var path = require('path');


const {
    body,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');


//---------------------------------------------------------------------------------
// this functions checks the continuity of the session
exports.loginRequired = function (req, res, next) {
    if (!req.session.student) {
        res.redirect('login');
    } else {
        next();
    }
}


// this function ensures that another user does not tamper with a user's account
exports.ensureCorrectuser = function (req, res, next) {
    if (req.session.student !== req.params.id) {
        res.redirect('login');
    } else {
        next();
    }
}

//----------------------------------------------------------------------------
// GET the Student signup form
exports.student_signup_get = function (req, res, next) {
    res.render('homefile/student_signup', {
        title: 'student_signup'
    });
};


// handle POST request for the Student signup form
exports.student_signup_post = [
    body('email').isLength({
        min: 1
    }).trim().withMessage('email must be specified.'),
    body('surname').isLength({
        min: 1
    }).trim().withMessage('Surname must be specified.'),
    body('firstname').isLength({
        min: 1
    }).trim().withMessage('firstname must be specified.'),
    body('matnumber').isLength({
        min: 1
    }).trim().withMessage('matnumber must be specified.'),
    body('level').isLength({
        min: 1
    }).trim().withMessage('level must be specified.'),
    body('gender').isLength({
        min: 1
    }).trim().withMessage('gender must be specified.'),
    body('phone').isLength({
        min: 1
    }).trim().withMessage('phone must be specified.'),
    body('password').isLength({
        min: 1
    }).trim().withMessage('password must be specified.'),

    // Sanitize the fields
    sanitizeBody('email').trim().escape(),
    sanitizeBody('surname').trim().escape(),
    sanitizeBody('firstname').trim().escape(),
    sanitizeBody('matnumber').trim().escape(),
    sanitizeBody('level').trim().escape(),
    sanitizeBody('gender').trim().escape(),
    sanitizeBody('phone').trim().escape(),
    sanitizeBody('password').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('student/student_signup', {
                title: 'Create Student',
                student: req.body,
                errors: errors.array()
            });
            return;
        } else {
            // Data from form is valid.
            var fullPath = "files/" + req.file.filename;
            // Create an Student object with escaped and trimmed data.
            var qualified = new StudentSigns({
                email: req.body.email,
                surname: req.body.surname,
                firstname: req.body.firstname,
                matnumber: req.body.matnumber,
                level: req.body.level,
                gender: req.body.gender,
                phone: req.body.phone,
                photo: fullPath,
                bio: req.body.bio,
                password: req.body.password
            });
            qualified.save(function (err) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to login page.
                res.redirect('/login');
            });
        }
    }
];


//----------------------------------------------------------------------
// function for Student Login GET
exports.get_login_form = function (req, res, next) {
    res.render('homefile/login', {
        title: 'Login form',
    });
}

// function for Student Login POST
exports.test_login = function (req, res, next) {
    StudentSigns.findOne({
        'email': req.body.email
    }, function (err, glad) {
        if (err) {
            return next(err);
        } else if (glad == null) {
            res.render('student/login', {
                title: 'Student Login',
                ohno: 'Your email was not found on the database'
            })
        } else if (glad.password !== req.body.password) {
            //password is incorrect
            res.render('student/login', {
                title: 'Login',
                ohno: 'Password is incorrect'
            })
        } else if (glad && glad.password == req.body.password) {
            req.session.student = glad.id;
            res.render('student/student_home', {
                title: 'Student HomePage',
                allowed: req.session.student
            });
        } else {
            res.redirect('/login');
        }
    });

};

exports.get_student_home = function (req, res, next) {
    res.render('student/student_home', {
        title: 'Student HomePage',
        allowed: req.session.student
    })
}

// Profile page for a specific Student.
exports.profiler = function (req, res, next) {
    StudentSigns.findById(req.params.id)
        .exec(function (err, results) {
            if (err) {
                return next(err);
            } // Error in API usage.
            else if (results == null) { // No results.
                var err = new Error('Student not found');
                err.status = 404;
                return next(err);
            } else {
                // Successful, so render.
                res.render('student/profiler', {
                    allowed: req.session.student,
                    title: 'Student Profile',
                    user: results.id,
                    graceemail: results.email,
                    gracesurname: results.surname,
                    gracefirstname: results.firstname,
                    gracematnumber: results.matnumber,
                    gracelevel: results.level,
                    gracegender: results.gender,
                    gracephone: results.phone,
                    gracephoto: results.photo,
                    gracebio: results.bio
                });
            }
        });
};

// GET Profile  of a student
exports.view_coursemate_profile = function (req, res, next) {
    StudentSigns.findById(req.params.id)
        .exec(
            function (err, swag) {
                if (err) {
                    return next(err);
                }
                console.log(swag)
                res.render('student/views_student', {
                    allowed: req.session.student,
                    title: "CourseMate Profile",
                    email: swag.email,
                    surname: swag.surname,
                    firstname: swag.firstname,
                    matnumber: swag.matnumber,
                    level: swag.level,
                    gender: swag.gender,
                    phone: swag.phone,
                    photo: function () {
                        if (!swag.photo) {
                            swag.photo = "../images/psylogo4.jpg";
                            return swag.photo;
                        } else {
                            return swag.photo;
                        }
                    }
                });
            }
        )
}


//Functions for displaying just your coursemates
exports.list_coursemates = function (req, res, next) {
    StudentSigns.findById(req.session.student)
        .exec(
            function (err, swagger) {
                if (err) {
                    return next(err);
                }
                if (swagger == null) {
                    res.redirect('/studenthome');
                }
                StudentSigns.find({
                    'level': swagger.level
                }, function (err, levelss) {
                    res.render('student/lists_students', {
                        allowed: req.session.student,
                        title: "Complete List of your Course Mates",
                        slow: levelss
                    });
                })


            }
        )
}


exports.get_elibrary = function (req, res, next) {
    res.render('student/Elibrary', {
        title: 'Student E-Library',
        allowed: req.session.student
    })
}

exports.get_project_topics = function (req, res, next) {
    res.render('student/projectTopics', {
        title: "Project topics",
        allowed: req.session.student
    })
}

exports.get_time_table = function (req, res, next) {
    res.render('student/time_table', {
        title: "Student's TimeTable",
        allowed: req.session.student
    })
}
//-------------------------------------------------------------------------

// function for checking students results
exports.student_result = function (req, res, next) {
    async.parallel({
        studentresult: function (callback) {
            StudentSigns.findById(req.session.student)
                .exec(callback)
        }

    }, function (err, myresult) {
        if (err) {
            return next(err);
        }
        if (studentresult) {
            res.render('student/student_result', {
                title: 'Personal Result',
                message: myresult.surname
            })
        }
    })
}

// to Log-Out Students from the site
exports.logout = function (req, res, next) {
    if (req.session.student) {
        req.session.destroy();
    }
    res.redirect('/');
}

exports.post_upload = function (req, res, next) {
    var fullPath = "files/" + req.file.filename;
    var photo = new Photos({
        path: fullPath,
        caption: req.body.caption
    });
    photo.save(function (err) {
        if (err) {
            return next(err);
        }
        console.log("Document Saved");
        res.redirect('/login');
    });
}

// NAPS Group Chat function
exports.chat = function (req, res, next) {
    StudentSigns.findOne({
        '_id': req.session.student
    }, function (err, senior) {
        if (err) {
            return next(err);
        } else if (senior.level == 100) {
            res.render('student/chat100', {
                title: "100 Level Chat Group",
                message: " 100 Level NAPS Group Chat !!",
                allowed: req.session.student
            });
        } else if (senior.level == 200) {
            res.render('student/chat200', {
                title: "200 Level Chat Group",
                message: " 200 Level NAPS Group Chat !!",
                allowed: req.session.student
            });
        } else if (senior.level == 300) {
            res.render('student/chat300', {
                title: "300 Level Chat Group",
                message: " 300 Level NAPS Group Chat !!",
                allowed: req.session.student
            });
        } else if (senior.level == 400) {
            res.render('student/chat400', {
                title: "400 Level Chat Group",
                message: " 400 Level NAPS Group Chat !!",
                allowed: req.session.student
            });
        } else {
            res.redirect('login');
        }
    });
}