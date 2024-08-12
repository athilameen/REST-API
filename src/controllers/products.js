const mongoose = require("mongoose");
const Product = require("../models/product");
const Joi = require('joi')
const joiValidate = require('../utils/joiValidate')

exports.allProducts = async (req, res) => {

    try{

        const result = await Product.find().select("name price image _id").exec();

        let response;
        if(result.length > 0) {
            response = {
                count: result.length,
                products: result.map(data => {
                  return {
                    _id: data._id,
                    image: data.image,
                    name: data.name,
                    price: data.price
                  };
                })
            };
        } else {
            response = {message: "No products available."}
        }
        
        res.success(response, 'Product List');
        
    } catch(err){

        res.status(500).json({
          message: 'Internal server error',
          error: err || 'Something Wrong!'
        });

    }

};

exports.createProduct = async (req, res) => {

    try{
        
        if (!req.file) {
            return res.status(400).send({ message: `Product Image couldn't be uploaded due to not meeting our criteria.`});
        }

        const schema = Joi.object({
            name: Joi.string().required().label("Product Name"),
            price: Joi.number().required().label("Price"),            
        });

        const { success: valid, message: error } = await joiValidate(schema, req.body);

        if (!valid){
            return res.status(403).json({error});
        }

        const product = new Product({
            _id: new mongoose.Types.ObjectId(),
            name: req.body.name,
            price: req.body.price,
            image: req.file.path
        });

        const result = await product.save();

        if(result){
            const response = {
                _id: result._id,
                name: result.name,
                price: result.price,
            }        
            res.status(201).success(response, 'The product has been successfully created.');
        } else {
            res.status(409).json({ message: "Failed to create the product. Please try again."});
        }
        
    } catch(err){
        
        res.status(500).json({
          message: 'Internal server error',
          error: err || 'Something Wrong!'
        });
    }

};

exports.getProduct = async (req, res) => {

    try{

        const productId = req.params.productId
        const result = await Product.findById(productId).select("name image price _id").exec();

        if(result){
            res.success(result, 'Product Found');
        } else {
            res.status(404).json({message: 'No product found'})
        }
        
    } catch(err){

        res.status(500).json({
          message: 'Internal server error',
          error: err || 'Something Wrong!'
        });

    }

};

exports.updateProduct = async (req, res) => {

    try{

        const productId = req.params.productId;
        const getProduct = await Product.findById(productId); 

        if(getProduct){

            const schema = Joi.object({
                name: Joi.string().required().label("Product Name"),
                price: Joi.number().required().label("Price"),            
            });

            if(!req?.file){
                delete req.body.image;
            }
    
            const { success: valid, message: error } = await joiValidate(schema, req.body);
    
            if (!valid){
                return res.status(403).json({error});
            }

            const productData = {
                name: req.body.name,
                price: req.body.price,
            }

            if(req?.file){
                productData.image = req.file.path;
            }

            const result = await Product.updateOne(productData);
            
            let resultMessage;
            if(result.acknowledged){
                resultMessage = "Product Updated successfully"
            } else {
                resultMessage = "Product Update failed"
            }
            res.success({_id: getProduct._id}, resultMessage);
            
        } else {
            res.status(404).json({
                error : "Product not found"
            })
        }
        
    } catch(err){
                
        res.status(500).json({
          message: 'Internal server error',
          error: err || 'Something Wrong!'
        });
    }

};

exports.deleteProduct = async (req, res) => {

    try{

        const productId = req.params.productId;

        const getProduct = await Product.findById(productId); 
        if(getProduct){

            const result = await Product.deleteOne({_id: productId });            
            let resultMessage;
            if(result.deletedCount > 0){
                resultMessage = "The product has been successfully deleted."
            } else {
                resultMessage = "Failed to delete the product. Please try again."
            }
            res.success({ message: resultMessage});
            
        } else {
            res.status(404).json({
                error : "Product not found."
            })
        }
        
    } catch(err){
                
        res.status(500).json({
          message: 'Internal server error',
          error: err || 'Something Wrong!'
        });
    }

};