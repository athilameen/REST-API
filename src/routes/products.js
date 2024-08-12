const express = require("express");
const router = express.Router();

const checkAuth = require('../middleware/check-auth');
const ProductsController = require('../controllers/products');

const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads');
    //cb(null, process.cwd()+'/uploads');
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {  
  // reject a file
  if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});


router.get("/", ProductsController.allProducts);

router.post("/", checkAuth, upload.single('image'), ProductsController.createProduct);

router.get("/:productId", ProductsController.getProduct);

router.patch("/:productId", checkAuth, upload.single('image'), ProductsController.updateProduct);

router.delete("/:productId", checkAuth, ProductsController.deleteProduct);

module.exports = router;