import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ngeniusService from '../services/ngeniusService.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';

// Create N-Genius payment order
export const createNGeniusPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: "Order is already paid"
      });
    }

    // Create payment order with N-Genius
    const paymentData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      currency: "AED",
      customer: order.customer
    };

    const ngeniusResponse = await ngeniusService.createPaymentOrder(paymentData);

    // Update order with N-Genius data
    order.paymentGateway = "ngenius";
    order.paymentGatewayOrderId = ngeniusResponse.reference;
    order.paymentUrl = ngeniusResponse._links.payment.href;
    order.paymentGatewayResponse = ngeniusResponse;
    
    await order.save();

    res.json({
      success: true,
      message: "Payment order created successfully",
      data: {
        paymentUrl: ngeniusResponse._links.payment.href,
        orderId: order._id,
        ngeniusOrderId: ngeniusResponse.reference
      }
    });

  } catch (error) {
    console.error('Error creating N-Genius payment:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: error.message
    });
  }
};

// Handle N-Genius webhook
export const handleNGeniusWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-ngenius-signature'] || req.headers['authorization'];

    // Verify webhook signature (implement based on N-Genius documentation)
    // const isValid = ngeniusService.verifyWebhookSignature(payload, signature);
    // if (!isValid) {
    //   return res.status(401).json({ success: false, message: "Invalid signature" });
    // }

    // Extract order information from webhook
    const { orderReference, state, amount } = payload;
    
    // Find order by N-Genius order reference
    const order = await Order.findOne({ 
      paymentGatewayOrderId: orderReference 
    });

    if (!order) {
      console.error('Order not found for N-Genius reference:', orderReference);
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Store old status before updating
    const oldStatus = order.status;

    // Update order status based on payment result
    if (state === 'CAPTURED') {
      order.paymentStatus = 'paid';
      order.paymentGatewayStatus = 'captured';
      order.status = 'processing'; // Move to processing
    } else if (state === 'FAILED') {
      order.paymentStatus = 'failed';
      order.paymentGatewayStatus = 'failed';
    } else if (state === 'CANCELLED') {
      order.paymentStatus = 'failed';
      order.paymentGatewayStatus = 'cancelled';
    }

    // Store webhook response
    order.paymentGatewayResponse = {
      ...order.paymentGatewayResponse,
      webhook: payload
    };

    await order.save();

    // Handle stock deduction when status changes to "processing"
    if (oldStatus !== 'processing' && order.status === 'processing') {
      console.log(`🔄 Processing order ${order.orderNumber} from payment webhook - deducting stock...`);
      
      for (const item of order.items) {
        try {
          // Skip if productId is not valid
          if (!item.productId) {
            console.warn(`⚠️ Skipping item ${item.productName} - no productId`);
            continue;
          }

          // Find the product
          const product = await Product.findById(item.productId);
          
          if (!product) {
            console.warn(`⚠️ Product not found for item ${item.productName} (ID: ${item.productId})`);
            continue;
          }

          // Find the matching variant by size and color
          const variant = product.variants.find(v => 
            v.size === item.variant.size && 
            v.color.name === item.variant.color
          );

          if (!variant) {
            console.warn(`⚠️ Variant not found for product ${product.title} - Size: ${item.variant.size}, Color: ${item.variant.color}`);
            continue;
          }

          // Check if sufficient stock is available
          if (variant.stock < item.quantity) {
            console.warn(`⚠️ Insufficient stock for variant ${variant.sku}. Available: ${variant.stock}, Required: ${item.quantity}`);
            // Still deduct what's available, but log a warning
            variant.stock = 0;
          } else {
            // Deduct stock
            variant.stock -= item.quantity;
            console.log(`✅ Stock deducted: ${variant.sku} - ${item.quantity} units. Remaining: ${variant.stock}`);
          }

          // Save the product with updated stock
          await product.save();
        } catch (itemError) {
          console.error(`❌ Error processing stock for item ${item.productName}:`, itemError);
          // Continue with other items even if one fails
        }
      }
      
      console.log(`✅ Stock deduction completed for order ${order.orderNumber}`);
    }

    // Send confirmation email if payment successful
    if (state === 'CAPTURED') {
      try {
        await sendOrderConfirmationEmail(order);
        console.log('✅ Payment successful, order confirmation email sent:', order.orderNumber);
      } catch (emailError) {
        console.error('❌ Email sending failed after payment success:', emailError);
      }
    }

    res.status(200).json({ success: true, message: "Webhook processed successfully" });

  } catch (error) {
    console.error('Error processing N-Genius webhook:', error);
    res.status(500).json({
      success: false,
      message: "Failed to process webhook",
      error: error.message
    });
  }
};

// Handle payment success (when user returns from N-Genius)
export const handlePaymentSuccess = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if payment is actually successful
    if (order.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: "Payment already confirmed",
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          total: order.total
        }
      });
    }

    // If payment is still pending, check with N-Genius for status
    if (order.paymentStatus === 'pending' && order.paymentGatewayOrderId) {
      try {
        // Check payment status with N-Genius
        const paymentStatus = await ngeniusService.getPaymentStatus(order.paymentGatewayOrderId);
        
        console.log('🔍 handlePaymentSuccess - Full payment status response:', JSON.stringify(paymentStatus, null, 2));
        
        // Check if payment is successful - N-Genius response structure
        const isSuccessful = paymentStatus._embedded && 
                            paymentStatus._embedded.payment && 
                            paymentStatus._embedded.payment.length > 0 &&
                            (paymentStatus._embedded.payment[0].state === 'CAPTURED' || 
                             paymentStatus._embedded.payment[0].state === 'PURCHASED');
        
        const paymentState = paymentStatus._embedded?.payment?.[0]?.state;
        console.log('🔍 handlePaymentSuccess - Payment state:', paymentState);
        console.log('🔍 handlePaymentSuccess - Is payment successful?', isSuccessful);
        
        if (isSuccessful) {
          // Store old status before updating
          const oldStatus = order.status;
          
          // Update order status
          order.paymentStatus = 'paid';
          order.paymentGatewayStatus = 'captured';
          order.status = 'processing';
          await order.save();

          // Handle stock deduction when status changes to "processing"
          if (oldStatus !== 'processing') {
            console.log(`🔄 Processing order ${order.orderNumber} from payment success - deducting stock...`);
            
            for (const item of order.items) {
              try {
                // Skip if productId is not valid
                if (!item.productId) {
                  console.warn(`⚠️ Skipping item ${item.productName} - no productId`);
                  continue;
                }

                // Find the product
                const product = await Product.findById(item.productId);
                
                if (!product) {
                  console.warn(`⚠️ Product not found for item ${item.productName} (ID: ${item.productId})`);
                  continue;
                }

                // Find the matching variant by size and color
                const variant = product.variants.find(v => 
                  v.size === item.variant.size && 
                  v.color.name === item.variant.color
                );

                if (!variant) {
                  console.warn(`⚠️ Variant not found for product ${product.title} - Size: ${item.variant.size}, Color: ${item.variant.color}`);
                  continue;
                }

                // Check if sufficient stock is available
                if (variant.stock < item.quantity) {
                  console.warn(`⚠️ Insufficient stock for variant ${variant.sku}. Available: ${variant.stock}, Required: ${item.quantity}`);
                  // Still deduct what's available, but log a warning
                  variant.stock = 0;
                } else {
                  // Deduct stock
                  variant.stock -= item.quantity;
                  console.log(`✅ Stock deducted: ${variant.sku} - ${item.quantity} units. Remaining: ${variant.stock}`);
                }

                // Save the product with updated stock
                await product.save();
              } catch (itemError) {
                console.error(`❌ Error processing stock for item ${item.productName}:`, itemError);
                // Continue with other items even if one fails
              }
            }
            
            console.log(`✅ Stock deduction completed for order ${order.orderNumber}`);
          }

          // Send confirmation email
          try {
            await sendOrderConfirmationEmail(order);
            console.log('✅ Payment confirmed, order confirmation email sent:', order.orderNumber);
          } catch (emailError) {
            console.error('❌ Email sending failed after payment confirmation:', emailError);
          }

          return res.json({
            success: true,
            message: "Payment confirmed successfully",
            data: {
              orderId: order._id,
              orderNumber: order.orderNumber,
              paymentStatus: order.paymentStatus,
              status: order.status,
              total: order.total
            }
          });
        } else if (paymentStatus._embedded && 
                   paymentStatus._embedded.payment && 
                   paymentStatus._embedded.payment.length > 0 &&
                   (paymentStatus._embedded.payment[0].state === 'FAILED' || 
                    paymentStatus._embedded.payment[0].state === 'CANCELLED')) {
          order.paymentStatus = 'failed';
          order.paymentGatewayStatus = paymentStatus._embedded.payment[0].state.toLowerCase();
          await order.save();

          return res.json({
            success: false,
            message: "Payment failed",
            data: {
              orderId: order._id,
              orderNumber: order.orderNumber,
              paymentStatus: order.paymentStatus
            }
          });
        }
      } catch (statusError) {
        console.error('❌ Error checking payment status:', statusError);
        console.error('❌ Status error details:', statusError.response?.data || statusError.message);
      }
    }

    // If payment is still pending, redirect to payment URL
    if (order.paymentStatus === 'pending' && order.paymentUrl) {
      return res.json({
        success: false,
        message: "Payment not completed yet",
        data: {
          paymentUrl: order.paymentUrl,
          orderId: order._id
        }
      });
    }

    res.status(400).json({
      success: false,
      message: "Invalid payment status"
    });

  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({
      success: false,
      message: "Failed to handle payment success",
      error: error.message
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('🔍 getPaymentStatus called with orderId:', orderId);
    console.log('🔍 orderId type:', typeof orderId);
    console.log('🔍 orderId length:', orderId?.length);
    
    let order = await Order.findById(orderId);
    
    // If not found by ObjectId, try to find by N-Genius order ID
    if (!order) {
      console.log('🔍 Order not found by ObjectId, trying to find by paymentGatewayOrderId');
      order = await Order.findOne({ paymentGatewayOrderId: orderId });
    }
    
    if (!order) {
      console.log('🔍 Order not found by either ObjectId or paymentGatewayOrderId');
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    console.log('🔍 Order found:', order.orderNumber);

    // If payment is pending, check with N-Genius and send email if successful
    console.log('🔍 getPaymentStatus called for order:', order.orderNumber);
    console.log('🔍 Order paymentStatus:', order.paymentStatus);
    console.log('🔍 Order paymentGatewayOrderId:', order.paymentGatewayOrderId);
    
    if (order.paymentStatus === 'pending' && order.paymentGatewayOrderId) {
      try {
        console.log('🔍 Checking payment status with N-Genius for order:', order.orderNumber);
        console.log('🔍 Using paymentGatewayOrderId:', order.paymentGatewayOrderId);
        const paymentStatus = await ngeniusService.getPaymentStatus(order.paymentGatewayOrderId);
        
        console.log('🔍 Full payment status response:', JSON.stringify(paymentStatus, null, 2));
        
        // Check if payment is successful - N-Genius response structure
        const isSuccessful = paymentStatus._embedded && 
                            paymentStatus._embedded.payment && 
                            paymentStatus._embedded.payment.length > 0 &&
                            (paymentStatus._embedded.payment[0].state === 'CAPTURED' || 
                             paymentStatus._embedded.payment[0].state === 'PURCHASED');
        
        console.log('🔍 Payment state:', paymentStatus._embedded?.payment?.[0]?.state);
        console.log('🔍 Is payment successful?', isSuccessful);
        
        if (isSuccessful) {
          // Store old status before updating
          const oldStatus = order.status;
          
          // Update order status
          order.paymentStatus = 'paid';
          order.paymentGatewayStatus = 'captured';
          order.status = 'processing';
          await order.save();

          // Handle stock deduction when status changes to "processing"
          if (oldStatus !== 'processing') {
            console.log(`🔄 Processing order ${order.orderNumber} from payment status check - deducting stock...`);
            
            for (const item of order.items) {
              try {
                // Skip if productId is not valid
                if (!item.productId) {
                  console.warn(`⚠️ Skipping item ${item.productName} - no productId`);
                  continue;
                }

                // Find the product
                const product = await Product.findById(item.productId);
                
                if (!product) {
                  console.warn(`⚠️ Product not found for item ${item.productName} (ID: ${item.productId})`);
                  continue;
                }

                // Find the matching variant by size and color
                const variant = product.variants.find(v => 
                  v.size === item.variant.size && 
                  v.color.name === item.variant.color
                );

                if (!variant) {
                  console.warn(`⚠️ Variant not found for product ${product.title} - Size: ${item.variant.size}, Color: ${item.variant.color}`);
                  continue;
                }

                // Check if sufficient stock is available
                if (variant.stock < item.quantity) {
                  console.warn(`⚠️ Insufficient stock for variant ${variant.sku}. Available: ${variant.stock}, Required: ${item.quantity}`);
                  // Still deduct what's available, but log a warning
                  variant.stock = 0;
                } else {
                  // Deduct stock
                  variant.stock -= item.quantity;
                  console.log(`✅ Stock deducted: ${variant.sku} - ${item.quantity} units. Remaining: ${variant.stock}`);
                }

                // Save the product with updated stock
                await product.save();
              } catch (itemError) {
                console.error(`❌ Error processing stock for item ${item.productName}:`, itemError);
                // Continue with other items even if one fails
              }
            }
            
            console.log(`✅ Stock deduction completed for order ${order.orderNumber}`);
          }

          // Send confirmation email
          try {
            await sendOrderConfirmationEmail(order);
            console.log('✅ Payment confirmed via status check, order confirmation email sent:', order.orderNumber);
          } catch (emailError) {
            console.error('❌ Email sending failed after payment confirmation via status check:', emailError);
          }
        } else if (paymentStatus._embedded && 
                   paymentStatus._embedded.payment && 
                   paymentStatus._embedded.payment.length > 0 &&
                   (paymentStatus._embedded.payment[0].state === 'FAILED' || 
                    paymentStatus._embedded.payment[0].state === 'CANCELLED')) {
          order.paymentStatus = 'failed';
          order.paymentGatewayStatus = paymentStatus._embedded.payment[0].state.toLowerCase();
          await order.save();
        }
      } catch (statusError) {
        console.error('Error checking payment status with N-Genius:', statusError);
      }
    } else {
      console.log('🔍 Not checking with N-Genius because:');
      console.log('🔍 - paymentStatus is pending:', order.paymentStatus === 'pending');
      console.log('🔍 - paymentGatewayOrderId exists:', !!order.paymentGatewayOrderId);
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        status: order.status,
        paymentGatewayStatus: order.paymentGatewayStatus,
        total: order.total,
        currency: "AED",
        customer: order.customer,
        items: order.items,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment status",
      error: error.message
    });
  }
};

// Manual email sending for testing (admin only)
export const sendTestEmail = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    try {
      await sendOrderConfirmationEmail(order);
      console.log('✅ Test email sent successfully for order:', order.orderNumber);
      
      res.json({
        success: true,
        message: "Test email sent successfully",
        data: {
          orderNumber: order.orderNumber,
          email: order.customer.email
        }
      });
    } catch (emailError) {
      console.error('❌ Test email sending failed:', emailError);
      res.status(500).json({
        success: false,
        message: "Failed to send test email",
        error: emailError.message
      });
    }

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message
    });
  }
};
