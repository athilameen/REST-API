const express = require("express");
const multer = require('multer');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const ProductsController = require('../controllers/products');

/*
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads');
    //cb(null, process.cwd()+'/uploads');
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});
*/

const fileFilter = (req, file, cb) => {  
  // reject a file
  if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const awsUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 2 //2MB
  },
  fileFilter: fileFilter
});

router.get("/", ProductsController.allProducts);

router.post("/", checkAuth, awsUpload.single('image'), ProductsController.createProduct);

//router.post("/upload", checkAuth, awsUpload.single('image'), ProductsController.uploadProduct);

router.get("/:productId", ProductsController.getProduct);

router.patch("/:productId", checkAuth, awsUpload.single('image'), ProductsController.updateProduct);

router.delete("/:productId", checkAuth, ProductsController.deleteProduct);

module.exports = router;