var express = require('express');
var Projects = require('../models/projects');
var bodyParser = require('body-parser');
var auth = require('../authenticate');
var User = require('../models/users');
var fs = require('fs');
var rimraf = require('rimraf');

var router = express.Router();
var userPopulate = 'name usertype username firstname lastname';
router.use(bodyParser.json());

router.route('/')
.get(auth.verifyUser, (req, res, next) => {
    let condition={};
    if(!req.user.type.upload){
        condition.members = req.user._id;
    }
    Projects.find(condition)
    .populate({path: 'members', select: userPopulate})
    .populate({path: 'tasks.comments.author', select: userPopulate})
    .populate({path: 'tasks.members', select: userPopulate})
    .then((projects) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(projects);
    }, (err) => next(err)).catch((err) => next(err));
}).post(auth.verifyUser, auth.verifyAction('upload'), (req, res, next) => {
    if(req.body.tasks==undefined){
        req.body.tasks = [];
    }
    let members=[];
    if(req.body.start_date!=undefined){
        for(let i=0;i<req.body.tasks.length;i++){
            if(req.body.tasks[i].start_date==undefined){
                req.body.tasks[i].start_date = req.body.start_date;
            }
            if(req.body.tasks[i].end_date==undefined){
                req.body.tasks[i].end_date = req.body.fat_date;
            }
            if(req.body.tasks[i].members==undefined){
                req.body.tasks[i].members=[];
            }
            Array.prototype.push.apply(members, req.body.tasks[i].members);
        }
    }
    User.find({username: members}).select('username _id')
    .then((users) => {
        let dict={};
        users.forEach((user) => {
            dict[user.username]=user._id;
        });
        members = members.filter((member,pos) => members.indexOf(member)==pos);
        req.body.members = members.map(member => (dict[member]==undefined?null:dict[member])).filter(member => member!=null);
        for(let i=0;i<req.body.tasks.length;i++){
            req.body.tasks[i].members = req.body.tasks[i].members.map(member => (dict[member]==undefined?null:dict[member])).filter(member => member!=null);
        }
        return Projects.create(req.body);
    }).then((project) => {
        res.statusCode=200;
        res.setHeader('Content-Type', 'application/json');
        res.json(project);
    },(err) => next(err)).catch((err) => next(err));
});

router.route('/:projectId').get(auth.verifyUser, (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.upload){
        condition.members = req.user._id;;
    }
    Projects.findOne(condition)
    .populate({path: 'members', select: userPopulate})
    .populate({path: 'tasks.comments.author', select: userPopulate})
    .populate({path: 'tasks.members', select: userPopulate})
    .then((project) => {
        res.statusCode=200;
        res.setHeader('Content-Type', 'application/json');
        res.json(project);
    },(err) => next(err)).catch((err) => next(err));
}).put(auth.verifyUser, auth.verifyAction('data_entry'), (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.upload){
        condition.members = req.user._id;;
    }
    Projects.findOne(condition)
    .then((project) => {
        if(!project){
            var err = new Error('Project '+req.params.projectId+' not found!');
            err.status=404;
            next(err);
        }else{
            if(req.body.start_date){
                project.start_date = req.body.start_date;
            }
            if(req.body.fat_date){
                project.fat_date = req.body.fat_date;
            }
            let members=[];
            if(req.body.tasks){
                for(let i=0;i<req.body.tasks.length;i++){
                    if(req.body.tasks[i].start_date==undefined){
                        req.body.tasks[i].start_date = project.start_date;
                    }
                    if(req.body.tasks[i].end_date==undefined){
                        req.body.tasks[i].end_date = project.fat_date;
                    }
                    if(req.body.tasks[i].members==undefined){
                        req.body.tasks[i].members=[];
                    }
                    Array.prototype.push.apply(members, req.body.tasks[i].members);
                }
            }
            User.find({username: members}).select('_id username')
            .then((users) => {
                let dict={};
                users.forEach((user) => {
                    dict[user.username]=user._id;
                });
                members = [...new Set(members)];
                req.body.members = members.map(member => dict[member]);
                if(req.body.tasks){
                    for(let i=0;i<req.body.tasks.length;i++){
                        req.body.tasks[i].members = req.body.tasks[i].members.map(member => (dict[member]==undefined?null:dict[member]));
                    }
                }
                for(let key in req.body){
                    project[key] = req.body[key];
                }
                return project.save();
            }).then((project) => {
                Projects.findById(project._id)
                .populate({path: 'members', select: userPopulate})
                .populate({path: 'tasks.comments.author', select: userPopulate})
                .populate({path: 'tasks.members', select: userPopulate})
                .then((project) => {
                    res.statusCode=200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(project);
                },(err) => next(err)).catch((err) => next(err));
            },(err) => next(err)).catch((err) => next(err));
        }
    },(err) => next(err)).catch((err) => next(err));
}).delete(auth.verifyUser, auth.verifyAction('upload'), (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.upload){
        condition.members = req.user._id;;
    }
    Projects.findOneAndDelete(condition).then(() => {
      let dir = __dirname.slice(0,-7);
      if(fs.existsSync(dir+'/data/'+req.params.projectId)){
        rimraf.sync(dir+'/data/'+req.params.projectId);
      }
      res.statusCode=200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, message: 'Successfully deleted project '+req.params.projectId})
    },(err) => next(err)).catch((err) => next(err));
});

router.route('/:projectId/tasks')
.get(auth.verifyUser, (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.upload){
        condition.members = req.user._id;
    };
    Projects.findOne(condition)
    .populate({path: 'tasks.comments.author', select: userPopulate})
    .populate({path: 'tasks.members', select: userPopulate})
    .then((project) => {
        if(!project){
            let err = new Error('Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }else{
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(project.tasks);
        }
    })
}).post(auth.verifyUser, auth.verifyAction('data_entry'), (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.upload){
        condition.members = req.user._id;
    };
    Projects.findOne(condition)
    .then((project) => {
        if(!project){
            var err = new Error('Project '+req.params.projectId+' not found!');
            err.status=404;
            next(err);
        }else{
            let members=[];
            for(let i=0;i<req.body.tasks.length;i++){
                if(req.body.tasks[i].start_date==undefined){
                    req.body.tasks[i].start_date = project.start_date;
                }
                if(req.body.tasks[i].end_date==undefined){
                    req.body.tasks[i].end_date = project.fat_date;
                }
                if(req.body.tasks[i].members==undefined){
                    req.body.tasks[i].members=[];
                }
                Array.prototype.push.apply(members, req.body.tasks[i].members);
            }
            User.find({username: members}).select('_id username')
            .then((users) => {
                let dict={};
                users.forEach((user) => {
                    dict[user.username]=user._id;
                });
                members = members.filter((member,pos) => members.indexOf(member)==pos);
                members = members.map(member => (dict[member]==undefined?null:dict[member])).filter(member => member!=null);
                for(let i=0;i<req.body.tasks.length;i++){
                    req.body.tasks[i].members = req.body.tasks[i].members.map(member => (dict[member]==undefined?null:dict[member])).filter(member => member!=null);
                }
                Array.prototype.push.apply(project.tasks, req.body.tasks);
                Array.prototype.push.apply(project.members, members);
                project.members = project.members.filter((member,pos) => project.members.indexOf(member)==pos);
                project.markModified('members');
                return project.save();
            }).then((project) => {
                return Projects.findById(project._id)
                .populate({path: 'members', select: userPopulate})
                .populate({path: 'tasks.comments.author', select: userPopulate})
                .populate({path: 'tasks.members', select: userPopulate});
            }).then((project) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(project);
            },(err) => next(err)).catch((err) => next(err));
        }
    },(err) => next(err)).catch((err) => next(err));
});

router.route('/:projectId/tasks/:taskId')
.get(auth.verifyUser, (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.upload){
        condition.members = req.user._id;
    };
    Projects.findOne(condition)
    .populate({path: 'tasks.comments.author', select: userPopulate})
    .populate({path: 'tasks.members', select: userPopulate})
    .then((project) => {
        if(!project){
            let err = new Error('Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }else{
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(project.tasks.filter(task => task._id = req.params.taskId)[0]);
        }
    },(err) => next(err)).catch((err) => next(err));
}).put(auth.verifyUser, auth.verifyAction('data_entry'), (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.upload){
        condition.members = req.user._id;
    };
    Projects.findOne(condition)
    .then((project) => {
        if(!project){
            let err = new Error('Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }else{
            let done = -1;
            for(let i=0;i<project.tasks.length;i++){
                if(project.tasks[i]._id==req.params.taskId){
                    done=i;
                    for(let key in req.body){
                        project.tasks[i][key] = req.body[key];
                    }
                    break;
                }
            }
            if(done==-1){
                let err = new Error('Task '+req.params.taskId+' in Project '+req.params.projectId+' not found!');
                err.status = 404;
                return next(err);
            }
            project.save().then((project) => {
                return Projects.findById(project._id)
                .populate({path: 'tasks.comments.author', select: userPopulate})
                .populate({path: 'tasks.members', select: userPopulate});
            }).then((project) => {
                res.statusCode=200;
                res.setHeader('Content-Type', 'application/json');
                res.json(project.tasks[done]);
            },(err) => next(err)).catch((err) => next(err));
        }
    },(err) => next(err)).catch((err) => next(err));
}).delete(auth.verifyUser, auth.verifyAction('data_entry'), (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.upload){
        condition.members = req.user._id;
    };
    Projects.findOne(condition)
    .then((project) => {
        if(!project){
            let err = new Error('Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }else{
            let done = false;
            for(let i=0;i<project.tasks.length;i++){
                if(project.tasks[i]._id==req.params.taskId){
                    done=true;
                    project.tasks.splice(i,1);
                    break;
                }
            }
            if(!done){
                let err = new Error('Task '+req.params.taskId+' in Project '+req.params.projectId+' not found!');
                err.status = 404;
                return next(err);
            }
            project.save()
            .then(() => {
                res.statusCode=200;
                res.setHeader('Content-Type', 'application/json');
                res.json({success: true, message: 'Task '+req.params.taskId+' in Project '+req.params.projectId+' deleted successfully!'});
            },(err) => next(err)).catch((err) => next(err));
        }
    },(err) => next(err)).catch((err) => next(err));
});

router.route('/:projectId/tasks/:taskId/members')
.get(auth.verifyUser, (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.upload){
        condition.members = req.user._id;
    };
    Projects.findOne(condition)
    .populate({path: 'tasks.members', select: userPopulate})
    .then((project) => {
        if(!project){
            let err = new Error('Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }else{
            res.statusCode=200;
            res.setHeader('Content-Type', 'application/json');
            res.json(project.tasks.filter(task => task._id==req.params.taskId)[0].members);
        }
    },(err) => next(err)).catch((err) => next(err));
}).post(auth.verifyUser, auth.verifyAction('data_entry'), (req, res, next) => {
    User.find({username: req.body.members}).select('_id')
    .then((users) => {
        users = users.map(user => user._id);
        Projects.findById(req.params.projectId)
        .then((project) => {
            if(!project){
                let err = new Error('Project '+req.params.projectId+' not found!');
                err.status = 404;
                return next(err);
            }else{
                let done = -1;
                for(let i=0;i<project.tasks.length;i++){
                    if(project.tasks[i]._id==req.params.taskId){
                        done=i;
                        Array.prototype.push.apply(project.tasks[i].members, users);
                        Array.prototype.push.apply(project.members, users);
                        project.tasks[i].members = project.tasks[i].members.filter((member,k) => project.tasks[i].members.indexOf(member)==k);
                        project.members = project.members.filter((member,i) => project.members.indexOf(member)==i);
                        break;
                    }
                }
                if(done==-1){
                    let err = new Error('Task '+req.params.taskId+' in Project '+req.params.projectId+' not found!');
                    err.status = 404;
                    return next(err);
                }
                project.markModified('members');
                project.markModified('tasks');
                project.save()
                .then((project) => {
                    return Projects.findById(project._id)
                    .populate({path: 'tasks.members', select: userPopulate});
                })
                .then((project) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(project.tasks[done].members);
                },(err) => next(err)).catch((err) => next(err));
            }
        },(err) => next(err)).catch((err) => next(err));
    },(err) => next(err)).catch((err) => next(err));
});

router.route('/:projectId/tasks/:taskId/members/:memberId')
.get(auth.verifyUser, (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.upload){
        condition.members = req.user._id;
    };
    Projects.findOne(condition)
    .populate({path: 'tasks.members', select: userPopulate})
    .then((project) => {
        if(!project){
            let err = new Error('Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }else{
            let taskIndex = -1;
            for(let i=0;i<project.tasks.length;i++){
                if(project.tasks[i]._id==req.params.taskId){
                    taskIndex = i;
                    break;
                }
            }
            if(taskIndex==-1){
                let err = new Error('Task '+req.params.taskId+' in Project '+req.params.projectId+' not found!');
                err.status = 404;
                return next(err);
            }
            for(let i=0;i<project.tasks[taskIndex].members.length;i++){
                if(project.tasks[taskIndex].members[i].username==req.params.memberId){
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({found: true, message:'Member '+req.params.memberId+' in Task '+req.params.taskId+' of Project '+req.params.projectId+' found.'});
                    return;
                }
            }
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.json({found: false, message:'Member '+req.params.memberId+' in Task '+req.params.taskId+' of Project '+req.params.projectId+' not found!'});
        }
    },(err) => next(err)).catch((err) => next(err));
})
.delete(auth.verifyUser, auth.verifyAction('data_entry'), (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.upload){
        condition.members = req.user._id;
    };
    Projects.findOne(condition)
    .populate({path: 'tasks.members', select: userPopulate})
    .then((project) => {
        if(!project){
            let err = new Error('Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }else{
            let taskIndex = -1;
            for(let i=0;i<project.tasks.length;i++){
                if(project.tasks[i]._id==req.params.taskId){
                    taskIndex = i;
                    break;
                }
            }
            if(taskIndex==-1){
                let err = new Error('Task '+req.params.taskId+' in Project '+req.params.projectId+' not found!');
                err.status = 404;
                return next(err);
            }
            let found = false;
            for(let i=0;i<project.tasks[taskIndex].members.length;i++){
                if(project.tasks[taskIndex].members[i].username==req.params.memberId){
                    found = true;
                    let id = project.tasks[taskIndex].members[i]._id;
                    project.tasks[taskIndex].members.splice(i,1);
                    let letsDelete = true;
                    for(let j=0;j<project.tasks.length;j++){
                        if(j==taskIndex) continue;
                        if(project.tasks[j].members.filter(member => member._id==id)){
                            letsDelete = false;
                            break;
                        }
                    }
                    if(letsDelete){
                        for(let j=0;j<project.members.length;j++){
                            if(project.members[j]==id){
                                project.members.splice(j,1);
                                break;
                            }
                        }
                    }
                    project.save().then(() => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({found: true, message:'Member '+req.params.memberId+' in Task '+req.params.taskId+' of Project '+req.params.projectId+' deleted!'});
                        return;
                    },(err) => next(err)).catch((err) => next(err));
                }
            }
            if(!found){
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.json({found: false, message:'Member '+req.params.memberId+' in Task '+req.params.taskId+' of Project '+req.params.projectId+' not found!'});
            }
        }
    },(err) => next(err)).catch((err) => next(err));
});

router.route('/:projectId/tasks/:taskId/comments')
.get(auth.verifyUser, (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.upload){
        condition.members = req.user._id;
    };
    Projects.findOne(condition)
    .populate({path: 'tasks.comments.author', select: userPopulate})
    .then((project) => {
        if(!project){
            let err = new Error('Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }
        let taskIndex = -1;
        for(let i=0;i<project.tasks.length;i++){
            if(project.tasks[i]._id==req.params.taskId){
                taskIndex = i;
                break;
            }
        }
        if(taskIndex==-1){
            let err = new Error('Task '+req.params.taskId+' in Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(project.tasks[taskIndex].comments);
    },(err) => next(err)).catch((err) => next(err));
}).post(auth.verifyUser, auth.verifyAction('comments'), (req,res,next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.comments){
        condition.members = req.user._id;
    };
    Projects.findOne(condition)
    .then((project) => {
        if(!project){
            let err = new Error('Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }
        let taskIndex = -1;
        for(let i=0;i<project.tasks.length;i++){
            if(project.tasks[i]._id==req.params.taskId){
                taskIndex = i;
                break;
            }
        }
        if(taskIndex==-1){
            let err = new Error('Task '+req.params.taskId+' in Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }
        if(!req.user.type.comments && project.tasks[taskIndex].members.filter(member => member==req.user._id).length==0){
            let err = new Error('Forbidden');
            err.status = 403;
            return next(err);
        }
        project.tasks[taskIndex].comments.push({author: req.user._id, comment: req.body.comment});
        project.save().then((project) => {
            return Projects.findById(project._id)
            .populate({path: 'tasks.comments.author', select: userPopulate})
        }).then((project) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(project.tasks[taskIndex].comments);
        },(err) => next(err)).catch((err) => next(err));
    },(err) => next(err)).catch((err) => next(err));
});

router.route('/:projectId/tasks/:taskId/comments/:commentId')
.get(auth.verifyUser, (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.comments){
        condition.members = req.user._id;
    };
    Projects.findOne(condition)
    .populate({path: 'tasks.comments.author', select: userPopulate})
    .then((project) => {
        if(!project){
            let err = new Error('Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }
        let taskIndex = -1;
        for(let i=0;i<project.tasks.length;i++){
            if(project.tasks[i]._id==req.params.taskId){
                taskIndex = i;
                break;
            }
        }
        if(taskIndex==-1){
            let err = new Error('Task '+req.params.taskId+' in Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }
        if(!req.user.type.comments && project.tasks[taskIndex].members.filter(member => member==req.user._id).length==0){
            let err = new Error('Forbidden');
            err.status = 403;
            return next(err);
        }
        let commentIndex=-1;
        for(let i=0;i<project.tasks[taskIndex].comments.length;i++){
            if(project.tasks[taskIndex].comments[i]._id==req.params.commentId){
                commentIndex=i;
                break;
            }
        }
        if(commentIndex==-1){
            let err = new Error('Comment '+req.params.commentId+' not found!');
            err.status = 404;
            return next(err);
        }
        res.statusCode=200;
        res.setHeader('Content-Type', 'application/json');
        res.json(project.tasks[taskIndex].comments[commentIndex]);
    },(err) => next(err)).catch((err) => next(err));
}).delete(auth.verifyUser, (req, res, next) => {
    let condition = {
        _id: req.params.projectId
    };
    if(!req.user.type.comments){
        condition.members = req.user._id;
    };
    Projects.findOne(condition)
    .then((project) => {
        if(!project){
            let err = new Error('Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }
        let taskIndex = -1;
        for(let i=0;i<project.tasks.length;i++){
            if(project.tasks[i]._id==req.params.taskId){
                taskIndex = i;
                break;
            }
        }
        if(taskIndex==-1){
            let err = new Error('Task '+req.params.taskId+' in Project '+req.params.projectId+' not found!');
            err.status = 404;
            return next(err);
        }
        if(!req.user.type.comments && project.tasks[taskIndex].members.filter(member => member==req.user._id).length==0){
            let err = new Error('Forbidden');
            err.status = 403;
            return next(err);
        }
        let commentIndex=-1;
        for(let i=0;i<project.tasks[taskIndex].comments.length;i++){
            if(project.tasks[taskIndex].comments[i]._id==req.params.commentId){
                commentIndex=i;
                break;
            }
        }
        if(commentIndex==-1){
            let err = new Error('Comment '+req.params.commentId+' not found!');
            err.status = 404;
            return next(err);
        }
        if(project.tasks[taskIndex].comments[commentIndex].author!=req.user._id.toString()){
            let err = new Error('Forbidden');
            err.status = 403;
            return next(err);
        }
        project.tasks[taskIndex].comments.splice(commentIndex, 1);
        project.save()
        .then(() => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({success: true, message: 'Comment '+req.params.commentId+' deleted successfully!'});
        },(err) => next(err)).catch((err) => next(err));
    },(err) => next(err)).catch((err) => next(err));
});

module.exports = router;
