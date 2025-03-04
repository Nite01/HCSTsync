var express = require('express');
var router = express.Router();
const userModel = require("../models/users");
const postModel = require("../models/posts");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("../components/multer");
const utils = require("../utils/utils");

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});

router.get('/login', function (req, res, next) {
  res.render('login', { error: req.flash("error") });
});

router.get('/profile', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
    .populate('posts');

  res.render("profile", { user });
});

router.get("/feed", isLoggedIn, async function (req, res) {
  let user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");

  // Fetch only approved posts
  let posts = await postModel.find({ approved: true }).populate("user");

  res.render("feed", {
    user,
    posts,
    dater: utils.formatRelativeTime,
  });
});

router.get('/profileupdate', isLoggedIn, function (req, res, next) {
  res.render('profileupdate');
});

router.get('/postform', function (req, res, next) {
  res.render('postform');
});

router.post('/upload', isLoggedIn, upload.single('postImage'), async function (req, res, next) {

  if (!req.file) {
    return res.status(404).send("No Post is Made.");
  }

  const user = await userModel.findOne({
    username: req.session.passport.user
  })

  const post = await postModel.create({
    postimage: req.file.filename,
    caption: req.body.caption,
    user: user._id
  })

  user.posts.push(post._id);
  await user.save();

  res.redirect("/profile");
});

router.get("/like/:postid", isLoggedIn, async function (req, res) {
  const post = await postModel.findOne({ _id: req.params.postid });
  const user = await userModel.findOne({ username: req.session.passport.user });
  if (post.like.indexOf(user._id) === -1) {
    post.like.push(user._id);
  } else {
    post.like.splice(post.like.indexOf(user._id), 1);
  }
  await post.save();
  res.json(post);
});

router.post('/updateprofile', isLoggedIn, upload.single('profile-pic'), async function (req, res, next) {
  const user = await userModel.findOneAndUpdate({
    username: req.session.passport.user
  }, {
    profileimage: req.file.filename,
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email,
    contact: req.body.contact,
    bio: req.body.bio,
    branch: req.body.branch,
    graduationyear: req.body.graduationyear,
    currentorganisation: req.body.currentorganisation,
    designation: req.body.designation,
    location: req.body.location
  }, { new: true });
  await user.save();
  res.redirect("/profile");
});

router.post('/register', function (req, res) {
  const { username, fullname, email } = req.body;
  const userData = new userModel({ username, fullname, email });

  userModel.register(userData, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/profile");
      })
    })
});

router.post('/login', passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}), function (req, res) {
});

router.get('/logout', function (req, res) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

// Admin route to approve a post
router.put('/approve/:id', isLoggedIn, async function (req, res) {
  // Assuming admin status is determined by a field in the user model
  const user = await userModel.findOne({ username: req.session.passport.user });
  if (user.isAdmin) {
    try {
      const post = await postModel.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.json(post);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  } else {
    res.status(403).json({ message: 'Access denied' });
  }
});

// Route to add a comment
router.post('/comment/:postId', isLoggedIn, async function (req, res) {
  try {
    const post = await postModel.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const user = await userModel.findOne({ username: req.session.passport.user });
    const newComment = {
      user: user._id,
      text: req.body.text
    };
    post.comments.push(newComment);
    await post.save();
    res.json({ success: true, comment: newComment, user: { username: user.username } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to delete a comment
router.delete('/comment/:commentId', isLoggedIn, async function (req, res) {
  try {
    const post = await postModel.findOne({ 'comments._id': req.params.commentId });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const comment = post.comments.id(req.params.commentId);
    if (comment.user.toString() !== req.session.passport.user) {
      return res.status(403).json({ message: 'Access denied' });
    }
    comment.remove();
    await post.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
