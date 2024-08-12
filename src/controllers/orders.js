const mongoose = require("mongoose");
const Joi = require('joi')
const joiValidate = require('../utils/joiValidate')

const Order = require("../models/order");
const Product = require("../models/product");

exports.orderList = async (req, res) => {

    try{

        const result = await Order.find().select("product quantity _id").populate("product", "name image price").exec();
        
        let response;
        if(result.length > 0) {
            response = {
                count: result.length,
                orders: result.map(data => {
                  return {
                    product: data.product,
                    quantity: data.quantity,
                    _id: data._id,
                  };
                })
            };
        } else {
            response = {message: "No orders available."}
        }
        
        res.success(response, 'Order List');

    } catch(err){
        res.status(500).json({
            message: 'Internal server error',
            error: err || 'Something Wrong!'
        });
    }

};

exports.createOrder = async (req, res) => {

    try{

        const schema = Joi.object({
            product: Joi.string().required().label("Product"),
            quantity: Joi.number().required().min(1).label("Quantity"),
        });        

        const { success: valid, message: error } = await joiValidate(schema, req.body);
        
        if (!valid){
            return res.status(403).json({error});
        }

        const productId = req.body.product;
        const getProduct = await Product.findById(productId);         

        if(getProduct){

            const order = new Order({
                _id: new mongoose.Types.ObjectId(),
                product: productId,
                quantity: req.body.quantity,
            });

            const result = await order.save();            

            if(result){
                const response = {
                    order : {
                        _id: result._id,
                        product: result.product,
                        quantity: result.quantity,
                    }
                }        
                res.status(201).success(response, 'The order has been successfully created.');
            } else {
                res.status(409).json({ message: "Failed to create the order. Please try again."});
            }

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

exports.getOrder = async (req, res) => {

    try{

        const orderId = req.params.orderId
        const result = await Order.findById(orderId).select("product quantity _id").populate("product", "name image price").exec();

        if(result){
            res.success(result, 'Order Found');
        } else {
            res.status(404).json({message: 'No order found'})
        }
        
    } catch(err){

        res.status(500).json({
          message: 'Internal server error',
          error: err || 'Something Wrong!'
        });

    }
};

exports.deleteOrder = async (req, res) => {

    try{

        const orderId = req.params.orderId;

        const getOrder = await Order.findById(orderId); 
        if(getOrder){

            const result = await Order.deleteOne({_id: orderId });            
            let resultMessage;
            if(result.deletedCount > 0){
                resultMessage = "The order has been successfully deleted."
            } else {
                resultMessage = "Failed to delete the order. Please try again."
            }
            res.success({ message: resultMessage});
            
        } else {
            res.status(404).json({
                error : "Order not found."
            })
        }
        
    } catch(err){
                
        res.status(500).json({
          message: 'Internal server error',
          error: err || 'Something Wrong!'
        });
    }

};