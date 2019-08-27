var multer = require('multer');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads')
    },
    filename: (req, file, cb) => {
        let name = file.originalname;
        cb(null, Date.now()+'-'+name);
    }
});
var upload = multer({storage: storage});

module.exports = upload;